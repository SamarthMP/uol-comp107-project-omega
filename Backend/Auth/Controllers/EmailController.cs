using Backend.Auth.Dto;
using Backend.Auth.Providers;
using Backend.Data;
using Backend.Email;
using Backend.Helpers;
using Backend.Storage;
using Fido2NetLib;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Distributed;
using OpenIddict.Abstractions;
using System.Security.Cryptography;

namespace Backend.Auth.Controllers
{
    [ApiController]
    [Route("api/auth/email")]
    [Produces("application/json")]
    public class EmailController : AuthControllerBase
    {
        public EmailController(
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


        #region Email Verification

        [Authorize]
        [HttpPost("verify/send")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> SendVerificationEmail()
        {
            if (!EmailService.IsEnabled)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.EmailSendingNotConfigured });

            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (user.IsEmailVerified)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.EmailAlreadyVerified });

            var code = GenerateOtp();
            await StoreOtpAsync($"email:verify:{user.Id}", code);

            await EmailService.SendTemplatedEmailAsync(
                user.Email!,
                $"Verify Your Email",
                "otp",
                new Dictionary<string, string>
                {
                    ["Heading"] = "Verify Your Email",
                    ["Message"] = "Use the code below to verify your email address. This code expires in 10 minutes.",
                    ["Code"] = code,
                    ["Footer"] = "If you didn't request this, you can safely ignore this email.",
                });

            return Ok(new { message = BackendMessageKeys.VerificationEmailSent });
        }

        [Authorize]
        [HttpPost("verify/confirm")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ConfirmVerification([FromBody] VerifyEmailRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (user.IsEmailVerified)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.EmailAlreadyVerified });

            var valid = await ValidateOtpAsync($"email:verify:{user.Id}", request.Code);
            if (!valid)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.InvalidOrExpiredCode });

            user.IsEmailVerified = true;
            await UserManager.UpdateAsync(user);

            return Ok(await BuildProfileResponse(user));
        }

        #endregion

        #region Password Reset

        [HttpPost("password-reset/send")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> SendPasswordResetEmail([FromBody] RequestOtpRequest request)
        {
            if (!EmailService.IsEnabled)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.EmailSendingNotConfigured });

            var user = await UserManager.FindByEmailAsync(request.Email);
            if (user == null)
                return Ok(new { message = BackendMessageKeys.ResetEmailSentIfAccountExists });

            var code = GenerateOtp();
            await StoreOtpAsync($"email:reset:{user.Id}", code);


            await EmailService.SendTemplatedEmailAsync(
                user.Email!,
                $"Reset Your Password",
                "otp",
                new Dictionary<string, string>
                {
                    ["Heading"] = "Reset Your Password",
                    ["Message"] = "Use the code below to reset your password. This code expires in 10 minutes.",
                    ["Code"] = code,
                    ["Footer"] = "If you didn't request this, you can safely ignore this email.",
                });

            return Ok(new { message = BackendMessageKeys.ResetEmailSentIfAccountExists });
        }

        [HttpPost("password-reset/confirm")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ConfirmPasswordReset([FromBody] ResetPasswordRequest request)
        {
            if (!EmailService.IsEnabled)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.EmailSendingNotConfigured });

            var user = await UserManager.FindByEmailAsync(request.Email);
            if (user == null)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.InvalidOrExpiredCode });

            var valid = await ValidateOtpAsync($"email:reset:{user.Id}", request.Code);
            if (!valid)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.InvalidOrExpiredCode });

            var token = await UserManager.GeneratePasswordResetTokenAsync(user);
            var result = await UserManager.ResetPasswordAsync(user, token, request.NewPassword);

            if (!result.Succeeded)
            {
                return BadRequest(new ErrorResponse
                {
                    Error = BackendMessageKeys.PasswordResetFailed,
                    Errors = BackendValidationMessages.ToErrorDictionary(result.Errors)
                });
            }

            return Ok(new { message = BackendMessageKeys.PasswordHasBeenReset });
        }

        #endregion

        #region Email Change

        [Authorize]
        [HttpPost("change/send")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> SendChangeEmail([FromBody] ChangeEmailRequest request)
        {
            if (!EmailService.IsEnabled)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.EmailSendingNotConfigured });

            if (!HasSudoClaim())
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.ElevatedPermissionsRequired });

            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var existingUser = await UserManager.FindByEmailAsync(request.NewEmail);
            if (existingUser != null)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.EmailAlreadyInUse });

            var code = GenerateOtp();
            await StoreOtpAsync($"email:change:{user.Id}", code, request.NewEmail);

            await EmailService.SendTemplatedEmailAsync(
                request.NewEmail,
                $"Confirm Email Change",
                "otp",
                new Dictionary<string, string>
                {
                    ["Heading"] = "Confirm Email Change",
                    ["Message"] = "Use the code below to confirm your new email address. This code expires in 10 minutes.",
                    ["Code"] = code,
                    ["Footer"] = "If you didn't request this, you can safely ignore this email.",
                });

            return Ok(new { message = BackendMessageKeys.VerificationEmailSentToNewAddress });
        }

        [Authorize]
        [HttpPost("change/confirm")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ConfirmChangeEmail([FromBody] ConfirmChangeEmailRequest request)
        {
            if (!EmailService.IsEnabled)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.EmailSendingNotConfigured });

            if (!HasSudoClaim())
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.ElevatedPermissionsRequired });

            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var (valid, storedEmail) = await ValidateOtpWithDataAsync($"email:change:{user.Id}", request.Code);
            if (!valid || string.IsNullOrWhiteSpace(storedEmail))
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.InvalidOrExpiredCode });

            var existingUser = await UserManager.FindByEmailAsync(storedEmail);
            if (existingUser != null)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.EmailAlreadyInUse });

            user.Email = storedEmail;
            user.NormalizedEmail = storedEmail.ToUpperInvariant();
            user.UserName = storedEmail;
            user.NormalizedUserName = storedEmail.ToUpperInvariant();
            user.IsEmailVerified = true;

            var updateResult = await UserManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.FailedToUpdateEmail });

            return Ok(await BuildProfileResponse(user));
        }

        #endregion

        #region OTP Helpers

        private static string GenerateOtp()
        {
            return RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        }

        private async Task StoreOtpAsync(string key, string code, string? extraData = null)
        {
            var value = extraData != null ? $"{code}:{extraData}" : code;
            await Cache.SetStringAsync(
                $"otp:{key}",
                value,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
                });
        }

        private async Task<bool> ValidateOtpAsync(string key, string code)
        {
            var cacheKey = $"otp:{key}";
            var stored = await Cache.GetStringAsync(cacheKey);
            if (stored == null) return false;

            var storedCode = stored.Contains(':') ? stored[..stored.IndexOf(':')] : stored;
            if (!string.Equals(storedCode, code, StringComparison.Ordinal)) return false;

            await Cache.RemoveAsync(cacheKey);
            return true;
        }

        private async Task<(bool Valid, string? Data)> ValidateOtpWithDataAsync(string key, string code)
        {
            var cacheKey = $"otp:{key}";
            var stored = await Cache.GetStringAsync(cacheKey);
            if (stored == null) return (false, null);

            var separatorIndex = stored.IndexOf(':');
            var storedCode = separatorIndex >= 0 ? stored[..separatorIndex] : stored;
            var data = separatorIndex >= 0 ? stored[(separatorIndex + 1)..] : null;

            if (!string.Equals(storedCode, code, StringComparison.Ordinal)) return (false, null);

            await Cache.RemoveAsync(cacheKey);
            return (true, data);
        }

        #endregion
    }
}
