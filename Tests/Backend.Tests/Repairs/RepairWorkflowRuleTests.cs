using Backend.Tests.Contracts;
using Backend.Tests.Infrastructure;
using System.Net;

namespace Backend.Tests.Repairs
{
    /// <summary>
    /// Invalid transitions, unknown jobs and blank progress notes. None of them may change the job.
    /// </summary>
    public class RepairWorkflowRuleTests : IClassFixture<MeadowHouseFactory>, IAsyncLifetime
    {
        private const int UnknownJobId = 987654;

        private readonly MeadowHouseFactory Factory;
        private DemoSession Session = null!;

        public RepairWorkflowRuleTests(MeadowHouseFactory factory)
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
        public async Task StartingTwice_ReturnsConflictAndKeepsJob()
        {
            var job = await Session.Client.ReportAsync("Garden fence damaged", "Alex Morgan");
            await Session.Client.StartWorkAsync(job.Id);
            var savedJson = await Session.Client.GetJobJsonAsync(job.Id);

            using var response = await Session.Client.PostStartAsync(job.Id);

            await response.ExpectErrorAsync(HttpStatusCode.Conflict, ExpectedMessageKeys.RepairJobAlreadyStarted);
            Assert.Equal(savedJson, await Session.Client.GetJobJsonAsync(job.Id));
        }

        [Fact]
        public async Task StartingCompletedJob_ReturnsConflictAndKeepsJob()
        {
            var job = await Session.Client.ReportAndCompleteAsync("Garden fence damaged", "Temporary barrier fitted", "Fence repaired and checked");
            var savedJson = await Session.Client.GetJobJsonAsync(job.Id);

            using var response = await Session.Client.PostStartAsync(job.Id);

            await response.ExpectErrorAsync(HttpStatusCode.Conflict, ExpectedMessageKeys.RepairJobAlreadyCompleted);
            Assert.Equal(savedJson, await Session.Client.GetJobJsonAsync(job.Id));
        }

        [Fact]
        public async Task AddingNoteAfterCompletion_ReturnsConflictAndKeepsJob()
        {
            var job = await Session.Client.ReportAndCompleteAsync("Garden fence damaged", "Temporary barrier fitted", "Fence repaired and checked");
            var savedJson = await Session.Client.GetJobJsonAsync(job.Id);

            using var response = await Session.Client.PostNoteAsync(job.Id, "One more thing");

            await response.ExpectErrorAsync(HttpStatusCode.Conflict, ExpectedMessageKeys.RepairJobAlreadyCompleted);
            Assert.Equal(savedJson, await Session.Client.GetJobJsonAsync(job.Id));
        }

        [Fact]
        public async Task CompletingTwice_ReturnsConflictAndKeepsOriginalCompletionNote()
        {
            var job = await Session.Client.ReportAndCompleteAsync("Garden fence damaged", "Temporary barrier fitted", "Fence repaired and checked");
            var savedJson = await Session.Client.GetJobJsonAsync(job.Id);

            using var response = await Session.Client.PostCompleteAsync(job.Id, "Completed again");

            await response.ExpectErrorAsync(HttpStatusCode.Conflict, ExpectedMessageKeys.RepairJobAlreadyCompleted);
            Assert.Equal(savedJson, await Session.Client.GetJobJsonAsync(job.Id));
            Assert.Equal("Fence repaired and checked", (await Session.Client.GetJobAsync(job.Id)).CompletionNote);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public async Task BlankProgressNote_IsRejectedAndKeepsJob(string? note)
        {
            var job = await Session.Client.ReportAsync("Garden fence damaged", "Alex Morgan");
            await Session.Client.StartWorkAsync(job.Id);
            var savedJson = await Session.Client.GetJobJsonAsync(job.Id);

            using var response = await Session.Client.PostNoteAsync(job.Id, note);

            await response.ExpectValidationErrorAsync("Note", ExpectedMessageKeys.RepairNoteRequired);
            Assert.Equal(savedJson, await Session.Client.GetJobJsonAsync(job.Id));
        }

        [Theory]
        [InlineData("get")]
        [InlineData("start")]
        [InlineData("notes")]
        [InlineData("complete")]
        public async Task UnknownJob_ReturnsNotFound(string action)
        {
            using var response = action switch
            {
                "get" => await Session.Client.GetAsync(RepairsApi.JobPath(UnknownJobId)),
                "start" => await Session.Client.PostStartAsync(UnknownJobId),
                "notes" => await Session.Client.PostNoteAsync(UnknownJobId, "Temporary barrier fitted"),
                _ => await Session.Client.PostCompleteAsync(UnknownJobId, "Fence repaired and checked"),
            };

            await response.ExpectErrorAsync(HttpStatusCode.NotFound, ExpectedMessageKeys.RepairJobNotFound);
        }
    }
}
