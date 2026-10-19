using Backend.Auth.Dto;
using Backend.Data;
using Backend.Email;
using Backend.Helpers;
using Backend.Storage;
using Fido2NetLib;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using OpenIddict.Abstractions;

namespace Backend.Auth.Controllers
{
    /// <summary>
    /// Handles TOTP-based two-factor authentication setup, verification, and disabling.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    [Produces("application/json")]
    public class TotpController : AuthControllerBase
    {
        public TotpController(
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
        /// Generates a new TOTP shared key and authenticator URI for the current user.
        /// </summary>
        [Authorize]
        [HttpPost("totp/setup")]
        public async Task<IActionResult> SetupTotp()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            await UserManager.ResetAuthenticatorKeyAsync(user);
            var key = await UserManager.GetAuthenticatorKeyAsync(user);
            if (string.IsNullOrEmpty(key)) return StatusCode(500);

            var email = user.Email ?? user.UserName ?? "user";
            var issuer = AuthConfig.AppName;
            var uri = $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(email)}?secret={key}&issuer={Uri.EscapeDataString(issuer)}&digits=6";

            return Ok(new TotpSetupResponse { SharedKey = key, AuthenticatorUri = uri });
        }

        /// <summary>
        /// Verifies a TOTP code and enables 2FA on the account if valid.
        /// </summary>
        [Authorize]
        [HttpPost("totp/verify")]
        public async Task<IActionResult> VerifyTotp([FromBody] TotpVerifyRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var provider = UserManager.Options.Tokens.AuthenticatorTokenProvider;
            var isValid = await UserManager.VerifyTwoFactorTokenAsync(user, provider, request.Code);
            if (!isValid)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.InvalidVerificationCode });

            user.IsTotpEnabled = true;
            await UserManager.SetTwoFactorEnabledAsync(user, true);
            await UserManager.UpdateAsync(user);

            return Ok(await BuildProfileResponse(user));
        }

        /// <summary>
        /// Disables TOTP 2FA. Requires sudo mode,
        /// </summary>
        [Authorize]
        [HttpPost("totp/disable")]
        public async Task<IActionResult> DisableTotp([FromBody] HighSecurityRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // Enforce sudo mode
            if (!HasSudoClaim()) return BadRequest(new ErrorResponse { Error = BackendMessageKeys.ElevatedPermissionsRequired });

            user.IsTotpEnabled = false;
            await UserManager.SetTwoFactorEnabledAsync(user, false);
            await UserManager.ResetAuthenticatorKeyAsync(user);
            await UserManager.UpdateAsync(user);

            return Ok(await BuildProfileResponse(user));
        }
    }
}
