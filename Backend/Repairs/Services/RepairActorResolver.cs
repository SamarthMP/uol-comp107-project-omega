using Backend.Auth;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Backend.Repairs.Services
{
    /// <summary>
    /// Looks up the signed-in account behind a request or hub connection.
    /// The current display name is read from the database so renamed accounts are reflected straight away.
    /// </summary>
    public class RepairActorResolver
    {
        private readonly UserManager<ApplicationUser> UserManager;

        public RepairActorResolver(UserManager<ApplicationUser> userManager)
        {
            UserManager = userManager;
        }

        public async Task<ApplicationUser?> FindUserAsync(ClaimsPrincipal principal)
        {
            var userId = principal.FindFirst(Claims.Subject)?.Value
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return string.IsNullOrEmpty(userId) ? null : await UserManager.FindByIdAsync(userId);
        }

        public async Task<RepairActor?> ResolveAsync(ClaimsPrincipal principal)
        {
            var user = await FindUserAsync(principal);
            return user == null ? null : new RepairActor(user.Id, DisplayNameFor(user));
        }

        public static string DisplayNameFor(ApplicationUser user)
        {
            if (!string.IsNullOrWhiteSpace(user.DisplayName))
                return user.DisplayName;

            return user.Email ?? user.UserName ?? user.Id;
        }
    }
}
