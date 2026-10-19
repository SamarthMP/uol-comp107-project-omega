using Backend.Auth.Providers;
using Backend.Helpers;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Auth.Dto
{
    public class SignUpRequest
    {
        [Required, EmailAddress, MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(8), MaxLength(128)]
        public string Password { get; set; } = string.Empty;

        [MaxLength(128)]
        public string? DisplayName { get; set; }
    }

    public class UserProfileResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public bool IsTotpEnabled { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool HasPasskeys { get; set; }
        public bool HasExternalLogin { get; set; }
        public bool HasPassword { get; set; }
        public List<string> Permissions { get; set; } = [];
    }

    public class UpdateProfileRequest
    {
        [MaxLength(128)]
        public string? DisplayName { get; set; }
    }

    public class TotpSetupResponse
    {
        public string SharedKey { get; set; } = string.Empty;
        public string AuthenticatorUri { get; set; } = string.Empty;
    }

    public class TotpVerifyRequest
    {
        [Required, StringLength(6, MinimumLength = 6)]
        public string Code { get; set; } = string.Empty;
    }

    /// <summary>
    /// A request that requires sudo mode
    /// </summary>
    public class HighSecurityRequest
    {   
        // Empty for now
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;

        [Required, MinLength(8), MaxLength(128)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class DeleteAccountRequest
    {
        public string Password { get; set; } = string.Empty;

        [Required]
        public string Confirmation { get; set; } = string.Empty;
    }

    public class PasskeyRegisterRequest
    {
        [Required]
        public string ChallengeId { get; set; } = string.Empty;

        [Required, MaxLength(256)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string AttestationResponseJson { get; set; } = string.Empty;
    }

    public class PasskeyInfo
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class SetProfilePictureUrlRequest
    {
        [Required, Url, MaxLength(512)]
        public string Url { get; set; } = string.Empty;
    }

    public class ErrorResponse
    {
        public string Error { get; set; } = string.Empty;
        public Dictionary<string, string[]>? Errors { get; set; }
    }

    public static class SecurityCheckpointMethodNames
    {
        public const string Password = "password";
        public const string Totp = "totp";
        public const string Passkey = "passkey";
    }

    public class SecurityCheckpointResponse
    {
        public List<string> Methods { get; set; } = [];
        public string? DisplayName { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }

    public class PendingTwoFactorState
    {
        public string UserId { get; set; } = string.Empty;
    }

    public class TwoFactorRequiredResponse
    {
        [JsonPropertyName("error")]
        public string Error { get; set; } = "2fa_required";

        [JsonPropertyName("error_description")]
        public string ErrorDescription { get; set; } = BackendMessageKeys.TwoFactorAuthenticationRequired;

        public string TwoFactorId { get; set; } = string.Empty;
        public List<string> Methods { get; set; } = [];
        public string? DisplayName { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }

    public class BeginTwoFactorPasskeyRequest
    {
        [Required]
        public string TwoFactorId { get; set; } = string.Empty;
    }

    #region Email verification, password reset, email change

    public class RequestOtpRequest
    {
        [Required, EmailAddress, MaxLength(256)]
        public string Email { get; set; } = string.Empty;
    }

    public class VerifyEmailRequest
    {
        [Required, StringLength(6, MinimumLength = 6)]
        public string Code { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        [Required, EmailAddress, MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required, StringLength(6, MinimumLength = 6)]
        public string Code { get; set; } = string.Empty;

        [Required, MinLength(8), MaxLength(128)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ChangeEmailRequest
    {
        [Required, EmailAddress, MaxLength(256)]
        public string NewEmail { get; set; } = string.Empty;
    }

    public class ConfirmChangeEmailRequest
    {
        [Required, StringLength(6, MinimumLength = 6)]
        public string Code { get; set; } = string.Empty;
    }

    public class AuthConfigResponse
    {
        public bool EmailEnabled { get; set; }
        public string AppName => AuthConfig.AppName;
        public List<AuthProviderInfo> Providers { get; set; } = [];
    }

    #endregion

    #region SSO / External providers

    /// <summary>
    /// Configuration schema for external OAuth providers (loaded from appsettings).
    /// </summary>
    public class ExternalProviderConfig
    {
        public string Name { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? IconUrl { get; set; }
    }

    /// <summary>
    /// Provider metadata returned to the frontend for rendering SSO buttons.
    /// </summary>
    public class ExternalProviderInfo
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
    }

    #endregion

}
