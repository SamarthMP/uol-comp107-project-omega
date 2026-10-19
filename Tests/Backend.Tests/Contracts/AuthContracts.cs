using System.Text.Json.Serialization;

namespace Backend.Tests.Contracts
{
    /// <summary>
    /// The OAuth token endpoint response, which uses snake_case names.
    /// </summary>
    public sealed record TokenResponseDto(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("token_type")] string TokenType,
        [property: JsonPropertyName("expires_in")] int ExpiresIn,
        [property: JsonPropertyName("refresh_token")] string? RefreshToken);

    public sealed record ProfileDto(
        string Id,
        string Email,
        string? DisplayName,
        bool HasPassword);

    public sealed record ErrorDto(
        string Error,
        Dictionary<string, string[]>? Errors);
}
