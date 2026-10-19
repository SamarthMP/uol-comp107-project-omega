using Backend.Data;
using Backend.Helpers;
using Backend.Repairs.Dto;
using Backend.Repairs.Models;
using Backend.Repairs.Realtime;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repairs.Services
{
    /// <summary>
    /// Business rules for reporting and progressing repair jobs.
    /// Every change appends a history entry, bumps the concurrency version and is broadcast to connected clients.
    /// </summary>
    public class RepairJobService : IRepairJobService
    {
        private readonly ApplicationDbContext Db;
        private readonly IRepairJobNotifier Notifier;
        private readonly TimeProvider Clock;
        private readonly ILogger<RepairJobService> Logger;

        public RepairJobService(ApplicationDbContext db, IRepairJobNotifier notifier, TimeProvider clock, ILogger<RepairJobService> logger)
        {
            Db = db;
            Notifier = notifier;
            Clock = clock;
            Logger = logger;
        }

        public async Task<List<RepairJobResponse>> ListAsync(CancellationToken cancellationToken = default)
        {
            var jobs = await Db.RepairJobs
                .AsNoTracking()
                .Include(job => job.History)
                .AsSplitQuery()
                .OrderByDescending(job => job.Id)
                .ToListAsync(cancellationToken);

            return jobs.Select(RepairJobMapper.ToResponse).ToList();
        }

        public async Task<RepairJobResponse?> GetAsync(int id, CancellationToken cancellationToken = default)
        {
            var job = await Db.RepairJobs
                .AsNoTracking()
                .Include(candidate => candidate.History)
                .FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);

            return job == null ? null : RepairJobMapper.ToResponse(job);
        }

        public async Task<RepairJobResult> CreateAsync(CreateRepairJobRequest request, RepairActor actor, CancellationToken cancellationToken = default)
        {
            var description = Normalize(request.Description);
            var descriptionError = ValidateText(description, RepairLimits.DescriptionMaxLength, BackendMessageKeys.RepairDescriptionRequired, BackendMessageKeys.RepairDescriptionTooLong, nameof(request.Description));
            if (descriptionError != null)
                return descriptionError;

            var reporterName = Normalize(request.ReporterName);
            var reporterError = ValidateText(reporterName, RepairLimits.ReporterNameMaxLength, BackendMessageKeys.RepairReporterRequired, BackendMessageKeys.RepairReporterTooLong, nameof(request.ReporterName));
            if (reporterError != null)
                return reporterError;

            if (!Enum.IsDefined(request.Priority))
                return RepairJobResult.Failure(RepairJobErrorKind.Validation, BackendMessageKeys.RepairPriorityInvalid, nameof(request.Priority));

            var now = Clock.GetUtcNow().UtcDateTime;
            var job = new RepairJob
            {
                HouseName = RepairLimits.HouseName,
                Description = description!,
                ReporterName = reporterName!,
                Priority = request.Priority,
                Status = RepairStatus.New,
                CreatedByUserId = actor.UserId,
                CreatedAt = now,
                UpdatedAt = now,
                Version = 1,
            };

            job.History.Add(CreateEntry(RepairHistoryEntryType.Reported, RepairStatus.New, null, actor, now));

            Db.RepairJobs.Add(job);
            await Db.SaveChangesAsync(cancellationToken);

            return await PublishAsync(job, RepairHistoryEntryType.Reported, actor);
        }

        public Task<RepairJobResult> StartWorkAsync(int id, RepairActor actor, CancellationToken cancellationToken = default)
        {
            return UpdateAsync(id, actor, RepairHistoryEntryType.WorkStarted, null, (job, now) =>
            {
                if (job.Status == RepairStatus.Completed)
                    return BackendMessageKeys.RepairJobAlreadyCompleted;

                if (job.Status == RepairStatus.InProgress)
                    return BackendMessageKeys.RepairJobAlreadyStarted;

                job.Status = RepairStatus.InProgress;
                job.StartedAt = now;
                return null;
            }, cancellationToken);
        }

        public Task<RepairJobResult> AddProgressNoteAsync(int id, string note, RepairActor actor, CancellationToken cancellationToken = default)
        {
            var normalizedNote = Normalize(note);
            var noteError = ValidateText(normalizedNote, RepairLimits.NoteMaxLength, BackendMessageKeys.RepairNoteRequired, BackendMessageKeys.RepairNoteTooLong, nameof(AddProgressNoteRequest.Note));
            if (noteError != null)
                return Task.FromResult(noteError);

            return UpdateAsync(id, actor, RepairHistoryEntryType.ProgressNote, normalizedNote, (job, _) =>
            {
                return job.Status == RepairStatus.Completed ? BackendMessageKeys.RepairJobAlreadyCompleted : null;
            }, cancellationToken);
        }

        public Task<RepairJobResult> CompleteAsync(int id, string completionNote, RepairActor actor, CancellationToken cancellationToken = default)
        {
            var normalizedNote = Normalize(completionNote);
            var noteError = ValidateText(normalizedNote, RepairLimits.NoteMaxLength, BackendMessageKeys.RepairCompletionNoteRequired, BackendMessageKeys.RepairNoteTooLong, nameof(CompleteRepairJobRequest.CompletionNote));
            if (noteError != null)
                return Task.FromResult(noteError);

            return UpdateAsync(id, actor, RepairHistoryEntryType.Completed, normalizedNote, (job, now) =>
            {
                if (job.Status == RepairStatus.Completed)
                    return BackendMessageKeys.RepairJobAlreadyCompleted;

                job.Status = RepairStatus.Completed;
                job.CompletionNote = normalizedNote;
                job.CompletedAt = now;
                return null;
            }, cancellationToken);
        }

        #region Helpers

        /// <summary>
        /// Loads a job, applies a state change and appends the matching history entry in a single save.
        /// The mutation returns an error message key to reject the change, or null to accept it.
        /// </summary>
        private async Task<RepairJobResult> UpdateAsync(
            int id,
            RepairActor actor,
            RepairHistoryEntryType entryType,
            string? note,
            Func<RepairJob, DateTime, string?> mutate,
            CancellationToken cancellationToken)
        {
            var job = await Db.RepairJobs
                .Include(candidate => candidate.History)
                .FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);

            if (job == null)
                return RepairJobResult.Failure(RepairJobErrorKind.NotFound, BackendMessageKeys.RepairJobNotFound);

            var now = Clock.GetUtcNow().UtcDateTime;
            var rejection = mutate(job, now);
            if (rejection != null)
                return RepairJobResult.Failure(RepairJobErrorKind.InvalidState, rejection);

            job.UpdatedAt = now;
            job.Version++;
            job.History.Add(CreateEntry(entryType, job.Status, note, actor, now));

            try
            {
                await Db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                return RepairJobResult.Failure(RepairJobErrorKind.Conflict, BackendMessageKeys.RepairJobChangedConcurrently);
            }

            return await PublishAsync(job, entryType, actor);
        }

        private async Task<RepairJobResult> PublishAsync(RepairJob job, RepairHistoryEntryType kind, RepairActor actor)
        {
            var response = RepairJobMapper.ToResponse(job);

            try
            {
                await Notifier.JobChangedAsync(new RepairJobChangedEvent
                {
                    Kind = kind,
                    Job = response,
                    ActorUserId = actor.UserId,
                    ActorName = actor.DisplayName,
                });
            }
            catch (Exception ex)
            {
                // The change is already saved, so a failed broadcast must not fail the request
                Logger.LogWarning(ex, "Failed to broadcast change for repair job {JobId}", job.Id);
            }

            return RepairJobResult.Success(response);
        }

        private static RepairJobHistoryEntry CreateEntry(RepairHistoryEntryType type, RepairStatus status, string? note, RepairActor actor, DateTime now)
        {
            return new RepairJobHistoryEntry
            {
                Type = type,
                Status = status,
                Note = note,
                ActorUserId = actor.UserId,
                ActorName = actor.DisplayName,
                CreatedAt = now,
            };
        }

        /// <summary>
        /// Trims user text, returning null when nothing but whitespace remains.
        /// </summary>
        private static string? Normalize(string? value)
        {
            var trimmed = value?.Trim();
            return string.IsNullOrEmpty(trimmed) ? null : trimmed;
        }

        private static RepairJobResult? ValidateText(string? normalized, int maxLength, string requiredKey, string tooLongKey, string field)
        {
            if (normalized == null)
                return RepairJobResult.Failure(RepairJobErrorKind.Validation, requiredKey, field);

            if (normalized.Length > maxLength)
                return RepairJobResult.Failure(RepairJobErrorKind.Validation, tooLongKey, field);

            return null;
        }

        #endregion
    }
}
