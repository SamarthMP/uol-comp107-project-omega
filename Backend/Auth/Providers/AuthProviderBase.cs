using Microsoft.AspNetCore.Authentication;

namespace Backend.Auth.Providers
{
    /// <summary>
    /// Base class for an external auth provider
    /// </summary>
    public abstract class AuthProviderBase
    {

        public static List<AuthProviderBase> RegisteredProviders = new();

        /// <summary>
        /// Check if enabled, usually via env variable check
        /// </summary>
        public abstract bool IsEnabled();

        /// <summary>
        /// Configures the OAuth module into the auth setup and returns the builder for chaining.
        /// </summary>
        public abstract AuthenticationBuilder Configure(AuthenticationBuilder builder);

        /// <summary>
        /// Returns display information about the provider
        /// </summary>
        public abstract AuthProviderInfo GetInfo();
    }
}
