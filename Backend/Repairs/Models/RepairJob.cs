using System.ComponentModel.DataAnnotations;

namespace Backend.Repairs.Models
{
    /// <summary>
    /// A single repair job reported for the house, along with its full history.
    /// </summary>
    public class RepairJob
    {
        public int Id { get; set; }

        [Required, MaxLength(RepairLimits.HouseNameMaxLength)]
        public string HouseName { get; set; } = RepairLimits.HouseName;

        [Required, MaxLength(RepairLimits.DescriptionMaxLength)]
        public string Description { get; set; } = string.Empty;

        [Required, MaxLength(RepairLimits.ReporterNameMaxLength)]
        public string ReporterName { get; set; } = string.Empty;

        public RepairPriority Priority { get; set; } = RepairPriority.Normal;

        public RepairStatus Status { get; set; } = RepairStatus.New;

        [MaxLength(RepairLimits.NoteMaxLength)]
        public string? CompletionNote { get; set; }

        [Required, MaxLength(450)]
        public string CreatedByUserId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? StartedAt { get; set; }

        public DateTime? CompletedAt { get; set; }

        /// <summary>
        /// Incremented on every change. Used as an optimistic concurrency token so two people
        /// updating the same job at the same moment cannot silently overwrite each other.
        /// </summary>
        public int Version { get; set; }

        public ICollection<RepairJobHistoryEntry> History { get; set; } = new List<RepairJobHistoryEntry>();
    }
}
