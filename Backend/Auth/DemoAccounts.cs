using System.Security.Cryptography;

namespace Backend.Auth
{
    /// <summary>
    /// Passwordless demo accounts. Each browser session gets its own throwaway account
    /// named "Demo User NNNN" through the custom demo token grant.
    /// </summary>
    public static class DemoAccounts
    {
        public const string GrantType = "urn:custom:demo";

        /// <summary>
        /// Reserved top-level domain, so generated addresses can never reach a real mailbox.
        /// </summary>
        public const string EmailDomain = "demo.meadowhouse.invalid";

        public static ApplicationUser CreateUser()
        {
            var id = Guid.NewGuid().ToString("N");
            var number = RandomNumberGenerator.GetInt32(1000, 10000);

            return new ApplicationUser
            {
                UserName = $"demo-{id}",
                Email = $"demo-{id}@{EmailDomain}",
                DisplayName = $"Demo User {number}",
            };
        }
    }
}
