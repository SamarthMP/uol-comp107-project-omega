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
    /// Handles profile picture upload, URL-based set, retrieval, and deletion.
    /// Supports blob storage and external URL references.
    /// </summary>
    [ApiController]
    [Route("api/auth")]
    [Produces("application/json")]
    public class ProfilePictureController : AuthControllerBase
    {
        private const int MaxProfilePictureSizeBytes = 5 * 1024 * 1024;
        private static readonly string[] AllowedImageTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];

        public ProfilePictureController(
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
        /// Serves a profile picture by user ID or direct blob/URL reference.
        /// </summary>
        [HttpGet("pfp/{pfpID}")]
        public async Task<IActionResult> GetProfilePicture(string pfpID)
        {
            var profilePictureID = "";

            // Determine whether the caller passed a blob/URL reference or a user ID
            if (pfpID.StartsWith("blob:") || pfpID.StartsWith("http"))
            {
                profilePictureID = Uri.UnescapeDataString(pfpID);
            }
            else
            {
                var user = await UserManager.FindByIdAsync(pfpID);
                profilePictureID = user?.ProfilePicture ?? "";
            }

            if (string.IsNullOrEmpty(profilePictureID)) return NotFound();

            // Redirect to external URLs directly
            if (profilePictureID.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                profilePictureID.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return Redirect(profilePictureID);

            // Serve from blob storage
            if (profilePictureID.StartsWith("blob:"))
            {
                var blob = await BlobStorage.GetAsync(profilePictureID[5..]);
                if (blob == null) return NotFound();
                return File(blob.Data, blob.ContentType);
            }

            return NotFound();
        }

        [Authorize]
        [HttpPost("pfp/upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadProfilePicture(IFormFile file)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (file.Length > MaxProfilePictureSizeBytes)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.FileTooLarge });

            if (!AllowedImageTypes.Contains(file.ContentType.ToLowerInvariant()))
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.InvalidFileType });

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            var blobKey = $"pfp/{Guid.NewGuid()}";
            await BlobStorage.SaveAsync(blobKey, ms.ToArray(), file.ContentType);

            // Clean up the previous blob if it was stored internally
            if (user.ProfilePicture != null && user.ProfilePicture.StartsWith("blob:") && user.ProfilePicture != $"blob:{blobKey}")
                await BlobStorage.DeleteAsync(user.ProfilePicture[5..]);

            user.ProfilePicture = $"blob:{blobKey}";
            await UserManager.UpdateAsync(user);

            return Ok(await BuildProfileResponse(user));
        }

        [Authorize]
        [HttpPost("pfp/url")]
        public async Task<IActionResult> SetProfilePictureUrl([FromBody] SetProfilePictureUrlRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // Clean up existing blob before switching to an external URL
            if (user.ProfilePicture != null && user.ProfilePicture.StartsWith("blob:"))
                await BlobStorage.DeleteAsync(user.ProfilePicture[5..]);

            user.ProfilePicture = request.Url;
            await UserManager.UpdateAsync(user);

            return Ok(await BuildProfileResponse(user));
        }

        [Authorize]
        [HttpDelete("pfp")]
        public async Task<IActionResult> DeleteProfilePicture()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (user.ProfilePicture != null && user.ProfilePicture.StartsWith("blob:"))
                await BlobStorage.DeleteAsync(user.ProfilePicture[5..]);

            user.ProfilePicture = null;
            await UserManager.UpdateAsync(user);

            return Ok(await BuildProfileResponse(user));
        }
    }
}
