using Backend.Repairs.Dto;
using Backend.Repairs.Models;

namespace Backend.Repairs.Services
{
    public static class RepairJobMapper
    {
        public static RepairJobResponse ToResponse(RepairJob job)
        {
            var newestFirst = job.History
                .OrderByDescending(entry => entry.CreatedAt)
                .ThenByDescending(entry => entry.Id)
                .ToList();

            var latestNote = newestFirst.FirstOrDefault(entry => entry.Type == RepairHistoryEntryType.ProgressNote);

            return new RepairJobResponse
            {
                Id = job.Id,
                Reference = RepairLimits.FormatReference(job.Id),
                HouseName = job.HouseName,
                Description = job.Description,
                ReporterName = job.ReporterName,
                Priority = job.Priority,
                Status = job.Status,
                LatestNote = latestNote?.Note,
                LatestNoteAt = latestNote?.CreatedAt,
                CompletionNote = job.CompletionNote,
                CreatedAt = job.CreatedAt,
                UpdatedAt = job.UpdatedAt,
                StartedAt = job.StartedAt,
                CompletedAt = job.CompletedAt,
                Version = job.Version,
                History = newestFirst.Select(ToResponse).ToList(),
            };
        }

        public static RepairHistoryEntryResponse ToResponse(RepairJobHistoryEntry entry)
        {
            return new RepairHistoryEntryResponse
            {
                Id = entry.Id,
                Type = entry.Type,
                Status = entry.Status,
                Note = entry.Note,
                ActorName = entry.ActorName,
                CreatedAt = entry.CreatedAt,
            };
        }
    }
}
