using Backend.Repairs.Dto;

namespace Backend.Repairs.Realtime
{
    /// <summary>
    /// Methods the server can invoke on connected browser clients.
    /// </summary>
    public interface IRepairsClient
    {
        Task JobChanged(RepairJobChangedEvent change);

        Task PresenceChanged(List<OnlineUserResponse> onlineUsers);
    }
}
