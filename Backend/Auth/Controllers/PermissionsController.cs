using Backend.Auth.Dto;
using Backend.Data;
using Backend.Email;
using Backend.Helpers;
using Backend.Storage;
using Fido2NetLib;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using OpenIddict.Abstractions;

namespace Backend.Auth.Controllers
{
    [ApiController]
    [Route("api/permissions")]
    [Produces("application/json")]
    [Authorize]
    public class PermissionsController : AuthControllerBase
    {
        public PermissionsController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ApplicationDbContext db,
            IBlobStorage blobStorage,
            IOpenIddictTokenManager tokenManager,
            IConfiguration config,
            IFido2 fido2,
            IDistributedCache cache,
            IEmailService emailService)
            : base(userManager, signInManager, db, blobStorage, tokenManager, config, fido2, cache, emailService)
        { }

        #region Authorization Helpers

        private async Task<bool> IsSuperAdmin()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return false;
            return await PermissionResolver.UserHasFlagAsync(Db, user.Id, FeatureFlag.SuperAdmin, HttpContext);
        }

        private static PermissionGroupResponse MapGroupResponse(PermissionGroup group)
        {
            return new PermissionGroupResponse
            {
                Id = group.Id,
                Name = group.Name,
                Type = group.Type.ToString(),
                IsDefault = group.IsDefault,
                MatchValue = group.MatchValue,
                Priority = group.Priority,
                CreatedAt = group.CreatedAt,
                Rules = group.Flags
                    .OrderBy(rule => rule.Flag)
                    .Select(rule => new PermissionRuleDto
                    {
                        Flag = rule.Flag.ToString(),
                        Mode = rule.Mode.ToString(),
                    })
                    .ToList(),
                MemberCount = group.IsDefault ? -1 : group.Members.Count,
            };
        }

        private static List<PermissionGroupFlag> MapGroupRules(IEnumerable<PermissionRuleDto> rules, Guid groupId)
        {
            return rules
                .Where(rule => Enum.TryParse<FeatureFlag>(rule.Flag, true, out _) && Enum.TryParse<PermissionRuleMode>(rule.Mode, true, out var mode) && mode != PermissionRuleMode.Inherit)
                .Select(rule => new PermissionGroupFlag
                {
                    GroupId = groupId,
                    Flag = Enum.Parse<FeatureFlag>(rule.Flag, true),
                    Mode = Enum.Parse<PermissionRuleMode>(rule.Mode, true),
                })
                .GroupBy(rule => rule.Flag)
                .Select(group => group.Last())
                .ToList();
        }

        private static List<UserFeatureFlag> MapUserRules(IEnumerable<PermissionRuleDto> rules, string userId)
        {
            return rules
                .Where(rule => Enum.TryParse<FeatureFlag>(rule.Flag, true, out _) && Enum.TryParse<PermissionRuleMode>(rule.Mode, true, out var mode) && mode != PermissionRuleMode.Inherit)
                .Select(rule => new UserFeatureFlag
                {
                    UserId = userId,
                    Flag = Enum.Parse<FeatureFlag>(rule.Flag, true),
                    Mode = Enum.Parse<PermissionRuleMode>(rule.Mode, true),
                })
                .GroupBy(rule => rule.Flag)
                .Select(group => group.Last())
                .ToList();
        }

        private static bool IsMemberEditableGroup(PermissionGroup group)
        {
            return group.Type == PermissionGroupType.Manual && !group.IsDefault;
        }

        #endregion

        #region Feature Flags

        [HttpGet("flags")]
        public async Task<IActionResult> GetAllFlags()
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var flags = Enum.GetValues<FeatureFlag>()
                .Select(f => f.ToString())
                .ToList();

            return Ok(new AllFlagsResponse { Flags = flags });
        }

        [HttpGet("capabilities")]
        public async Task<IActionResult> GetCapabilities()
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var geoSupported = GeoResolutionHelper.ResolveCountry(HttpContext) != null;

            return Ok(new PermissionCapabilitiesResponse
            {
                GeoCountrySupported = geoSupported
            });
        }

        #endregion

        #region Permission Groups

        [HttpGet("groups")]
        public async Task<IActionResult> GetGroups()
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var groups = await Db.PermissionGroups
                .Include(g => g.Flags)
                .Include(g => g.Members)
                .OrderBy(g => g.Priority)
                .ThenBy(g => g.Name)
                .ToListAsync();

            var response = groups.Select(MapGroupResponse).ToList();

            return Ok(response);
        }

        [HttpPost("groups")]
        public async Task<IActionResult> CreateGroup([FromBody] CreatePermissionGroupRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            if (!Enum.TryParse<PermissionGroupType>(request.Type, true, out var groupType))
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.ValidationFailed });

            if (groupType != PermissionGroupType.Manual && string.IsNullOrWhiteSpace(request.MatchValue))
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.FieldRequired });

            var existing = await Db.PermissionGroups.AnyAsync(g => g.Name == request.Name);
            if (existing)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.GroupNameAlreadyExists });

            var priority = await Db.PermissionGroups.CountAsync();

            var group = new PermissionGroup
            {
                Name = request.Name,
                Type = groupType,
                MatchValue = groupType == PermissionGroupType.Manual ? null : request.MatchValue,
                Priority = priority,
                IsDefault = false,
            };

            foreach (var rule in MapGroupRules(request.Rules, group.Id))
            {
                group.Flags.Add(rule);
            }

            Db.PermissionGroups.Add(group);
            await Db.SaveChangesAsync();

            return Ok(MapGroupResponse(group));
        }

        [HttpPut("groups/{groupId}")]
        public async Task<IActionResult> UpdateGroup(Guid groupId, [FromBody] UpdatePermissionGroupRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var group = await Db.PermissionGroups
                .Include(g => g.Flags)
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
                return NotFound(new ErrorResponse { Error = BackendMessageKeys.GroupNotFound });

            if (group.IsDefault && request.Name != null && !string.Equals(request.Name, PermissionGroup.DefaultGroupName, StringComparison.Ordinal))
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.ValidationFailed });

            if (request.Name != null)
            {
                var nameExists = await Db.PermissionGroups.AnyAsync(g => g.Name == request.Name && g.Id != groupId);
                if (nameExists)
                    return BadRequest(new ErrorResponse { Error = BackendMessageKeys.GroupNameAlreadyExists });
                group.Name = request.Name;
            }

            if (request.Rules != null)
            {
                Db.PermissionGroupFlags.RemoveRange(group.Flags);

                foreach (var rule in MapGroupRules(request.Rules, group.Id))
                {
                    Db.PermissionGroupFlags.Add(rule);
                }
            }

            await Db.SaveChangesAsync();

            return Ok(MapGroupResponse(group));
        }

        [HttpPut("groups/order")]
        public async Task<IActionResult> ReorderGroups([FromBody] ReorderPermissionGroupsRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var groups = await Db.PermissionGroups
                .OrderBy(group => group.Priority)
                .ThenBy(group => group.CreatedAt)
                .ToListAsync();

            if (request.GroupIds.Count != groups.Count)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.ValidationFailed });

            var knownGroupIds = groups.Select(group => group.Id).OrderBy(id => id).ToList();
            var requestedGroupIds = request.GroupIds.OrderBy(id => id).ToList();

            if (!knownGroupIds.SequenceEqual(requestedGroupIds))
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.ValidationFailed });

            for (var index = 0; index < request.GroupIds.Count; index++)
            {
                var group = groups.First(existingGroup => existingGroup.Id == request.GroupIds[index]);
                group.Priority = index;
            }

            await Db.SaveChangesAsync();

            var orderedGroups = await Db.PermissionGroups
                .Include(group => group.Flags)
                .Include(group => group.Members)
                .OrderBy(group => group.Priority)
                .ThenBy(group => group.CreatedAt)
                .ToListAsync();

            return Ok(orderedGroups.Select(MapGroupResponse).ToList());
        }

        [HttpDelete("groups/{groupId}")]
        public async Task<IActionResult> DeleteGroup(Guid groupId)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var group = await Db.PermissionGroups.FindAsync(groupId);
            if (group == null)
                return NotFound(new ErrorResponse { Error = BackendMessageKeys.GroupNotFound });

            if (group.IsDefault)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.CannotDeleteDefaultGroup });

            Db.PermissionGroups.Remove(group);
            await Db.SaveChangesAsync();

            return NoContent();
        }

        #endregion

        #region Group Members

        [HttpGet("groups/{groupId}/members")]
        public async Task<IActionResult> GetGroupMembers(Guid groupId)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var group = await Db.PermissionGroups.FindAsync(groupId);
            if (group == null)
                return NotFound(new ErrorResponse { Error = BackendMessageKeys.GroupNotFound });

            if (group.IsDefault)
            {
                var defaultGroupUsers = await UserManager.Users
                    .OrderBy(user => user.DisplayName ?? user.Email)
                    .Select(user => new PermissionGroupMemberResponse
                    {
                        UserId = user.Id,
                        Email = user.Email,
                        DisplayName = user.DisplayName,
                    })
                    .ToListAsync();

                return Ok(defaultGroupUsers);
            }

            var members = await Db.PermissionGroupMembers
                .Where(m => m.GroupId == groupId)
                .ToListAsync();

            var userIds = members.Select(m => m.UserId).ToList();
            var users = await UserManager.Users
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            var response = members.Select(m =>
            {
                users.TryGetValue(m.UserId, out var user);
                return new PermissionGroupMemberResponse
                {
                    UserId = m.UserId,
                    Email = user?.Email,
                    DisplayName = user?.DisplayName
                };
            }).ToList();

            return Ok(response);
        }

        [HttpPost("groups/{groupId}/members")]
        public async Task<IActionResult> AddGroupMember(Guid groupId, [FromBody] AddGroupMemberRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var group = await Db.PermissionGroups.FindAsync(groupId);
            if (group == null)
                return NotFound(new ErrorResponse { Error = BackendMessageKeys.GroupNotFound });

            if (group.IsDefault)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.CannotModifyDefaultGroupMembers });

            if (!IsMemberEditableGroup(group))
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.CannotModifyAutoGroupMembers });

            var user = await UserManager.FindByIdAsync(request.UserId);
            if (user == null)
                return NotFound(new ErrorResponse { Error = BackendMessageKeys.UserNotFound });

            var exists = await Db.PermissionGroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == request.UserId);
            if (exists)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.UserAlreadyInGroup });

            Db.PermissionGroupMembers.Add(new PermissionGroupMember
            {
                GroupId = groupId,
                UserId = request.UserId
            });
            await Db.SaveChangesAsync();

            return Ok(new PermissionGroupMemberResponse
            {
                UserId = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName
            });
        }

        [HttpDelete("groups/{groupId}/members/{userId}")]
        public async Task<IActionResult> RemoveGroupMember(Guid groupId, string userId)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var group = await Db.PermissionGroups.FindAsync(groupId);
            if (group == null)
                return NotFound(new ErrorResponse { Error = BackendMessageKeys.GroupNotFound });

            if (group.IsDefault)
                return BadRequest(new ErrorResponse { Error = BackendMessageKeys.CannotModifyDefaultGroupMembers });

            var member = await Db.PermissionGroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId);

            if (member == null)
                return NotFound(new ErrorResponse { Error = BackendMessageKeys.UserNotFound });

            Db.PermissionGroupMembers.Remove(member);
            await Db.SaveChangesAsync();

            return NoContent();
        }

        #endregion

        #region User Flags

        [HttpGet("users/{userId}")]
        public async Task<IActionResult> GetUserPermissions(string userId)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var user = await UserManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new ErrorResponse { Error = BackendMessageKeys.UserNotFound });

            var directRules = await Db.UserFeatureFlags
                .Where(f => f.UserId == userId)
                .OrderBy(rule => rule.Flag)
                .Select(rule => new PermissionRuleDto
                {
                    Flag = rule.Flag.ToString(),
                    Mode = rule.Mode.ToString(),
                })
                .ToListAsync();

            var effectiveFlags = await PermissionResolver.ResolveUserFlagsAsync(Db, userId, HttpContext);

            var groups = await Db.PermissionGroupMembers
                .Where(m => m.UserId == userId)
                .Join(Db.PermissionGroups, m => m.GroupId, g => g.Id, (m, g) => g.Name)
                .ToListAsync();

            var defaultGroupName = await Db.PermissionGroups
                .Where(group => group.IsDefault)
                .Select(group => group.Name)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrWhiteSpace(defaultGroupName) && !groups.Contains(defaultGroupName))
            {
                groups.Insert(0, defaultGroupName);
            }

            return Ok(new UserPermissionsResponse
            {
                UserId = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName,
                DirectRules = directRules,
                EffectiveFlags = effectiveFlags,
                Groups = groups
            });
        }

        [HttpPut("users/{userId}/flags")]
        public async Task<IActionResult> SetUserFlags(string userId, [FromBody] SetUserFlagsRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var user = await UserManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new ErrorResponse { Error = BackendMessageKeys.UserNotFound });

            var existing = await Db.UserFeatureFlags
                .Where(f => f.UserId == userId)
                .ToListAsync();

            Db.UserFeatureFlags.RemoveRange(existing);

            foreach (var rule in MapUserRules(request.Rules, userId))
            {
                Db.UserFeatureFlags.Add(rule);
            }

            await Db.SaveChangesAsync();

            var effectiveFlags = await PermissionResolver.ResolveUserFlagsAsync(Db, userId, HttpContext);

            var directRules = await Db.UserFeatureFlags
                .Where(rule => rule.UserId == userId)
                .OrderBy(rule => rule.Flag)
                .Select(rule => new PermissionRuleDto
                {
                    Flag = rule.Flag.ToString(),
                    Mode = rule.Mode.ToString(),
                })
                .ToListAsync();

            return Ok(new UserPermissionsResponse
            {
                UserId = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName,
                DirectRules = directRules,
                EffectiveFlags = effectiveFlags
            });
        }

        #endregion

        #region User Search

        [HttpGet("users/search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string q)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
                return Ok(Array.Empty<UserSearchResult>());

            var users = await UserManager.Users
                .Where(u => u.Email!.Contains(q) || (u.DisplayName != null && u.DisplayName.Contains(q)))
                .Take(20)
                .Select(u => new UserSearchResult
                {
                    Id = u.Id,
                    Email = u.Email,
                    DisplayName = u.DisplayName
                })
                .ToListAsync();

            return Ok(users);
        }

        #endregion
    }
}
