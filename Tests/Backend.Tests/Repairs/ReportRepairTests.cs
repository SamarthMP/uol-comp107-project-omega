using Backend.Tests.Contracts;
using Backend.Tests.Infrastructure;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Backend.Tests.Repairs
{
    /// <summary>
    /// Brief tests 1 to 4: reporting a repair, required fields and priority.
    /// </summary>
    public class ReportRepairTests : IClassFixture<MeadowHouseFactory>, IAsyncLifetime
    {
        private const string IsoUtcTimestampPattern = @"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]00:00)$";

        private readonly MeadowHouseFactory Factory;
        private DemoSession Session = null!;

        public ReportRepairTests(MeadowHouseFactory factory)
        {
            Factory = factory;
        }

        public async Task InitializeAsync()
        {
            Session = await Factory.SignInDemoUserAsync();
        }

        public Task DisposeAsync()
        {
            Session.Dispose();
            return Task.CompletedTask;
        }

        [Fact]
        public async Task Brief01_ValidReport_CreatesDistinctNewJob()
        {
            var reportedAfter = DateTimeOffset.UtcNow.AddSeconds(-5);

            using var response = await Session.Client.PostReportAsync(new ReportRepairRequest("Garden fence damaged", "Alex Morgan", RepairPriorities.Urgent));
            var job = await response.ExpectJsonAsync<RepairJobDto>(HttpStatusCode.Created);

            Assert.Equal(RepairStatuses.New, job.Status);
            Assert.Equal("Meadow House", job.HouseName);
            Assert.Equal("Garden fence damaged", job.Description);
            Assert.Equal("Alex Morgan", job.ReporterName);
            Assert.Equal(RepairPriorities.Urgent, job.Priority);
            Assert.Equal(1, job.Version);
            Assert.Null(job.LatestNote);
            Assert.Null(job.CompletionNote);
            Assert.InRange(job.CreatedAt, reportedAfter, DateTimeOffset.UtcNow.AddSeconds(5));

            Assert.True(job.Id > 0);
            Assert.Equal($"MH-{job.Id:D4}", job.Reference);
            Assert.Equal(RepairsApi.JobPath(job.Id), response.Headers.Location?.AbsolutePath);

            var reported = Assert.Single(job.History);
            Assert.Equal(RepairHistoryTypes.Reported, reported.Type);
            Assert.Equal(RepairStatuses.New, reported.Status);
            Assert.Equal(Session.DisplayName, reported.ActorName);
            Assert.Equal(job.CreatedAt, reported.CreatedAt);

            JobAssert.Same(job, await Session.Client.GetJobAsync(job.Id));

            var second = await Session.Client.ReportAsync("Kitchen light flickering", "Sam Lee");
            Assert.NotEqual(job.Id, second.Id);
            Assert.NotEqual(job.Reference, second.Reference);
        }

        [Fact]
        public async Task Brief01_ReportDates_AreUtcIsoTimestampsAfterReloading()
        {
            var job = await Session.Client.ReportAsync("Garden fence damaged", "Alex Morgan", RepairPriorities.Urgent);

            using var document = JsonDocument.Parse(await Session.Client.GetJobJsonAsync(job.Id));
            var root = document.RootElement;

            Assert.Matches(IsoUtcTimestampPattern, root.GetProperty("createdAt").GetString());
            Assert.Matches(IsoUtcTimestampPattern, root.GetProperty("updatedAt").GetString());
            Assert.Matches(IsoUtcTimestampPattern, root.GetProperty("history")[0].GetProperty("createdAt").GetString());
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("\t \n")]
        [InlineData(null)]
        public async Task Brief02_BlankDescription_IsRejectedWithoutCreatingAJob(string? description)
        {
            var jobsBefore = await Session.Client.ListJobsAsync();

            using var response = await Session.Client.PostReportAsync(new ReportRepairRequest(description, "Alex Morgan", RepairPriorities.Urgent));

            await response.ExpectValidationErrorAsync("Description", ExpectedMessageKeys.RepairDescriptionRequired);
            Assert.Equal(jobsBefore.Count, (await Session.Client.ListJobsAsync()).Count);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("\t \n")]
        [InlineData(null)]
        public async Task Brief03_BlankReporter_IsRejectedWithoutCreatingAJob(string? reporterName)
        {
            var jobsBefore = await Session.Client.ListJobsAsync();

            using var response = await Session.Client.PostReportAsync(new ReportRepairRequest("Garden fence damaged", reporterName, RepairPriorities.Urgent));

            await response.ExpectValidationErrorAsync("ReporterName", ExpectedMessageKeys.RepairReporterRequired);
            Assert.Equal(jobsBefore.Count, (await Session.Client.ListJobsAsync()).Count);
        }

        [Fact]
        public async Task Brief02And03_BothBlank_ReportsBothFields()
        {
            using var response = await Session.Client.PostReportAsync(new ReportRepairRequest(" ", " ", RepairPriorities.Normal));

            var error = await response.ExpectValidationErrorAsync("Description", ExpectedMessageKeys.RepairDescriptionRequired);
            Assert.Contains(ExpectedMessageKeys.RepairReporterRequired, error.Errors!["ReporterName"]);
        }

        [Fact]
        public async Task Brief04_EachJobRetainsItsSelectedPriority()
        {
            var normal = await Session.Client.ReportAsync("Dripping bathroom tap", "Alex Morgan", RepairPriorities.Normal);
            var urgent = await Session.Client.ReportAsync("Broken window latch", "Alex Morgan", RepairPriorities.Urgent);

            Assert.Equal(RepairPriorities.Normal, normal.Priority);
            Assert.Equal(RepairPriorities.Urgent, urgent.Priority);

            Assert.Equal(RepairPriorities.Normal, (await Session.Client.GetJobAsync(normal.Id)).Priority);
            Assert.Equal(RepairPriorities.Urgent, (await Session.Client.GetJobAsync(urgent.Id)).Priority);

            var listed = await Session.Client.ListJobsAsync();
            Assert.Equal(RepairPriorities.Normal, listed.Single(job => job.Id == normal.Id).Priority);
            Assert.Equal(RepairPriorities.Urgent, listed.Single(job => job.Id == urgent.Id).Priority);
        }

        [Theory]
        [InlineData("Critical")]
        [InlineData("")]
        [InlineData("urgent!")]
        public async Task UnknownPriorityName_IsRejectedWithoutCreatingAJob(string priority)
        {
            var jobsBefore = await Session.Client.ListJobsAsync();

            using var response = await Session.Client.PostReportAsync(new ReportRepairRequest("Garden fence damaged", "Alex Morgan", priority));

            await response.ExpectErrorAsync(HttpStatusCode.BadRequest, ExpectedMessageKeys.ValidationFailed);
            Assert.Equal(jobsBefore.Count, (await Session.Client.ListJobsAsync()).Count);
        }

        [Fact]
        public async Task OutOfRangePriorityNumber_IsRejectedWithPriorityMessage()
        {
            var jobsBefore = await Session.Client.ListJobsAsync();

            using var response = await Session.Client.PostAsync(RepairsApi.JobsPath, JsonContent.Create(new
            {
                description = "Garden fence damaged",
                reporterName = "Alex Morgan",
                priority = 7,
            }));

            await response.ExpectValidationErrorAsync("Priority", ExpectedMessageKeys.RepairPriorityInvalid);
            Assert.Equal(jobsBefore.Count, (await Session.Client.ListJobsAsync()).Count);
        }
    }
}
