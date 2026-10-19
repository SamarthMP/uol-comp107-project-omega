using Backend.Repairs.Dto;

namespace Backend.Repairs.Services
{
    public interface IRepairJobService
    {
        Task<List<RepairJobResponse>> ListAsync(CancellationToken cancellationToken = default);

        Task<RepairJobResponse?> GetAsync(int id, CancellationToken cancellationToken = default);

        Task<RepairJobResult> CreateAsync(CreateRepairJobRequest request, RepairActor actor, CancellationToken cancellationToken = default);

        /// <summary>
        /// Moves a New job to In Progress.
        /// </summary>
        Task<RepairJobResult> StartWorkAsync(int id, RepairActor actor, CancellationToken cancellationToken = default);

        Task<RepairJobResult> AddProgressNoteAsync(int id, string note, RepairActor actor, CancellationToken cancellationToken = default);

        /// <summary>
        /// Marks a job Completed. A non-blank completion note is required, otherwise the job is left untouched.
        /// </summary>
        Task<RepairJobResult> CompleteAsync(int id, string completionNote, RepairActor actor, CancellationToken cancellationToken = default);
    }
}
