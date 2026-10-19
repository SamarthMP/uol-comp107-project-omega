using Backend.Auth;
using Backend.Storage;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public new DbSet<UserPasskey> UserPasskeys { get; set; }
        public DbSet<StoredBlob> StoredBlobs { get; set; }
        public DbSet<PermissionGroup> PermissionGroups { get; set; }
        public DbSet<PermissionGroupFlag> PermissionGroupFlags { get; set; }
        public DbSet<PermissionGroupMember> PermissionGroupMembers { get; set; }
        public DbSet<UserFeatureFlag> UserFeatureFlags { get; set; }

        public ApplicationDbContext(DbContextOptions options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.UseOpenIddict();

            builder.Entity<UserPasskey>(entity =>
            {
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CredentialId).IsUnique();
            });

            builder.Entity<StoredBlob>(entity =>
            {
                entity.ToTable("StoredBlobs");
            });

            builder.Entity<PermissionGroup>(entity =>
            {
                entity.HasIndex(e => e.Name).IsUnique();
                entity.HasIndex(e => e.IsDefault).IsUnique().HasFilter("\"IsDefault\" = 1");
            });

            builder.Entity<PermissionGroupFlag>(entity =>
            {
                entity.HasIndex(e => new { e.GroupId, e.Flag }).IsUnique();
                entity.HasOne(e => e.Group)
                    .WithMany(g => g.Flags)
                    .HasForeignKey(e => e.GroupId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<PermissionGroupMember>(entity =>
            {
                entity.HasIndex(e => new { e.GroupId, e.UserId }).IsUnique();
                entity.HasOne(e => e.Group)
                    .WithMany(g => g.Members)
                    .HasForeignKey(e => e.GroupId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<UserFeatureFlag>(entity =>
            {
                entity.HasIndex(e => new { e.UserId, e.Flag }).IsUnique();
            });
        }
    }
}
