using Backend.Repairs.Dto;
using System.Collections.Concurrent;

namespace Backend.Repairs.Realtime
{
    /// <summary>
    /// Thread-safe, in-memory record of who is connected and which job each connection is looking at.
    /// A person with several tabs open has several connections but appears once.
    /// </summary>
    public class PresenceTracker
    {
        private sealed record PresenceConnection(string UserId, string DisplayName, string? ProfilePictureUrl, int? ViewingJobId);

        private readonly ConcurrentDictionary<string, PresenceConnection> Connections = new();

        public void Connect(string connectionId, string userId, string displayName, string? profilePictureUrl)
        {
            Connections[connectionId] = new PresenceConnection(userId, displayName, profilePictureUrl, null);
        }

        public void Disconnect(string connectionId)
        {
            Connections.TryRemove(connectionId, out _);
        }

        /// <summary>
        /// Records the job a connection is viewing. Returns true when this changed what others will see.
        /// </summary>
        public bool SetViewing(string connectionId, int? jobId)
        {
            if (!Connections.TryGetValue(connectionId, out var existing) || existing.ViewingJobId == jobId)
                return false;

            return Connections.TryUpdate(connectionId, existing with { ViewingJobId = jobId }, existing);
        }

        public void UpdateProfile(string userId, string displayName, string? profilePictureUrl)
        {
            foreach (var (connectionId, connection) in Connections)
            {
                if (connection.UserId != userId)
                    continue;

                Connections.TryUpdate(connectionId, connection with { DisplayName = displayName, ProfilePictureUrl = profilePictureUrl }, connection);
            }
        }

        public List<OnlineUserResponse> Snapshot()
        {
            return Connections.Values
                .GroupBy(connection => connection.UserId)
                .Select(group => new OnlineUserResponse
                {
                    UserId = group.Key,
                    DisplayName = group.First().DisplayName,
                    ProfilePictureUrl = group.First().ProfilePictureUrl,
                    ViewingJobIds = group
                        .Where(connection => connection.ViewingJobId.HasValue)
                        .Select(connection => connection.ViewingJobId!.Value)
                        .Distinct()
                        .ToList(),
                })
                .OrderBy(user => user.DisplayName, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}
