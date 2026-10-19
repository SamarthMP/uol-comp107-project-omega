using Backend.Tests.Contracts;
using Backend.Tests.Infrastructure;

namespace Backend.Tests.Realtime
{
    /// <summary>
    /// Two demo users connected to the repairs hub see each other's changes and presence live.
    /// </summary>
    public class RepairsHubTests : IClassFixture<MeadowHouseFactory>
    {
        private readonly MeadowHouseFactory Factory;

        public RepairsHubTests(MeadowHouseFactory factory)
        {
            Factory = factory;
        }

        [Fact]
        public async Task JobChangesFromOneUser_AreBroadcastToAnother()
        {
            using var alice = await Factory.SignInDemoUserAsync();
            using var bob = await Factory.SignInDemoUserAsync();
            await using var aliceHub = await RepairsHubClient.ConnectAsync(Factory, alice.AccessToken);
            await using var bobHub = await RepairsHubClient.ConnectAsync(Factory, bob.AccessToken);

            var reported = await alice.Client.ReportAsync("Garden fence damaged", "Alex Morgan", RepairPriorities.Urgent);
            var reportedChange = await WaitForChangeAsync(bobHub, RepairHistoryTypes.Reported, reported.Id);
            AssertChangeBy(alice, reported, reportedChange);
            Assert.Equal(RepairStatuses.New, reportedChange.Job.Status);

            var started = await alice.Client.StartWorkAsync(reported.Id);
            var startedChange = await WaitForChangeAsync(bobHub, RepairHistoryTypes.WorkStarted, reported.Id);
            AssertChangeBy(alice, started, startedChange);
            Assert.Equal(RepairStatuses.InProgress, startedChange.Job.Status);

            var noted = await alice.Client.AddNoteAsync(reported.Id, "Temporary barrier fitted");
            var notedChange = await WaitForChangeAsync(bobHub, RepairHistoryTypes.ProgressNote, reported.Id);
            AssertChangeBy(alice, noted, notedChange);
            Assert.Equal("Temporary barrier fitted", notedChange.Job.LatestNote);

            var completed = await alice.Client.CompleteAsync(reported.Id, "Fence repaired and checked");
            var completedChange = await WaitForChangeAsync(bobHub, RepairHistoryTypes.Completed, reported.Id);
            AssertChangeBy(alice, completed, completedChange);
            Assert.Equal("Fence repaired and checked", completedChange.Job.CompletionNote);
        }

        [Fact]
        public async Task Presence_ListsEveryConnectedUserOnce()
        {
            using var alice = await Factory.SignInDemoUserAsync();
            using var bob = await Factory.SignInDemoUserAsync();
            await using var aliceHub = await RepairsHubClient.ConnectAsync(Factory, alice.AccessToken);
            await using var bobHub = await RepairsHubClient.ConnectAsync(Factory, bob.AccessToken);

            var seenByBob = await bobHub.Presence.WaitForAsync("presence listing Alice and Bob", users => Lists(users, alice) && Lists(users, bob));
            Assert.Equal(alice.DisplayName, seenByBob.Single(user => user.UserId == alice.UserId).DisplayName);
            Assert.Equal(bob.DisplayName, seenByBob.Single(user => user.UserId == bob.UserId).DisplayName);

            await using var aliceSecondTab = await RepairsHubClient.ConnectAsync(Factory, alice.AccessToken);
            var withSecondTab = await aliceSecondTab.Presence.WaitForAsync("presence after Alice opened a second tab", users => Lists(users, alice) && Lists(users, bob));

            Assert.Single(withSecondTab, user => user.UserId == alice.UserId);
            Assert.Single(withSecondTab, user => user.UserId == bob.UserId);
        }

        [Fact]
        public async Task ViewJob_IsSharedWithOtherUsers()
        {
            using var alice = await Factory.SignInDemoUserAsync();
            using var bob = await Factory.SignInDemoUserAsync();
            await using var aliceHub = await RepairsHubClient.ConnectAsync(Factory, alice.AccessToken);
            await using var bobHub = await RepairsHubClient.ConnectAsync(Factory, bob.AccessToken);
            var job = await alice.Client.ReportAsync("Garden fence damaged", "Alex Morgan");

            var beforeViewing = bobHub.Presence.Count;
            await aliceHub.ViewJobAsync(job.Id);
            var viewing = await bobHub.Presence.WaitForAsync(
                "Alice viewing the job",
                users => users.Any(user => user.UserId == alice.UserId && user.ViewingJobIds.SequenceEqual([job.Id])),
                beforeViewing);
            Assert.Empty(viewing.Single(user => user.UserId == bob.UserId).ViewingJobIds);

            var beforeClosing = bobHub.Presence.Count;
            await aliceHub.ViewJobAsync(null);
            await bobHub.Presence.WaitForAsync(
                "Alice closing the job",
                users => users.Any(user => user.UserId == alice.UserId && user.ViewingJobIds.Count == 0),
                beforeClosing);
        }

        [Fact]
        public async Task Disconnecting_RemovesUserFromPresence()
        {
            using var alice = await Factory.SignInDemoUserAsync();
            using var bob = await Factory.SignInDemoUserAsync();
            await using var aliceHub = await RepairsHubClient.ConnectAsync(Factory, alice.AccessToken);
            await using var bobHub = await RepairsHubClient.ConnectAsync(Factory, bob.AccessToken);
            await bobHub.Presence.WaitForAsync("presence listing Alice", users => Lists(users, alice));

            var beforeLeaving = bobHub.Presence.Count;
            await aliceHub.DisposeAsync();

            await bobHub.Presence.WaitForAsync("presence without Alice", users => !Lists(users, alice) && Lists(users, bob), beforeLeaving);
        }

        private static bool Lists(List<OnlineUserDto> users, DemoSession session)
        {
            return users.Any(user => user.UserId == session.UserId);
        }

        private static Task<RepairJobChangedDto> WaitForChangeAsync(RepairsHubClient hub, string kind, int jobId)
        {
            return hub.JobChanges.WaitForAsync($"{kind} for job {jobId}", change => change.Kind == kind && change.Job.Id == jobId);
        }

        private static void AssertChangeBy(DemoSession actor, RepairJobDto expectedJob, RepairJobChangedDto change)
        {
            Assert.Equal(actor.UserId, change.ActorUserId);
            Assert.Equal(actor.DisplayName, change.ActorName);
            JobAssert.Same(expectedJob, change.Job);
        }
    }
}
