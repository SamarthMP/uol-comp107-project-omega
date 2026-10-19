using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Helpers
{
    public static class PermissionResolver
    {
        private sealed class PermissionEvaluationContext
        {
            public Dictionary<FeatureFlag, bool> States { get; } = new();
            public List<string> EffectiveFlags => States
                .Where(entry => entry.Value)
                .Select(entry => entry.Key.ToString())
                .OrderBy(flag => flag)
                .ToList();
        }

        public static async Task<PermissionGroup?> GetDefaultGroupAsync(
            ApplicationDbContext db,
            CancellationToken cancellationToken = default)
        {
            return await db.PermissionGroups
                .AsNoTracking()
                .FirstOrDefaultAsync(group => group.IsDefault, cancellationToken);
        }

        private static async Task ApplyRulesAsync(
            PermissionEvaluationContext context,
            IEnumerable<(FeatureFlag Flag, PermissionRuleMode Mode)> rules,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;

            foreach (var rule in rules)
            {
                switch (rule.Mode)
                {
                    case PermissionRuleMode.Allow:
                        context.States[rule.Flag] = true;
                        break;
                    case PermissionRuleMode.Block:
                        context.States[rule.Flag] = false;
                        break;
                    case PermissionRuleMode.Inherit:
                    default:
                        break;
                }
            }
        }

        public static async Task<List<string>> ResolveUserFlagsAsync(
            ApplicationDbContext db,
            string userId,
            HttpContext? httpContext = null)
        {
            var context = new PermissionEvaluationContext();
            var matchedGroupIds = await GetMatchedGroupIdsAsync(db, userId, httpContext);

            if (matchedGroupIds.Count > 0)
            {
                var orderedGroupRules = await db.PermissionGroups
                    .Where(group => matchedGroupIds.Contains(group.Id))
                    .Include(group => group.Flags)
                    .OrderBy(group => group.Priority)
                    .ThenBy(group => group.CreatedAt)
                    .SelectMany(group => group.Flags.Select(rule => new { rule.Flag, rule.Mode }))
                    .ToListAsync();

                await ApplyRulesAsync(context, orderedGroupRules.Select(rule => (rule.Flag, rule.Mode)));
            }

            var directRules = await db.UserFeatureFlags
                .Where(rule => rule.UserId == userId)
                .OrderBy(rule => rule.Flag)
                .Select(rule => new { rule.Flag, rule.Mode })
                .ToListAsync();

            await ApplyRulesAsync(context, directRules.Select(rule => (rule.Flag, rule.Mode)));

            return context.EffectiveFlags;
        }

        public static async Task<HashSet<Guid>> GetMatchedGroupIdsAsync(
            ApplicationDbContext db,
            string userId,
            HttpContext? httpContext = null)
        {
            var matchedGroupIds = new HashSet<Guid>();

            var defaultGroupId = await db.PermissionGroups
                .Where(group => group.IsDefault)
                .Select(group => (Guid?)group.Id)
                .FirstOrDefaultAsync();

            if (defaultGroupId.HasValue)
            {
                matchedGroupIds.Add(defaultGroupId.Value);
            }

            var manualGroupIds = await db.PermissionGroupMembers
                .Where(member => member.UserId == userId)
                .Join(db.PermissionGroups,
                    member => member.GroupId,
                    group => group.Id,
                    (member, group) => group)
                .Where(group => group.Type == PermissionGroupType.Manual && !group.IsDefault)
                .Select(group => group.Id)
                .ToListAsync();

            foreach (var groupId in manualGroupIds)
            {
                matchedGroupIds.Add(groupId);
            }

            if (httpContext == null)
            {
                return matchedGroupIds;
            }

            var autoGroups = await db.PermissionGroups
                .Where(group => group.Type != PermissionGroupType.Manual)
                .Select(group => new { group.Id, group.Type, group.MatchValue })
                .ToListAsync();

            string? country = GeoResolutionHelper.ResolveCountry(httpContext);
            string? browser = GeoResolutionHelper.ResolveBrowser(httpContext);
            string? os = GeoResolutionHelper.ResolveOperatingSystem(httpContext);

            foreach (var group in autoGroups)
            {
                var matches = group.Type switch
                {
                    PermissionGroupType.Country => country != null && string.Equals(group.MatchValue, country, StringComparison.OrdinalIgnoreCase),
                    PermissionGroupType.Browser => browser != null && MatchesAny(group.MatchValue, browser),
                    PermissionGroupType.OperatingSystem => os != null && MatchesAny(group.MatchValue, os),
                    _ => false,
                };

                if (matches)
                {
                    matchedGroupIds.Add(group.Id);
                }
            }

            return matchedGroupIds;
        }

        public static async Task<bool> UserHasFlagAsync(
            ApplicationDbContext db,
            string userId,
            FeatureFlag flag,
            HttpContext? httpContext = null)
        {
            var flags = await ResolveUserFlagsAsync(db, userId, httpContext);
            return flags.Contains(flag.ToString());
        }

        private static bool MatchesAny(string? matchValue, string resolved)
        {
            if (string.IsNullOrWhiteSpace(matchValue)) return false;

            foreach (var part in matchValue.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (string.Equals(part, resolved, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }
    }
}
