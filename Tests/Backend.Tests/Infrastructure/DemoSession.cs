using Backend.Tests.Contracts;

namespace Backend.Tests.Infrastructure
{
    /// <summary>
    /// A signed-in "Demo User NNNN" account with an HTTP client that sends its bearer token.
    /// </summary>
    public sealed class DemoSession : IDisposable
    {
        public required HttpClient Client { get; init; }

        public required TokenResponseDto Token { get; init; }

        public required ProfileDto Profile { get; init; }

        public string AccessToken => Token.AccessToken;

        public string UserId => Profile.Id;

        public string DisplayName => Profile.DisplayName ?? string.Empty;

        public void Dispose()
        {
            Client.Dispose();
        }
    }
}
