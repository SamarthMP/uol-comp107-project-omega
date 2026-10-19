using Backend.Tests.Contracts;
using Backend.Tests.Infrastructure;
using System.Net;
using System.Text.Json;

namespace Backend.Tests.Realtime
{
    /// <summary>
    /// Browsers cannot send headers on WebSocket upgrades, so the hub must accept the token from the access_token query string.
    /// </summary>
    public class HubAuthenticationTests : IClassFixture<MeadowHouseFactory>
    {
        private readonly MeadowHouseFactory Factory;

        public HubAuthenticationTests(MeadowHouseFactory factory)
        {
            Factory = factory;
        }

        [Fact]
        public async Task Negotiate_WithTokenOnlyInQueryString_Succeeds()
        {
            var token = await Factory.RequestDemoTokenAsync();
            using var client = Factory.CreateApiClient();

            using var response = await client.PostAsync(NegotiatePath(token.AccessToken), content: null);
            await response.ExpectStatusAsync(HttpStatusCode.OK);

            using var negotiation = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.False(string.IsNullOrEmpty(negotiation.RootElement.GetProperty("connectionToken").GetString()));
            Assert.Contains(
                negotiation.RootElement.GetProperty("availableTransports").EnumerateArray(),
                transport => transport.GetProperty("transport").GetString() == "WebSockets");
        }

        [Fact]
        public async Task Negotiate_WithInvalidQueryStringToken_Returns401()
        {
            using var client = Factory.CreateApiClient();

            using var response = await client.PostAsync(NegotiatePath("not-a-real-token"), content: null);

            await response.ExpectStatusAsync(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task WebSocket_WithTokenOnlyInQueryString_ReceivesPresenceAndJobChanges()
        {
            using var session = await Factory.SignInDemoUserAsync();
            await using var hub = await RepairsHubClient.ConnectWithQueryStringTokenAsync(Factory, session.AccessToken);

            var presence = await hub.Presence.WaitForAsync("own presence", users => users.Any(user => user.UserId == session.UserId));
            Assert.Equal(session.DisplayName, presence.Single(user => user.UserId == session.UserId).DisplayName);

            var job = await session.Client.ReportAsync("Garden fence damaged", "Alex Morgan", RepairPriorities.Urgent);
            var change = await hub.JobChanges.WaitForAsync("the reported job", candidate => candidate.Job.Id == job.Id);
            Assert.Equal(RepairHistoryTypes.Reported, change.Kind);
        }

        [Fact]
        public async Task RestEndpoint_WithTokenOnlyInQueryString_Returns401()
        {
            var token = await Factory.RequestDemoTokenAsync();
            using var client = Factory.CreateApiClient();

            using var response = await client.GetAsync($"/api/repairs/jobs?access_token={Uri.EscapeDataString(token.AccessToken)}");

            await response.ExpectStatusAsync(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task Responses_IncludeNoSniffHeader()
        {
            using var session = await Factory.SignInDemoUserAsync();

            using var response = await session.Client.GetAsync("/api/repairs/jobs");

            await response.ExpectStatusAsync(HttpStatusCode.OK);
            Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
        }

        [Fact]
        public async Task WebSocket_WithInvalidQueryStringToken_IsRefused()
        {
            await Assert.ThrowsAnyAsync<Exception>(() => RepairsHubClient.ConnectWithQueryStringTokenAsync(Factory, "not-a-real-token"));
        }

        private static string NegotiatePath(string accessToken)
        {
            return $"{RepairsHubClient.HubPath}/negotiate?negotiateVersion=1&access_token={Uri.EscapeDataString(accessToken)}";
        }
    }
}
