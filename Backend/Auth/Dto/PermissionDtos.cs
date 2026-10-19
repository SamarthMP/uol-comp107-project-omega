using Backend.Data;
using System.ComponentModel.DataAnnotations;

namespace Backend.Auth.Dto
{
    public class PermissionRuleDto
    {
        [Required]
        public string Flag { get; set; } = string.Empty;

        [Required]
        public string Mode { get; set; } = string.Empty;
    }

    public class PermissionGroupResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public string? MatchValue { get; set; }
        public int Priority { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<PermissionRuleDto> Rules { get; set; } = [];
        public int MemberCount { get; set; }
    }

    public class CreatePermissionGroupRequest
    {
        [Required, MaxLength(128)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = string.Empty;

        [MaxLength(256)]
        public string? MatchValue { get; set; }

        public List<PermissionRuleDto> Rules { get; set; } = [];
    }

    public class UpdatePermissionGroupRequest
    {
        [MaxLength(128)]
        public string? Name { get; set; }

        public List<PermissionRuleDto>? Rules { get; set; }
    }

    public class SetUserFlagsRequest
    {
        [Required]
        public List<PermissionRuleDto> Rules { get; set; } = [];
    }

    public class ReorderPermissionGroupsRequest
    {
        [Required]
        public List<Guid> GroupIds { get; set; } = [];
    }

    public class AddGroupMemberRequest
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
    }

    public class PermissionGroupMemberResponse
    {
        public string UserId { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? DisplayName { get; set; }
    }

    public class UserPermissionsResponse
    {
        public string UserId { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? DisplayName { get; set; }
        public List<PermissionRuleDto> DirectRules { get; set; } = [];
        public List<string> EffectiveFlags { get; set; } = [];
        public List<string> Groups { get; set; } = [];
    }

    public class AllFlagsResponse
    {
        public List<string> Flags { get; set; } = [];
    }

    public class PermissionCapabilitiesResponse
    {
        public bool GeoCountrySupported { get; set; }
    }

    public class UserSearchResult
    {
        public string Id { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? DisplayName { get; set; }
    }
}
