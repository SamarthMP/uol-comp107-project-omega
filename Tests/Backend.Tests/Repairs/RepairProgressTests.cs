using Backend.Tests.Contracts;
using Backend.Tests.Infrastructure;

namespace Backend.Tests.Repairs
{
    /// <summary>
    /// Brief tests 6 to 8: progress notes, history and completion.
    /// </summary>
    public class RepairProgressTests : IClassFixture<MeadowHouseFactory>, IAsyncLifetime
    {
        private readonly MeadowHouseFactory Factory;
        private DemoSession Session = null!;

        public RepairProgressTests(MeadowHouseFactory factory)
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
        public async Task Brief06_StartAndProgressNote_ShowInProgressLatestNoteAndDatedHistory()
        {
            var fence = await Session.Client.ReportAsync("Garden fence damaged", "Alex Morgan", RepairPriorities.Urgent);

            var started = await Session.Client.StartWorkAsync(fence.Id);
            Assert.Equal(RepairStatuses.InProgress, started.Status);
            Assert.NotNull(started.StartedAt);
            Assert.Equal(2, started.Version);

            var noted = await Session.Client.AddNoteAsync(fence.Id, "Temporary barrier fitted");
            Assert.Equal(RepairStatuses.InProgress, noted.Status);
            Assert.Equal("Temporary barrier fitted", noted.LatestNote);
            Assert.Equal(3, noted.Version);

            Assert.Equal(
                [RepairHistoryTypes.ProgressNote, RepairHistoryTypes.WorkStarted, RepairHistoryTypes.Reported],
                noted.History.Select(entry => entry.Type));
            Assert.Equal(
                [RepairStatuses.InProgress, RepairStatuses.InProgress, RepairStatuses.New],
                noted.History.Select(entry => entry.Status));

            var noteEntry = noted.History[0];
            Assert.Equal("Temporary barrier fitted", noteEntry.Note);
            Assert.Equal(Session.DisplayName, noteEntry.ActorName);
            Assert.Equal(noteEntry.CreatedAt, noted.LatestNoteAt);

            AssertNewestFirstAndDated(noted.History, fence.CreatedAt);
            Assert.Equal(fence.History[0], noted.History[2]);
            Assert.Equal(started.History[0], noted.History[1]);

            var reloaded = await Session.Client.GetJobAsync(fence.Id);
            Assert.Equal(noted.History, reloaded.History);
            Assert.Equal("Temporary barrier fitted", reloaded.LatestNote);
        }

        [Fact]
        public async Task Brief07_EmptyThenSpacesCompletionNote_AreRejectedAndJobIsUntouched()
        {
            var fence = await ReportStartedFenceWithNoteAsync();
            var savedJson = await Session.Client.GetJobJsonAsync(fence.Id);

            using var empty = await Session.Client.PostCompleteAsync(fence.Id, "");
            await empty.ExpectValidationErrorAsync("CompletionNote", ExpectedMessageKeys.RepairCompletionNoteRequired);

            using var spaces = await Session.Client.PostCompleteAsync(fence.Id, "   ");
            await spaces.ExpectValidationErrorAsync("CompletionNote", ExpectedMessageKeys.RepairCompletionNoteRequired);

            Assert.Equal(savedJson, await Session.Client.GetJobJsonAsync(fence.Id));

            var current = await Session.Client.GetJobAsync(fence.Id);
            Assert.Equal(RepairStatuses.InProgress, current.Status);
            Assert.Equal("Temporary barrier fitted", current.LatestNote);
            Assert.Null(current.CompletionNote);
            Assert.Null(current.CompletedAt);
            Assert.Equal(3, current.History.Count);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("\t\n ")]
        public async Task Brief07_OtherBlankCompletionNotes_AreRejectedAndJobIsUntouched(string? completionNote)
        {
            var fence = await ReportStartedFenceWithNoteAsync();
            var savedJson = await Session.Client.GetJobJsonAsync(fence.Id);

            using var response = await Session.Client.PostCompleteAsync(fence.Id, completionNote);

            await response.ExpectValidationErrorAsync("CompletionNote", ExpectedMessageKeys.RepairCompletionNoteRequired);
            Assert.Equal(savedJson, await Session.Client.GetJobJsonAsync(fence.Id));
        }

        [Fact]
        public async Task Brief08_Complete_ShowsCompletedWithNoteAndKeepsEarlierHistory()
        {
            var noted = await ReportStartedFenceWithNoteAsync();

            var completed = await Session.Client.CompleteAsync(noted.Id, "Fence repaired and checked");

            Assert.Equal(RepairStatuses.Completed, completed.Status);
            Assert.Equal("Fence repaired and checked", completed.CompletionNote);
            Assert.NotNull(completed.CompletedAt);
            Assert.Equal("Temporary barrier fitted", completed.LatestNote);
            Assert.Equal(4, completed.Version);

            var completionEntry = completed.History[0];
            Assert.Equal(RepairHistoryTypes.Completed, completionEntry.Type);
            Assert.Equal(RepairStatuses.Completed, completionEntry.Status);
            Assert.Equal("Fence repaired and checked", completionEntry.Note);
            Assert.Equal(completed.CompletedAt, completionEntry.CreatedAt);

            Assert.Equal(noted.History, completed.History.Skip(1));
            Assert.Contains(completed.History, entry => entry.Type == RepairHistoryTypes.Reported && entry.Status == RepairStatuses.New);
            Assert.Contains(completed.History, entry => entry.Type == RepairHistoryTypes.WorkStarted && entry.Status == RepairStatuses.InProgress);
            AssertNewestFirstAndDated(completed.History, completed.CreatedAt);

            var reloaded = await Session.Client.GetJobAsync(noted.Id);
            Assert.Equal(completed.History, reloaded.History);
            Assert.Equal(RepairStatuses.Completed, reloaded.Status);
            Assert.Equal("Fence repaired and checked", reloaded.CompletionNote);
        }

        private async Task<RepairJobDto> ReportStartedFenceWithNoteAsync()
        {
            var fence = await Session.Client.ReportAsync("Garden fence damaged", "Alex Morgan", RepairPriorities.Urgent);
            await Session.Client.StartWorkAsync(fence.Id);
            return await Session.Client.AddNoteAsync(fence.Id, "Temporary barrier fitted");
        }

        private static void AssertNewestFirstAndDated(IReadOnlyList<RepairHistoryEntryDto> history, DateTimeOffset reportedAt)
        {
            var now = DateTimeOffset.UtcNow.AddSeconds(5);

            foreach (var entry in history)
            {
                Assert.Equal(TimeSpan.Zero, entry.CreatedAt.Offset);
                Assert.InRange(entry.CreatedAt, reportedAt, now);
            }

            for (var index = 1; index < history.Count; index++)
            {
                Assert.True(history[index - 1].CreatedAt >= history[index].CreatedAt, "History should be listed newest first");
            }
        }
    }
}
