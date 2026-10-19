using System.ComponentModel.DataAnnotations;

namespace Backend.Data
{
    public enum PermissionGroupType
    {
        Manual,
        Country,
        Browser,
        OperatingSystem
    }

    public enum PermissionRuleMode
    {
        Inherit,
        Allow,
        Block
    }

    public class PermissionGroup
    {
        public const string DefaultGroupName = "Default Users";

        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(128)]
        public string Name { get; set; } = string.Empty;

        public PermissionGroupType Type { get; set; } = PermissionGroupType.Manual;

        public bool IsDefault { get; set; }

        [MaxLength(256)]
        public string? MatchValue { get; set; }

        public int Priority { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<PermissionGroupFlag> Flags { get; set; } = new List<PermissionGroupFlag>();
        public ICollection<PermissionGroupMember> Members { get; set; } = new List<PermissionGroupMember>();
    }

    public class PermissionGroupFlag
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid GroupId { get; set; }
        public PermissionGroup Group { get; set; } = null!;

        public FeatureFlag Flag { get; set; }

        public PermissionRuleMode Mode { get; set; } = PermissionRuleMode.Allow;
    }

    public class PermissionGroupMember
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid GroupId { get; set; }
        public PermissionGroup Group { get; set; } = null!;

        [Required, MaxLength(450)]
        public string UserId { get; set; } = string.Empty;
    }

    public class UserFeatureFlag
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(450)]
        public string UserId { get; set; } = string.Empty;

        public FeatureFlag Flag { get; set; }

        public PermissionRuleMode Mode { get; set; } = PermissionRuleMode.Allow;
    }
}
