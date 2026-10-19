using Backend.Repairs.Realtime;
using Backend.Repairs.Services;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Backend.Repairs
{
    public static class RepairsServiceExtensions
    {
        /// <summary>
        /// Registers the repair job services and the realtime SignalR hub dependencies.
        /// </summary>
        public static IServiceCollection AddRepairs(this IServiceCollection services)
        {
            services.TryAddSingleton(TimeProvider.System);

            services.AddSignalR();
            services.AddSingleton<PresenceTracker>();
            services.AddSingleton<IRepairJobNotifier, SignalRRepairJobNotifier>();

            services.AddScoped<RepairActorResolver>();
            services.AddScoped<IRepairJobService, RepairJobService>();

            return services;
        }

        /// <summary>
        /// Accepts the SignalR "access_token" query string on hub requests. Must run before authentication.
        /// </summary>
        public static IApplicationBuilder UseHubAccessToken(this IApplicationBuilder app)
        {
            return app.UseMiddleware<HubAccessTokenMiddleware>();
        }

        public static IEndpointRouteBuilder MapRepairsHub(this IEndpointRouteBuilder endpoints)
        {
            endpoints.MapHub<RepairsHub>(RepairsHub.Path);
            return endpoints;
        }
    }
}
