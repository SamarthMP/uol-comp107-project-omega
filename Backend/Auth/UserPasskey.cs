using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Auth
{
    /// <summary>
    /// Stores a FIDO2/WebAuthn passkey credential for a user.
    /// </summary>
    public class UserPasskey
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        /// <summary>Friendly name for this passkey (e.g., "MacBook Pro", "YubiKey")</summary>
        [MaxLength(256)]
        public string Name { get; set; } = string.Empty;

        /// <summary>The FIDO2 credential ID (base64url-encoded)</summary>
        public byte[] CredentialId { get; set; } = [];

        /// <summary>The FIDO2 public key (CBOR-encoded)</summary>
        public byte[] PublicKey { get; set; } = [];

        /// <summary>Signature counter for replay protection</summary>
        public uint SignCount { get; set; }

        /// <summary>The credential type (e.g., "public-key")</summary>
        public string CredType { get; set; } = string.Empty;

        /// <summary>The attestation format used during registration</summary>
        public Guid AaGuid { get; set; }

        /// <summary>Transports supported by this credential</summary>
        public string? Transports { get; set; }

        /// <summary>Whether this credential is user-verifying</summary>
        public bool IsUserVerifying { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
