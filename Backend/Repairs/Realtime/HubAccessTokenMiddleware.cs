namespace Backend.Repairs.Realtime
{
    /// <summary>
    /// Browsers cannot send an Authorization header when opening a WebSocket, so SignalR passes the
    /// access token in the "access_token" query string instead. This moves it into the header for hub
    /// requests only, so tokens in URLs are never accepted by the regular API endpoints.
    /// </summary>
    public class HubAccessTokenMiddleware
    {
        public const string HubPathPrefix = "/api/hubs";
        private const string QueryParameter = "access_token";

        private readonly RequestDelegate Next;

        public HubAccessTokenMiddleware(RequestDelegate next)
        {
            Next = next;
        }

        public Task InvokeAsync(HttpContext context)
        {
            var request = context.Request;

            if (request.Path.StartsWithSegments(HubPathPrefix)
                && string.IsNullOrEmpty(request.Headers.Authorization)
                && request.Query.TryGetValue(QueryParameter, out var token)
                && !string.IsNullOrWhiteSpace(token))
            {
                request.Headers.Authorization = $"Bearer {token}";
            }

            return Next(context);
        }
    }
}
