using Backend.Repairs.Dto;

namespace Backend.Repairs.Realtime
{
    /// <summary>
    /// Publishes repair job changes to connected clients.
    /// </summary>
    public interface IRepairJobNotifier
    {
        Task JobChangedAsync(RepairJobChangedEvent change);
    }
}
