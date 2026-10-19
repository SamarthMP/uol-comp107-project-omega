using Backend.Auth.Dto;
using Backend.Data;
using Backend.Email;
using Backend.Helpers;
using Backend.Storage;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Backend.Auth.Controllers
{
    /// <summary>
    /// Shared base class for all auth-related controllers.
    /// Provides common services and helper methods used across auth endpoints.
    /// </summary>
    public abstract class AuthControllerBase : ControllerBase
    {
        protected readonly UserManager<ApplicationUser> UserManager;
        protected readonly SignInManager<ApplicationUser> SignInManager;
        protected readonly ApplicationDbContext Db;
        protected readonly IBlobStorage BlobStorage;
        protected readonly IOpenIddictTokenManager TokenManager;
        protected readonly IConfiguration Config;
        protected readonly IFido2 Fido2;
        protected readonly IDistributedCache Cache;
        protected readonly IEmailService EmailService;

        protected AuthControllerBase(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ApplicationDbContext db,
            IBlobStorage blobStorage,
            IOpenIddictTokenManager tokenManager,
            IConfiguration config,
            IFido2 fido2,
            IDistributedCache cache,
            IEmailService emailService)
        {
            UserManager = userManager;
            SignInManager = signInManager;
            Db = db;
            BlobStorage = blobStorage;
            TokenManager = tokenManager;
            Config = config;
            Fido2 = fido2;
            Cache = cache;
            EmailService = emailService;
        }

        #region Helpers

        /// <summary>
        /// Checks whether the current bearer token has the sudo claim.
        /// </summary>
        protected bool HasSudoClaim()
        {
            return User.HasClaim("sudo", "true");
        }

        /// <summary>
        /// Creates a short-lived access token with a sudo claim.
        /// The sudo claim is not persisted through refresh, so it
        /// automatically downgrades when the token expires.
        /// </summary>
        protected Task<ClaimsPrincipal> CreateSudoPrincipalAsync(ApplicationUser user)
        {
            var identity = new ClaimsIdentity(
                OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                Claims.Name, Claims.Role);

            identity.SetClaim(Claims.Subject, user.Id);
            identity.SetClaim(Claims.Email, user.Email);
            identity.SetClaim(Claims.Name, user.DisplayName ?? user.Email);
            identity.AddClaim(new Claim("sudo", "true"));

            // No offline_access scope: sudo tokens don't issue refresh tokens

            identity.SetDestinations(claim => claim.Type switch
            {
                Claims.Name or Claims.Email => [Destinations.AccessToken],
                _ => [Destinations.AccessToken],
            });

            var principal = new ClaimsPrincipal(identity);
            principal.SetAccessTokenLifetime(TimeSpan.FromMinutes(15));
            return Task.FromResult(principal);
        }

        /// <summary>
        /// Resolves the current authenticated user from the bearer token claims.
        /// </summary>
        protected async Task<ApplicationUser?> GetCurrentUserAsync()
        {
            var userId = User.FindFirst(Claims.Subject)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userId != null ? await UserManager.FindByIdAsync(userId) : null;
        }

        /// <summary>
        /// Creates an OpenIddict claims principal for token issuance.
        /// </summary>
        protected Task<ClaimsPrincipal> CreatePrincipalAsync(ApplicationUser user)
        {
            var identity = new ClaimsIdentity(
                OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                Claims.Name, Claims.Role);

            identity.SetClaim(Claims.Subject, user.Id);
            identity.SetClaim(Claims.Email, user.Email);
            identity.SetClaim(Claims.Name, user.DisplayName ?? user.Email);

            identity.SetScopes(Scopes.OfflineAccess);

            identity.SetDestinations(claim => claim.Type switch
            {
                Claims.Name or Claims.Email => [Destinations.AccessToken],
                _ => [Destinations.AccessToken],
            });

            return Task.FromResult(new ClaimsPrincipal(identity));
        }

        /// <summary>
        /// Builds a standard profile response DTO for the given user,
        /// including password, passkey, 2FA, and external login status.
        /// </summary>
        protected async Task<UserProfileResponse> BuildProfileResponse(ApplicationUser user)
        {
            var hasPasskeys = await Db.UserPasskeys.AnyAsync(p => p.UserId == user.Id);
            var hasExternalLogin = (await UserManager.GetLoginsAsync(user)).Count > 0;
            var hasPassword = await UserManager.HasPasswordAsync(user);
            var permissions = await PermissionResolver.ResolveUserFlagsAsync(Db, user.Id, HttpContext);

            return new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email ?? "",
                DisplayName = user.DisplayName,
                ProfilePictureUrl = GetProfilePictureUrl(user),
                IsTotpEnabled = user.IsTotpEnabled,
                IsEmailVerified = user.IsEmailVerified || hasExternalLogin,
                HasPasskeys = hasPasskeys,
                HasExternalLogin = hasExternalLogin,
                HasPassword = hasPassword,
                Permissions = permissions,
            };
        }

        protected async Task<List<string>> GetSecurityCheckpointMethodsAsync(ApplicationUser user, bool includePassword)
        {
            var methods = new List<string>();

            if (includePassword && await UserManager.HasPasswordAsync(user))
            {
                methods.Add(SecurityCheckpointMethodNames.Password);
            }

            if (user.IsTotpEnabled)
            {
                methods.Add(SecurityCheckpointMethodNames.Totp);
            }

            if (await Db.UserPasskeys.AnyAsync(p => p.UserId == user.Id))
            {
                methods.Add(SecurityCheckpointMethodNames.Passkey);
            }

            return methods;
        }

        protected async Task<SecurityCheckpointResponse> BuildSecurityCheckpointAsync(ApplicationUser user, bool includePassword)
        {
            return new SecurityCheckpointResponse
            {
                Methods = await GetSecurityCheckpointMethodsAsync(user, includePassword),
                DisplayName = user.DisplayName ?? user.Email,
                ProfilePictureUrl = GetProfilePictureUrl(user),
            };
        }

        protected async Task<string> CreateTwoFactorChallengeAsync(ApplicationUser user)
        {
            var twoFactorId = Guid.NewGuid().ToString("N");
            var state = JsonSerializer.Serialize(new PendingTwoFactorState { UserId = user.Id });

            await Cache.SetStringAsync(
                $"auth:2fa:{twoFactorId}",
                state,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                });

            return twoFactorId;
        }

        protected async Task<ApplicationUser?> GetTwoFactorChallengeUserAsync(string twoFactorId)
        {
            var stateJson = await Cache.GetStringAsync($"auth:2fa:{twoFactorId}");
            if (string.IsNullOrWhiteSpace(stateJson))
            {
                return null;
            }

            PendingTwoFactorState? state;
            try
            {
                state = JsonSerializer.Deserialize<PendingTwoFactorState>(stateJson);
            }
            catch
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(state?.UserId))
            {
                return null;
            }

            return await UserManager.FindByIdAsync(state.UserId);
        }

        protected Task ClearTwoFactorChallengeAsync(string twoFactorId)
        {
            return Cache.RemoveAsync($"auth:2fa:{twoFactorId}");
        }

        protected async Task<List<PublicKeyCredentialDescriptor>> GetPasskeyCredentialDescriptorsAsync(ApplicationUser user)
        {
            return await Db.UserPasskeys
                .Where(p => p.UserId == user.Id)
                .Select(p => new PublicKeyCredentialDescriptor(p.CredentialId))
                .ToListAsync();
        }

        protected async Task<(AssertionOptions Options, string ChallengeId)> CreatePasskeyAssertionChallengeAsync(ApplicationUser? user = null)
        {
            var allowedCredentials = user == null
                ? []
                : await GetPasskeyCredentialDescriptorsAsync(user);

            var options = Fido2.GetAssertionOptions(new GetAssertionOptionsParams
            {
                AllowedCredentials = allowedCredentials,
                UserVerification = UserVerificationRequirement.Preferred
            });

            var challengeId = Guid.NewGuid().ToString("N");
            await Cache.SetStringAsync(
                $"fido2:assert:{challengeId}",
                options.ToJson(),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                });

            return (options, challengeId);
        }

        /// <summary>
        /// Resolves the public URL for a user's profile picture.
        /// Returns null if no picture is set.
        /// </summary>
        protected string? GetProfilePictureUrl(ApplicationUser user)
        {
            if (user.ProfilePicture == null) return null;

            if (user.ProfilePicture.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                user.ProfilePicture.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return user.ProfilePicture;

            if (user.ProfilePicture.StartsWith("blob:"))
                return $"/api/auth/pfp/{Uri.EscapeDataString(user.ProfilePicture)}";

            return null;
        }

        /// <summary>
        /// Returns an OpenIddict Forbid result with a structured error.
        /// Used by the token endpoint to return OAuth2-compliant errors.
        /// </summary>
        protected IActionResult ForbidOpenIddict(string error, string description)
        {
            return Forbid(
                authenticationSchemes: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                properties: new Microsoft.AspNetCore.Authentication.AuthenticationProperties(
                    new Dictionary<string, string?>
                    {
                        [OpenIddictServerAspNetCoreConstants.Properties.Error] = error,
                        [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = description,
                    }));
        }

        /// <summary>
        /// Decodes a base64url-encoded string to a byte array.
        /// </summary>
        protected static byte[] Base64UrlDecode(string input)
        {
            var s = input.Replace('-', '+').Replace('_', '/');
            switch (s.Length % 4)
            {
                case 2: s += "=="; break;
                case 3: s += "="; break;
            }
            return Convert.FromBase64String(s);
        }

        /// <summary>
        /// Verifies a WebAuthn assertion against stored passkey credentials.
        /// Returns the matched user on success, or null on failure.
        /// </summary>
        protected async Task<ApplicationUser?> VerifyPasskeyAssertionAsync(string challengeId, string assertionJson)
        {
            var optionsJson = await Cache.GetStringAsync($"fido2:assert:{challengeId}");
            if (optionsJson == null) return null;

            await Cache.RemoveAsync($"fido2:assert:{challengeId}");

            var options = AssertionOptions.FromJson(optionsJson);

            AuthenticatorAssertionRawResponse assertionResponse;
            try { assertionResponse = System.Text.Json.JsonSerializer.Deserialize<AuthenticatorAssertionRawResponse>(assertionJson)!; }
            catch { return null; }

            var credId = Base64UrlDecode(assertionResponse.Id);
            var passkey = await Db.UserPasskeys.FirstOrDefaultAsync(p => p.CredentialId == credId);
            if (passkey == null) return null;

            var result = await Fido2.MakeAssertionAsync(new MakeAssertionParams
            {
                AssertionResponse = assertionResponse,
                OriginalOptions = options,
                StoredPublicKey = passkey.PublicKey,
                StoredSignatureCounter = passkey.SignCount,
                IsUserHandleOwnerOfCredentialIdCallback = async (args, ct) =>
                {
                    var userIdStr = System.Text.Encoding.UTF8.GetString(args.UserHandle);
                    var userPasskeys = await Db.UserPasskeys.Where(p => p.UserId == userIdStr).ToListAsync(ct);
                    return userPasskeys.Any(p => p.CredentialId.AsSpan().SequenceEqual(args.CredentialId));
                }
            });

            passkey.SignCount = result.SignCount;
            await Db.SaveChangesAsync();

            return await UserManager.FindByIdAsync(passkey.UserId);
        }

        #endregion
    }
}
