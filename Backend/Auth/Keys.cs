using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Text;

namespace Backend.Auth
{
    public static class Keys
    {
        public static string AuthSecret
        {
            get
            {
                var secret = Environment.GetEnvironmentVariable("AUTH_SECRET");

                if (string.IsNullOrWhiteSpace(secret))
                {
                    #if DEBUG
                    secret = "DEBUG_SECRET"; // This is NOT secure AT ALL btw
                    #else
                    throw new InvalidOperationException("AUTH_SECRET environment variable is not set.");
                    #endif
                }

                return secret;
            }
        }

        public static void Load()
        {
            DotNetEnv.Env.TraversePath().Load();
        }


        public static SymmetricSecurityKey GetEncryptionKey() => new(SHA256.HashData(Encoding.UTF8.GetBytes($"{AuthSecret}:encryption")));
        public static SymmetricSecurityKey GetSigningKey() => new(SHA256.HashData(Encoding.UTF8.GetBytes($"{AuthSecret}:signing")));
    }
}
