using Backend.Auth.Dto;
using Backend.Data;
using Backend.Email;
using Backend.Helpers;
using Backend.Storage;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using OpenIddict.Abstractions;
using System.Text;
using System.Text.Json;

namespace Backend.Auth.Controllers
{
    /// <summary>
    /// Handles WebAuthn/FIDO2 passkey registration, sign-in, listing, and deletion.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    [Produces("application/json")]
    public class PasskeyController : AuthControllerBase
    {
        public PasskeyController(
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

        /// <summary>
        /// Begins a new passkey registration ceremony for the authenticated user.
        /// Returns WebAuthn creation options and a challenge ID for completing registration.
        /// </summary>
        [Authorize]
        [HttpPost("passkeys/register/begin")]
        public async Task<IActionResult> BeginPasskeyRegistration()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var existingKeys = await Db.UserPasskeys
                .Where(p => p.UserId == user.Id)
                .Select(p => new PublicKeyCredentialDescriptor(p.CredentialId))
                .ToListAsync();

            var fidoUser = new Fido2User
            {
                Id = Encoding.UTF8.GetBytes(user.Id),
                Name = user.Email ?? user.UserName ?? "user",
                DisplayName = user.DisplayName ?? user.Email ?? "User"
            };

            var options = Fido2.RequestNewCredential(new RequestNewCredentialParams
            {
                User = fidoUser,
                ExcludeCredentials = existingKeys,
                AuthenticatorSelection = new AuthenticatorSelection
                {
                    ResidentKey = ResidentKeyRequirement.Preferred,
                    UserVerification = UserVerificationRequirement.Preferred
                },
                AttestationPreference = AttestationConveyancePreference.None
            });

            var challengeId = Guid.NewGuid().ToString();
            await Cache.SetStringAsync($"fido2:reg:{challengeId}", options.ToJson(),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) });

            return Ok(new { options, challengeId });
        }

        /// <summary>
        /// Completes passkey registration by verifying the attestation response
        /// and storing the credential.
        /// </summary>
        [Authorize]
        [HttpPost("passkeys/register/complete")]
        public async Task<IActionResult> CompletePasskeyRegistration([FromBody] PasskeyRegisterRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var optionsJson = await Cache.GetStringAsync($"fido2:reg:{request.ChallengeId}");
            if (optionsJson == null)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.NoPendingRegistration });

            await Cache.RemoveAsync($"fido2:reg:{request.ChallengeId}");

            var options = CredentialCreateOptions.FromJson(optionsJson);

            AuthenticatorAttestationRawResponse attestationResponse;
            try { attestationResponse = JsonSerializer.Deserialize<AuthenticatorAttestationRawResponse>(request.AttestationResponseJson)!; }
            catch { return BadRequest(new ErrorResponse { Error = BackendMessageKeys.InvalidAttestationResponse }); }

            var credential = await Fido2.MakeNewCredentialAsync(new MakeNewCredentialParams
            {
                AttestationResponse = attestationResponse,
                OriginalOptions = options,
                IsCredentialIdUniqueToUserCallback = async (args, ct) =>
                {
                    return !await Db.UserPasskeys.AnyAsync(p => p.CredentialId == args.CredentialId, ct);
                }
            });

            var passkey = new UserPasskey
            {
                UserId = user.Id,
                Name = request.Name,
                CredentialId = credential.Id,
                PublicKey = credential.PublicKey,
                SignCount = credential.SignCount,
                CredType = credential.Type.ToString(),
                AaGuid = credential.AaGuid,
            };

            Db.UserPasskeys.Add(passkey);
            await Db.SaveChangesAsync();

            return Ok(new PasskeyInfo { Id = passkey.Id, Name = passkey.Name, CreatedAt = passkey.CreatedAt });
        }

        /// <summary>
        /// Begins a passkey sign-in ceremony (unauthenticated).
        /// Returns WebAuthn assertion options and a challenge ID.
        /// </summary>
        [HttpPost("passkeys/signin/begin")]
        public async Task<IActionResult> BeginPasskeySignIn()
        {
            var (options, challengeId) = await CreatePasskeyAssertionChallengeAsync();

            return Ok(new { options, challengeId });
        }

        [HttpPost("2fa/passkeys/begin")]
        public async Task<IActionResult> BeginTwoFactorPasskeySignIn([FromBody] BeginTwoFactorPasskeyRequest request)
        {
            var user = await GetTwoFactorChallengeUserAsync(request.TwoFactorId);
            if (user == null || !user.IsTotpEnabled)
            {
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.InvalidOrExpiredTwoFactorChallenge });
            }

            var passkeys = await GetPasskeyCredentialDescriptorsAsync(user);
            if (passkeys.Count == 0)
            {
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.NoPasskeysAvailableForThisAccount });
            }

            var (options, challengeId) = await CreatePasskeyAssertionChallengeAsync(user);
            return Ok(new { options, challengeId });
        }

        /// <summary>
        /// Lists all passkeys registered to the current user.
        /// </summary>
        [Authorize]
        [HttpGet("passkeys")]
        public async Task<IActionResult> ListPasskeys()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var passkeys = await Db.UserPasskeys
                .Where(p => p.UserId == user.Id)
                .Select(p => new PasskeyInfo { Id = p.Id, Name = p.Name, CreatedAt = p.CreatedAt })
                .ToListAsync();

            return Ok(passkeys);
        }

        /// <summary>
        /// Deletes a passkey. Requires sudo mode.
        /// </summary>
        [Authorize]
        [HttpDelete("passkeys/{id:guid}")]
        public async Task<IActionResult> DeletePasskey(Guid id, [FromBody] HighSecurityRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // Enforce sudo mode
            if (!HasSudoClaim()) return BadRequest(new ErrorResponse { Error = BackendMessageKeys.RequiresElevatedPermissions });

            var passkey = await Db.UserPasskeys
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == user.Id);
            if (passkey == null) return NotFound();

            Db.UserPasskeys.Remove(passkey);
            await Db.SaveChangesAsync();

            return NoContent();
        }
    }
}
