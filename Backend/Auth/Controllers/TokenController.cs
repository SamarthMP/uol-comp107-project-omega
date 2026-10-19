using Backend.Auth.Dto;
using Backend.Data;
using Backend.Email;
using Backend.Helpers;
using Backend.Storage;
using Fido2NetLib;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenIddict.Validation.AspNetCore;
using System.Text;
using System.Text.Json;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Backend.Auth.Controllers
{
    /// <summary>
    /// Handles OpenIddict token issuance for all supported grant types:
    /// password, refresh token, passkey, and external login.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    [Produces("application/json")]
    public class TokenController : AuthControllerBase
    {
        public TokenController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ApplicationDbContext db,
            IBlobStorage blobStorage,
            IOpenIddictTokenManager tokenManager,
            IConfiguration config,
            IFido2 fido2,
            IDistributedCache cache,
            IEmailService emailService)
            : base(userManager, signInManager, db, blobStorage, tokenManager, config, fido2, cache, emailService)
        { }

        [HttpPost("token")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Token()
        {
            var request = HttpContext.GetOpenIddictServerRequest()
                ?? throw new InvalidOperationException("The OpenIddict server request cannot be retrieved.");

            if (request.IsPasswordGrantType())
                return await HandlePasswordGrant(request);

            if (request.IsRefreshTokenGrantType())
                return await HandleRefreshTokenGrant();

            if (request.GrantType == "urn:custom:passkey")
                return await HandlePasskeyGrant(request);

            if (request.GrantType == "urn:custom:external")
                return await HandleExternalGrant(request);

            if (request.GrantType == "urn:custom:sudo")
                return await HandleSudoGrant(request);

            if (request.GrantType == "urn:custom:2fa")
                return await HandleTwoFactorGrant(request);

            if (request.GrantType == DemoAccounts.GrantType)
                return await HandleDemoGrant();

            return ForbidOpenIddict(Errors.UnsupportedGrantType, BackendMessageKeys.UnsupportedGrantType);
        }

        #region Grant type handlers

        private async Task<IActionResult> HandlePasswordGrant(OpenIddictRequest request)
        {
            var user = await UserManager.FindByEmailAsync(request.Username!);
            if (user == null)
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.InvalidEmailOrPassword);

            if (await UserManager.IsLockedOutAsync(user))
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.AccountTemporarilyLocked);

            var passwordResult = await SignInManager.CheckPasswordSignInAsync(user, request.Password!, lockoutOnFailure: true);
            if (!passwordResult.Succeeded)
            {
                if (passwordResult.IsLockedOut)
                    return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.AccountTemporarilyLocked);
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.InvalidEmailOrPassword);
            }

            // Require TOTP verification if 2FA is enabled
            if (user.IsTotpEnabled)
            {
                var totpCode = request.GetParameter("totp_code")?.ToString();
                if (string.IsNullOrEmpty(totpCode))
                {
                    var checkpoint = await BuildSecurityCheckpointAsync(user, includePassword: false);
                    var twoFactorId = await CreateTwoFactorChallengeAsync(user);

                    return BadRequest(new TwoFactorRequiredResponse
                    {
                        TwoFactorId = twoFactorId,
                        Methods = checkpoint.Methods,
                        DisplayName = checkpoint.DisplayName,
                        ProfilePictureUrl = checkpoint.ProfilePictureUrl,
                    });
                }

                var provider = UserManager.Options.Tokens.AuthenticatorTokenProvider;
                if (!await UserManager.VerifyTwoFactorTokenAsync(user, provider, totpCode))
                    return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.InvalidTwoFactorCode);
            }

            // Reset lockout count on successful login
            await UserManager.ResetAccessFailedCountAsync(user);

            return SignIn(await CreatePrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        private async Task<IActionResult> HandleRefreshTokenGrant()
        {
            var result = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            var userId = result.Principal?.GetClaim(Claims.Subject);
            var user = userId != null ? await UserManager.FindByIdAsync(userId) : null;
            if (user == null)
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.UserNoLongerExists);

            return SignIn(await CreatePrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        private async Task<IActionResult> HandlePasskeyGrant(OpenIddictRequest request)
        {
            var challengeId = request.GetParameter("challenge_id")?.ToString();
            var assertionJson = request.GetParameter("assertion_json")?.ToString();
            if (string.IsNullOrEmpty(challengeId) || string.IsNullOrEmpty(assertionJson))
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.MissingChallengeIdOrAssertionJson);

            var user = await VerifyPasskeyAssertionAsync(challengeId, assertionJson);
            if (user == null)
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.PasskeyVerificationFailed);

            return SignIn(await CreatePrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        private async Task<IActionResult> HandleTwoFactorGrant(OpenIddictRequest request)
        {
            var twoFactorId = request.GetParameter("two_factor_id")?.ToString();
            if (string.IsNullOrWhiteSpace(twoFactorId))
            {
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.MissingTwoFactorId);
            }

            var user = await GetTwoFactorChallengeUserAsync(twoFactorId);
            if (user == null || !user.IsTotpEnabled)
            {
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.TwoFactorChallengeInvalidOrExpired);
            }

            var totpCode = request.GetParameter("totp_code")?.ToString();
            if (!string.IsNullOrWhiteSpace(totpCode))
            {
                var provider = UserManager.Options.Tokens.AuthenticatorTokenProvider;
                if (!await UserManager.VerifyTwoFactorTokenAsync(user, provider, totpCode))
                {
                    return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.InvalidTwoFactorCode);
                }

                await ClearTwoFactorChallengeAsync(twoFactorId);
                return SignIn(await CreatePrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            var challengeId = request.GetParameter("challenge_id")?.ToString();
            var assertionJson = request.GetParameter("assertion_json")?.ToString();
            if (!string.IsNullOrWhiteSpace(challengeId) && !string.IsNullOrWhiteSpace(assertionJson))
            {
                if (!await Db.UserPasskeys.AnyAsync(p => p.UserId == user.Id))
                {
                    return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.NoPasskeysAvailableForThisAccount);
                }

                var passkeyUser = await VerifyPasskeyAssertionAsync(challengeId, assertionJson);
                if (passkeyUser == null || passkeyUser.Id != user.Id)
                {
                    return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.PasskeyVerificationFailed);
                }

                await ClearTwoFactorChallengeAsync(twoFactorId);
                return SignIn(await CreatePrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.VerificationFailed);
        }

        private async Task<IActionResult> HandleExternalGrant(OpenIddictRequest request)
        {
            var code = request.GetParameter("code")?.ToString();
            if (string.IsNullOrEmpty(code))
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.MissingCode);

            var userId = await Cache.GetStringAsync($"ext_login:{code}");
            if (userId == null)
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.InvalidOrExpiredCode);

            await Cache.RemoveAsync($"ext_login:{code}");

            var user = await UserManager.FindByIdAsync(userId);
            if (user == null)
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.UserNotFound);

            return SignIn(await CreatePrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        private async Task<IActionResult> HandleSudoGrant(OpenIddictRequest request)
        {
            // Validate the caller's current access token
            var authResult = await HttpContext.AuthenticateAsync(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
            if (!authResult.Succeeded)
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.ValidAccessTokenRequired);

            var userId = authResult.Principal?.GetClaim(Claims.Subject);
            var user = userId != null ? await UserManager.FindByIdAsync(userId) : null;
            if (user == null)
                return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.UserNotFound);

            var hasPassword = await UserManager.HasPasswordAsync(user);
            var hasTotp = user.IsTotpEnabled;
            var hasPasskeys = await Db.UserPasskeys.AnyAsync(p => p.UserId == user.Id);

            // If the account has no security methods, issue sudo token without verification
            if (!hasPassword && !hasTotp && !hasPasskeys)
                return SignIn(await CreateSudoPrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);

            // Verify by password
            var password = request.GetParameter("password")?.ToString();
            if (!string.IsNullOrEmpty(password) && hasPassword)
            {
                var passwordResult = await SignInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
                if (passwordResult.Succeeded)
                    return SignIn(await CreateSudoPrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            // Verify by TOTP code
            var totpCode = request.GetParameter("totp_code")?.ToString();
            if (!string.IsNullOrEmpty(totpCode) && hasTotp)
            {
                var provider = UserManager.Options.Tokens.AuthenticatorTokenProvider;
                if (await UserManager.VerifyTwoFactorTokenAsync(user, provider, totpCode))
                    return SignIn(await CreateSudoPrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            // Verify by passkey assertion
            var challengeId = request.GetParameter("challenge_id")?.ToString();
            var assertionJson = request.GetParameter("assertion_json")?.ToString();
            if (!string.IsNullOrEmpty(challengeId) && !string.IsNullOrEmpty(assertionJson) && hasPasskeys)
            {
                var passkeyUser = await VerifyPasskeyAssertionAsync(challengeId, assertionJson);
                if (passkeyUser != null && passkeyUser.Id == user.Id)
                    return SignIn(await CreateSudoPrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            return ForbidOpenIddict(Errors.InvalidGrant, BackendMessageKeys.VerificationFailed);
        }

        /// <summary>
        /// Creates a fresh passwordless "Demo User NNNN" account and signs it in.
        /// </summary>
        private async Task<IActionResult> HandleDemoGrant()
        {
            var user = DemoAccounts.CreateUser();

            var result = await UserManager.CreateAsync(user);
            if (!result.Succeeded)
                return ForbidOpenIddict(Errors.ServerError, BackendMessageKeys.DemoAccountCreationFailed);

            return SignIn(await CreatePrincipalAsync(user), OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        #endregion


    }
}
