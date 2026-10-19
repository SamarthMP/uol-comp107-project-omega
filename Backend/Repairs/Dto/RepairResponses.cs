using Backend.Repairs.Models;

namespace Backend.Repairs.Dto
{
    public class RepairJobResponse
    {
        public int Id { get; set; }
        public string Reference { get; set; } = string.Empty;
        public string HouseName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ReporterName { get; set; } = string.Empty;
        public RepairPriority Priority { get; set; }
        public RepairStatus Status { get; set; }
        public string? LatestNote { get; set; }
        public DateTime? LatestNoteAt { get; set; }
        public string? CompletionNote { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int Version { get; set; }

        /// <summary>
        /// History entries, newest first.
        /// </summary>
        public List<RepairHistoryEntryResponse> History { get; set; } = [];
    }

    public class RepairHistoryEntryResponse
    {
        public int Id { get; set; }
        public RepairHistoryEntryType Type { get; set; }
        public RepairStatus Status { get; set; }
        public string? Note { get; set; }
        public string ActorName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Broadcast to every connected client whenever a job changes.
    /// </summary>
    public class RepairJobChangedEvent
    {
        public RepairHistoryEntryType Kind { get; set; }
        public RepairJobResponse Job { get; set; } = new();
        public string ActorUserId { get; set; } = string.Empty;
        public string ActorName { get; set; } = string.Empty;
    }

    public class OnlineUserResponse
    {
        public string UserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public List<int> ViewingJobIds { get; set; } = [];
    }
}
