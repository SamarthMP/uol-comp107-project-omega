using Backend.Repairs.Dto;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Repairs.Realtime
{
    public class SignalRRepairJobNotifier : IRepairJobNotifier
    {
        private readonly IHubContext<RepairsHub, IRepairsClient> HubContext;

        public SignalRRepairJobNotifier(IHubContext<RepairsHub, IRepairsClient> hubContext)
        {
            HubContext = hubContext;
        }

        public Task JobChangedAsync(RepairJobChangedEvent change)
        {
            return HubContext.Clients.All.JobChanged(change);
        }
    }
}
