using Backend.Tests.Contracts;
using Backend.Tests.Infrastructure;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Backend.Tests.Auth
{
    public class UnauthenticatedAccessTests : IClassFixture<MeadowHouseFactory>
    {
        private readonly MeadowHouseFactory Factory;

        public UnauthenticatedAccessTests(MeadowHouseFactory factory)
        {
            Factory = factory;
        }

        public static TheoryData<string, string> ProtectedEndpoints => new()
        {
            { "GET", RepairsApi.JobsPath },
            { "GET", RepairsApi.JobPath(1) },
            { "POST", RepairsApi.JobsPath },
            { "POST", $"{RepairsApi.JobPath(1)}/start" },
            { "POST", $"{RepairsApi.JobPath(1)}/notes" },
            { "POST", $"{RepairsApi.JobPath(1)}/complete" },
            { "POST", $"{RepairsHubClient.HubPath}/negotiate?negotiateVersion=1" },
            { "GET", DemoAuth.ProfilePath },
        };

        [Theory]
        [MemberData(nameof(ProtectedEndpoints))]
        public async Task ProtectedEndpoint_WithoutToken_Returns401(string method, string path)
        {
            using var client = Factory.CreateApiClient();

            using var response = await client.SendAsync(CreateRequest(method, path));

            await response.ExpectStatusAsync(HttpStatusCode.Unauthorized);
        }

        [Theory]
        [MemberData(nameof(ProtectedEndpoints))]
        public async Task ProtectedEndpoint_WithInvalidToken_Returns401(string method, string path)
        {
            using var client = Factory.CreateApiClient();
            var request = CreateRequest(method, path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "not-a-real-token");

            using var response = await client.SendAsync(request);

            await response.ExpectStatusAsync(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task AnonymousReport_DoesNotCreateAJob()
        {
            using var anonymous = Factory.CreateApiClient();
            using var rejected = await anonymous.PostReportAsync(new ReportRepairRequest("Garden fence damaged", "Alex Morgan", RepairPriorities.Urgent));
            await rejected.ExpectStatusAsync(HttpStatusCode.Unauthorized);

            using var session = await Factory.SignInDemoUserAsync();
            var jobs = await session.Client.ListJobsAsync();

            Assert.DoesNotContain(jobs, job => job.Description == "Garden fence damaged");
        }

        private static HttpRequestMessage CreateRequest(string method, string path)
        {
            var request = new HttpRequestMessage(new HttpMethod(method), path);

            if (method == "POST")
            {
                request.Content = JsonContent.Create(new { description = "Garden fence damaged", reporterName = "Alex Morgan", note = "Note", completionNote = "Done" });
            }

            return request;
        }
    }
}
