using System.ComponentModel.DataAnnotations;

namespace Backend.Repairs.Models
{
    /// <summary>
    /// An immutable, timestamped record of something that happened to a repair job.
    /// Entries are only ever appended so earlier history is always retained.
    /// </summary>
    public class RepairJobHistoryEntry
    {
        public int Id { get; set; }

        public int JobId { get; set; }
        public RepairJob Job { get; set; } = null!;

        public RepairHistoryEntryType Type { get; set; }

        /// <summary>
        /// The status of the job immediately after this entry was recorded.
        /// </summary>
        public RepairStatus Status { get; set; }

        [MaxLength(RepairLimits.NoteMaxLength)]
        public string? Note { get; set; }

        [Required, MaxLength(450)]
        public string ActorUserId { get; set; } = string.Empty;

        [Required, MaxLength(128)]
        public string ActorName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
