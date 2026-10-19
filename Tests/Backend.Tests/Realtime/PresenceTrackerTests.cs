using Backend.Repairs.Realtime;

namespace Backend.Tests.Realtime
{
    public class PresenceTrackerTests
    {
        private readonly PresenceTracker Tracker = new();

        [Fact]
        public void UserWithSeveralConnections_AppearsOnce()
        {
            Tracker.Connect("tab-1", "alice", "Demo User 1111", null);
            Tracker.Connect("tab-2", "alice", "Demo User 1111", null);
            Tracker.Connect("tab-3", "bob", "Demo User 2222", null);

            var users = Tracker.Snapshot();

            Assert.Equal(["alice", "bob"], users.Select(user => user.UserId));
        }

        [Fact]
        public void ViewingJobs_AreCombinedAcrossConnectionsWithoutDuplicates()
        {
            Tracker.Connect("tab-1", "alice", "Demo User 1111", null);
            Tracker.Connect("tab-2", "alice", "Demo User 1111", null);
            Tracker.Connect("tab-3", "alice", "Demo User 1111", null);

            Tracker.SetViewing("tab-1", 4);
            Tracker.SetViewing("tab-2", 4);
            Tracker.SetViewing("tab-3", 9);

            var alice = Assert.Single(Tracker.Snapshot());
            Assert.Equal([4, 9], alice.ViewingJobIds.Order());
        }

        [Fact]
        public void SetViewing_ReportsWhetherAnythingChanged()
        {
            Tracker.Connect("tab-1", "alice", "Demo User 1111", null);

            Assert.True(Tracker.SetViewing("tab-1", 4));
            Assert.False(Tracker.SetViewing("tab-1", 4));
            Assert.True(Tracker.SetViewing("tab-1", null));
            Assert.False(Tracker.SetViewing("tab-1", null));
        }

        [Fact]
        public void SetViewing_ForUnknownConnection_ReturnsFalse()
        {
            Assert.False(Tracker.SetViewing("missing", 4));
            Assert.Empty(Tracker.Snapshot());
        }

        [Fact]
        public void Disconnect_RemovesUserOnlyAfterTheirLastConnection()
        {
            Tracker.Connect("tab-1", "alice", "Demo User 1111", null);
            Tracker.Connect("tab-2", "alice", "Demo User 1111", null);

            Tracker.Disconnect("tab-1");
            Assert.Single(Tracker.Snapshot());

            Tracker.Disconnect("tab-2");
            Assert.Empty(Tracker.Snapshot());
        }

        [Fact]
        public void UpdateProfile_RenamesEveryConnectionOfThatUser()
        {
            Tracker.Connect("tab-1", "alice", "Demo User 1111", null);
            Tracker.Connect("tab-2", "alice", "Demo User 1111", null);
            Tracker.Connect("tab-3", "bob", "Demo User 2222", null);

            Tracker.UpdateProfile("alice", "Alice Smith", "/avatar.png");

            var users = Tracker.Snapshot();
            var alice = users.Single(user => user.UserId == "alice");
            Assert.Equal("Alice Smith", alice.DisplayName);
            Assert.Equal("/avatar.png", alice.ProfilePictureUrl);
            Assert.Equal("Demo User 2222", users.Single(user => user.UserId == "bob").DisplayName);
        }
    }
}
