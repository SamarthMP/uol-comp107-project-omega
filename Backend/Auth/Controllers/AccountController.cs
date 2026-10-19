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
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using OpenIddict.Abstractions;

namespace Backend.Auth.Controllers
{
    /// <summary>
    /// Handles account-level operations: password changes, account deletion,
    /// sign out, and sudo-mode verification.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    [Produces("application/json")]
    public class AccountController : AuthControllerBase
    {
        public AccountController(
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


        [HttpGet("config")]
        [Route("/api/auth/config")]
        [AllowAnonymous]
        public IActionResult GetAuthConfig()
        {
            return Ok(new AuthConfigResponse
            {
                EmailEnabled = EmailService.IsEnabled,
                Providers = AuthProviderBase.RegisteredProviders.Select(p => p.GetInfo()).ToList(),
            });
        }

        /// <summary>
        /// Changes the user's password. If the account has no existing password
        /// (SSO-created accounts), sets the password directly.
        /// </summary>
        [Authorize]
        [HttpPost("password/change")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var hasPassword = await UserManager.HasPasswordAsync(user);

            if (!hasPassword)
            {
                // SSO accounts without a password can set one directly
                var addResult = await UserManager.AddPasswordAsync(user, request.NewPassword);
                if (!addResult.Succeeded)
                {
                    return BadRequest(new ErrorResponse
                    {
                        Error = BackendMessageKeys.PasswordChangeFailed,
                        Errors = BackendValidationMessages.ToErrorDictionary(addResult.Errors)
                    });
                }

                return Ok(await BuildProfileResponse(user));
            }

            var result = await UserManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new ErrorResponse
                {
                    Error = BackendMessageKeys.PasswordChangeFailed,
                    Errors = BackendValidationMessages.ToErrorDictionary(result.Errors)
                });
            }

            return Ok(await BuildProfileResponse(user));
        }

        /// <summary>
        /// Permanently deletes the user's account and all associated data.
        /// Requires password confirmation for accounts that have one; otherwise
        /// requires the "DELETE" confirmation string.
        /// </summary>
        [Authorize]
        [HttpDelete("account")]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // Require a sudo token (identity must be verified first)
            if (!HasSudoClaim())
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.IdentityVerificationRequired });

            if (request.Confirmation != "DELETE")
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.DeleteConfirmationRequired });

            // Clean up profile picture blob
            if (user.ProfilePicture != null && user.ProfilePicture.StartsWith("blob:"))
                await BlobStorage.DeleteAsync(user.ProfilePicture[5..]);

            // Remove passkeys
            var passkeys = await Db.UserPasskeys.Where(p => p.UserId == user.Id).ToListAsync();
            Db.UserPasskeys.RemoveRange(passkeys);
            await Db.SaveChangesAsync();

            await UserManager.DeleteAsync(user);

            return NoContent();
        }

        /// <summary>
        /// Revokes all tokens for the current user using a single store-level operation.
        /// </summary>
        [Authorize]
        [HttpPost("signout")]
        public new async Task<IActionResult> SignOut()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            await TokenManager.RevokeBySubjectAsync(user.Id, HttpContext.RequestAborted);

            return NoContent();
        }

        /// <summary>
        /// Returns the user's available sudo verification methods.
        /// The frontend uses this to decide which confirmation UI to show.
        /// </summary>
        [Authorize]
        [HttpGet("sudo/methods")]
        public async Task<IActionResult> GetSudoMethods()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var checkpoint = await BuildSecurityCheckpointAsync(user, includePassword: true);
            return Ok(checkpoint.Methods);
        }

    }
}
