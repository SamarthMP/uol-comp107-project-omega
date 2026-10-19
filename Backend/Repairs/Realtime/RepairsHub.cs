using Backend.Helpers;
using Backend.Repairs.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Repairs.Realtime
{
    /// <summary>
    /// Realtime channel for the repairs board. Job changes are pushed through <see cref="IRepairJobNotifier"/>,
    /// while this hub tracks who is online and which job they are looking at.
    /// </summary>
    [Authorize]
    public class RepairsHub : Hub<IRepairsClient>
    {
        public const string Path = "/api/hubs/repairs";

        private readonly PresenceTracker Presence;
        private readonly RepairActorResolver ActorResolver;

        public RepairsHub(PresenceTracker presence, RepairActorResolver actorResolver)
        {
            Presence = presence;
            ActorResolver = actorResolver;
        }

        public override async Task OnConnectedAsync()
        {
            var user = Context.User == null ? null : await ActorResolver.FindUserAsync(Context.User);
            if (user == null)
            {
                Context.Abort();
                return;
            }

            Presence.Connect(
                Context.ConnectionId,
                user.Id,
                RepairActorResolver.DisplayNameFor(user),
                ProfilePictureUrls.Resolve(user.ProfilePicture));

            await BroadcastPresenceAsync();
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            Presence.Disconnect(Context.ConnectionId);
            await BroadcastPresenceAsync();
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Lets others see which job this connection has open. Pass null when no job is open.
        /// </summary>
        public async Task ViewJob(int? jobId)
        {
            var normalizedJobId = jobId is > 0 ? jobId : null;
            if (Presence.SetViewing(Context.ConnectionId, normalizedJobId))
            {
                await BroadcastPresenceAsync();
            }
        }

        /// <summary>
        /// Re-reads the caller's display name and picture after they edit their profile.
        /// </summary>
        public async Task RefreshProfile()
        {
            var user = Context.User == null ? null : await ActorResolver.FindUserAsync(Context.User);
            if (user == null)
                return;

            Presence.UpdateProfile(user.Id, RepairActorResolver.DisplayNameFor(user), ProfilePictureUrls.Resolve(user.ProfilePicture));
            await BroadcastPresenceAsync();
        }

        private Task BroadcastPresenceAsync()
        {
            return Clients.All.PresenceChanged(Presence.Snapshot());
        }
    }
}
