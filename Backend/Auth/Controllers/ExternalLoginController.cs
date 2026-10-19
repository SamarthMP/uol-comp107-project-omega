using Backend.Auth.Dto;
using Backend.Auth.Providers;
using Backend.Data;
using Backend.Email;
using Backend.Storage;
using Fido2NetLib;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using OpenIddict.Abstractions;
using System.Security.Claims;

namespace Backend.Auth.Controllers
{
    /// <summary>
    /// Handles external/SSO OAuth login flows including challenge initiation,
    /// callback processing, and provider listing.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    [Produces("application/json")]
    public class ExternalLoginController : AuthControllerBase
    {
        public ExternalLoginController(
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
        /// Initiates the external OAuth challenge redirect for the given provider.
        /// </summary>
        [HttpGet("external/challenge/{provider}")]
        public IActionResult ExternalChallenge(string provider, [FromQuery] string returnUrl = "/")
        {
            if (!Url.IsLocalUrl(returnUrl))
                returnUrl = "/";

            var redirectUrl = Url.Action(nameof(ExternalCallback), new { returnUrl });
            var properties = SignInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
            return Challenge(properties, provider);
        }

        /// <summary>
        /// Handles the OAuth callback. Links the external login to an existing account
        /// (matched by email) or creates a new account, then issues a short-lived code
        /// that the frontend exchanges for tokens.
        /// </summary>
        [HttpGet("external/callback")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> ExternalCallback(string returnUrl = "/")
        {
            if (!Url.IsLocalUrl(returnUrl))
                returnUrl = "/";

            var info = await SignInManager.GetExternalLoginInfoAsync();
            if (info == null)
                return Redirect($"{returnUrl}?error=external_login_failed");

            // Try finding an existing user by external login provider
            var user = await UserManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);

            if (user == null)
            {
                // Try matching by email to link to an existing account
                var email = info.Principal.FindFirstValue(ClaimTypes.Email);
                if (email != null)
                {
                    user = await UserManager.FindByEmailAsync(email);
                    if (user != null)
                        await UserManager.AddLoginAsync(user, info);
                }

                // No existing account found, create a new one without a password
                if (user == null)
                {
                    user = new ApplicationUser
                    {
                        UserName = info.Principal.FindFirstValue(ClaimTypes.Email),
                        Email = info.Principal.FindFirstValue(ClaimTypes.Email),
                        DisplayName = info.Principal.FindFirstValue(ClaimTypes.Name),
                        EmailConfirmed = true
                    };

                    var createResult = await UserManager.CreateAsync(user);
                    if (!createResult.Succeeded)
                        return Redirect($"{returnUrl}?error=account_creation_failed");

                    await UserManager.AddLoginAsync(user, info);
                }

            }

            // Try to bind a profile picture if available from the external provider
            var pfp = info.Principal.FindFirstValue("avatar_url");
            if (!string.IsNullOrEmpty(pfp) && string.IsNullOrEmpty(user.ProfilePicture))
            {
                user.ProfilePicture = pfp;
                await UserManager.UpdateAsync(user);
            }

            // Issue a short-lived code the frontend will exchange for tokens
            var code = Convert.ToBase64String(
                System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
            await Cache.SetStringAsync($"ext_login:{code}", user.Id,
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) });

            var separator = returnUrl.Contains('?') ? '&' : '?';
            return Redirect($"{returnUrl}{separator}code={Uri.EscapeDataString(code)}");
        }
    }
}
