using Backend.Helpers;
using Backend.Repairs.Models;
using System.ComponentModel.DataAnnotations;

namespace Backend.Repairs.Dto
{
    /// <summary>
    /// Body for reporting a new repair. [Required] also rejects whitespace-only strings.
    /// </summary>
    public class CreateRepairJobRequest
    {
        [Required(ErrorMessage = BackendMessageKeys.RepairDescriptionRequired)]
        [MaxLength(RepairLimits.DescriptionMaxLength, ErrorMessage = BackendMessageKeys.RepairDescriptionTooLong)]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = BackendMessageKeys.RepairReporterRequired)]
        [MaxLength(RepairLimits.ReporterNameMaxLength, ErrorMessage = BackendMessageKeys.RepairReporterTooLong)]
        public string ReporterName { get; set; } = string.Empty;

        [EnumDataType(typeof(RepairPriority), ErrorMessage = BackendMessageKeys.RepairPriorityInvalid)]
        public RepairPriority Priority { get; set; } = RepairPriority.Normal;
    }

    public class AddProgressNoteRequest
    {
        [Required(ErrorMessage = BackendMessageKeys.RepairNoteRequired)]
        [MaxLength(RepairLimits.NoteMaxLength, ErrorMessage = BackendMessageKeys.RepairNoteTooLong)]
        public string Note { get; set; } = string.Empty;
    }

    public class CompleteRepairJobRequest
    {
        [Required(ErrorMessage = BackendMessageKeys.RepairCompletionNoteRequired)]
        [MaxLength(RepairLimits.NoteMaxLength, ErrorMessage = BackendMessageKeys.RepairNoteTooLong)]
        public string CompletionNote { get; set; } = string.Empty;
    }
}
