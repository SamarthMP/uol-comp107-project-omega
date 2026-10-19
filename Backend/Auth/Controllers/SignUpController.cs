using Backend.Auth.Dto;
using Backend.Data;
using Backend.Email;
using Backend.Helpers;
using Backend.Storage;
using Fido2NetLib;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Distributed;
using OpenIddict.Abstractions;

namespace Backend.Auth.Controllers
{
    /// <summary>
    /// Handles user registration (sign up).
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    [Produces("application/json")]
    public class SignUpController : AuthControllerBase
    {
        public SignUpController(
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

        [HttpPost("signup")]
        [EnableRateLimiting("signup")]
        public async Task<IActionResult> SignUp([FromBody] SignUpRequest request)
        {
            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                DisplayName = request.DisplayName
            };

            var result = await UserManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new ErrorResponse
                {
                    Error = BackendMessageKeys.RegistrationFailed,
                    Errors = BackendValidationMessages.ToErrorDictionary(result.Errors)
                });
            }

            return Ok(await BuildProfileResponse(user));
        }
    }
}
