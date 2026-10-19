using Backend.Auth.Providers;

namespace Backend.Auth
{
    public class AuthConfig
    {
        /// <summary>
        /// In production, this needs to be changed to the actual deployed URL
        /// </summary>
        public static string PrimaryHost { get; set; } = "http://localhost:6768";

        /// <summary>
        /// Set this to the name of the app
        /// </summary>
        public static string AppName { get; set; } = "Meadow House Repairs";

        /// <summary>
        /// List of external auth providers, this includes providers that are disabled as well
        /// </summary>
        public static List<AuthProviderBase> AuthProviders { get; set; } = new List<AuthProviderBase>();
    }
}
