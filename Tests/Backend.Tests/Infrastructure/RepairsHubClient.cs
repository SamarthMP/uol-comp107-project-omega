using Backend.Tests.Contracts;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;

namespace Backend.Tests.Infrastructure
{
    /// <summary>
    /// A SignalR connection to the repairs hub that records every JobChanged and PresenceChanged push.
    /// </summary>
    public sealed class RepairsHubClient : IAsyncDisposable
    {
        public const string HubPath = "/api/hubs/repairs";

        private RepairsHubClient(HubConnection connection)
        {
            Connection = connection;
            Connection.On<RepairJobChangedDto>("JobChanged", JobChanges.Add);
            Connection.On<List<OnlineUserDto>>("PresenceChanged", Presence.Add);
        }

        public HubConnection Connection { get; }

        public MessageLog<RepairJobChangedDto> JobChanges { get; } = new();

        public MessageLog<List<OnlineUserDto>> Presence { get; } = new();

        /// <summary>
        /// Connects over long polling through the in-memory test server, sending the token as a bearer header.
        /// </summary>
        public static Task<RepairsHubClient> ConnectAsync(MeadowHouseFactory factory, string accessToken)
        {
            var connection = new HubConnectionBuilder()
                .WithUrl(HubUri(factory), options =>
                {
                    options.Transports = HttpTransportType.LongPolling;
                    options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                    options.AccessTokenProvider = () => Task.FromResult<string?>(accessToken);
                })
                .Build();

            return StartAsync(connection);
        }

        /// <summary>
        /// Connects over WebSockets with the token only in the access_token query string, as browsers must.
        /// </summary>
        public static Task<RepairsHubClient> ConnectWithQueryStringTokenAsync(MeadowHouseFactory factory, string accessToken)
        {
            var connection = new HubConnectionBuilder()
                .WithUrl(HubUri(factory), HttpTransportType.WebSockets, options =>
                {
                    options.SkipNegotiation = true;
                    options.WebSocketFactory = async (context, cancellationToken) =>
                    {
                        var separator = string.IsNullOrEmpty(context.Uri.Query) ? "?" : "&";
                        var uri = new Uri($"{context.Uri}{separator}access_token={Uri.EscapeDataString(accessToken)}");
                        return await factory.Server.CreateWebSocketClient().ConnectAsync(uri, cancellationToken);
                    };
                })
                .Build();

            return StartAsync(connection);
        }

        public Task ViewJobAsync(int? jobId)
        {
            return Connection.InvokeAsync("ViewJob", jobId);
        }

        public ValueTask DisposeAsync()
        {
            return Connection.DisposeAsync();
        }

        private static Uri HubUri(MeadowHouseFactory factory)
        {
            return new Uri(factory.Server.BaseAddress, HubPath);
        }

        private static async Task<RepairsHubClient> StartAsync(HubConnection connection)
        {
            var client = new RepairsHubClient(connection);

            try
            {
                await connection.StartAsync();
            }
            catch
            {
                await connection.DisposeAsync();
                throw;
            }

            return client;
        }
    }
}
