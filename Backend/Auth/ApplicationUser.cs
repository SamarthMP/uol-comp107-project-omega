using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace Backend.Auth
{

    public class ApplicationUser : IdentityUser
    {
        /// <summary>
        /// Display name for the user
        /// </summary>
        [MaxLength(128)]
        public string? DisplayName { get; set; }

        /// <summary>
        /// URL or blob key for the profile picture.
        /// If it starts with "blob:", it references a blob storage key.
        /// If it starts with "http", it is an external URL.
        /// Null means no profile picture is set.
        /// </summary>
        [MaxLength(512)]
        public string? ProfilePicture { get; set; }

        /// <summary>
        /// Whether TOTP-based 2FA has been confirmed and is active.
        /// </summary>
        public bool IsTotpEnabled { get; set; }

        /// <summary>
        /// Whether the user's email address has been verified.
        /// </summary>
        public bool IsEmailVerified { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
