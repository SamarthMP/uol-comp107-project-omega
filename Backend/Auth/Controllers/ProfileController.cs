using Backend.Auth.Dto;
using Backend.Data;
using Backend.Email;
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
    /// Handles user profile retrieval and updates (display name, email).
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    [Produces("application/json")]
    public class ProfileController : AuthControllerBase
    {
        public ProfileController(
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

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetProfile()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();
            return Ok(await BuildProfileResponse(user));
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (request.DisplayName != null)
                user.DisplayName = request.DisplayName;

            await UserManager.UpdateAsync(user);
            return Ok(await BuildProfileResponse(user));
        }
    }
}
