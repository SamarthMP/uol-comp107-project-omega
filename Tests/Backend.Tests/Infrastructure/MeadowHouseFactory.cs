using Backend.Auth;
using Backend.Auth.Providers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Hosting;

namespace Backend.Tests.Infrastructure
{
    /// <summary>
    /// Hosts the real backend in memory on its own throwaway SQLite database file.
    /// </summary>
    public class MeadowHouseFactory : WebApplicationFactory<Program>
    {
        private static readonly string[] DatabaseFileSuffixes = ["", "-journal", "-wal", "-shm"];

        private readonly bool OwnsDatabase;

        public MeadowHouseFactory()
            : this(CreateDatabasePath(), ownsDatabase: true)
        { }

        private MeadowHouseFactory(string databasePath, bool ownsDatabase)
        {
            DatabasePath = databasePath;
            OwnsDatabase = ownsDatabase;
        }

        public string DatabasePath { get; }

        /// <summary>
        /// Starts a server on the given database file and leaves the file in place when disposed,
        /// so another factory can start on the same data like a restarted server.
        /// </summary>
        public static MeadowHouseFactory ForExistingDatabase(string databasePath)
        {
            return new MeadowHouseFactory(databasePath, ownsDatabase: false);
        }

        public static string CreateDatabasePath()
        {
            return Path.Combine(Path.GetTempPath(), $"meadow-house-tests-{Guid.NewGuid():N}.db");
        }

        public static void DeleteDatabase(string databasePath)
        {
            SqliteConnection.ClearAllPools();

            foreach (var suffix in DatabaseFileSuffixes)
            {
                File.Delete(databasePath + suffix);
            }
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseSetting("ConnectionStrings:DefaultConnection", $"Data Source={DatabasePath}");

            // ASPNETCORE_URLS or ASPNETCORE_HTTP_PORTS in the environment would otherwise be copied onto the test
            // server's addresses, and in Debug builds Program.cs launches the Vite dev server when any address is set
            builder.UseSetting(WebHostDefaults.ServerUrlsKey, string.Empty);
            builder.UseSetting(WebHostDefaults.HttpPortsKey, string.Empty);
            builder.UseSetting(WebHostDefaults.HttpsPortsKey, string.Empty);
        }

        protected override IHost CreateHost(IHostBuilder builder)
        {
            // Program.cs appends to these process-wide lists every time it runs, and every factory runs it again
            AuthConfig.AuthProviders.Clear();
            AuthProviderBase.RegisteredProviders.Clear();

            return base.CreateHost(builder);
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);

            if (disposing && OwnsDatabase)
            {
                DeleteDatabase(DatabasePath);
            }
        }
    }
}
