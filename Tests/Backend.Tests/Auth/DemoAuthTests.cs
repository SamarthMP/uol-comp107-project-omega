using Backend.Tests.Contracts;
using Backend.Tests.Infrastructure;
using System.Net;

namespace Backend.Tests.Auth
{
    public class DemoAuthTests : IClassFixture<MeadowHouseFactory>
    {
        private readonly MeadowHouseFactory Factory;

        public DemoAuthTests(MeadowHouseFactory factory)
        {
            Factory = factory;
        }

        [Fact]
        public async Task DemoGrant_ReturnsBearerAccessAndRefreshTokens()
        {
            using var client = Factory.CreateApiClient();

            using var response = await client.PostDemoGrantAsync();
            var token = await response.ExpectJsonAsync<TokenResponseDto>(HttpStatusCode.OK);

            Assert.Equal("Bearer", token.TokenType);
            Assert.False(string.IsNullOrWhiteSpace(token.AccessToken));
            Assert.False(string.IsNullOrWhiteSpace(token.RefreshToken));
            Assert.True(token.ExpiresIn > 0);
        }

        [Fact]
        public async Task DemoGrant_SignsInAsPasswordlessDemoUser()
        {
            using var session = await Factory.SignInDemoUserAsync();

            Assert.Matches(@"^Demo User \d{4}$", session.DisplayName);
            Assert.EndsWith("@demo.meadowhouse.invalid", session.Profile.Email);
            Assert.False(session.Profile.HasPassword);
        }

        [Fact]
        public async Task DemoGrant_GivesEverySessionItsOwnAccount()
        {
            using var first = await Factory.SignInDemoUserAsync();
            using var second = await Factory.SignInDemoUserAsync();

            Assert.NotEqual(first.UserId, second.UserId);
            Assert.NotEqual(first.AccessToken, second.AccessToken);
        }

        [Fact]
        public async Task RefreshToken_KeepsTheSameDemoAccount()
        {
            using var session = await Factory.SignInDemoUserAsync();
            using var anonymous = Factory.CreateApiClient();

            using var refreshResponse = await anonymous.PostRefreshGrantAsync(session.Token.RefreshToken!);
            var refreshed = await refreshResponse.ExpectJsonAsync<TokenResponseDto>(HttpStatusCode.OK);

            using var refreshedClient = Factory.CreateApiClient(refreshed.AccessToken);
            using var profileResponse = await refreshedClient.GetAsync(DemoAuth.ProfilePath);
            var profile = await profileResponse.ExpectJsonAsync<ProfileDto>(HttpStatusCode.OK);

            Assert.Equal(session.UserId, profile.Id);
            Assert.Equal(session.DisplayName, profile.DisplayName);
        }
    }
}
