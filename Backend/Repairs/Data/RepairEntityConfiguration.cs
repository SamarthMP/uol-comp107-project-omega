using Backend.Repairs.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Backend.Repairs.Data
{
    /// <summary>
    /// SQLite returns DateTime values with an unspecified kind, which would serialize without a UTC marker.
    /// These converters mark every stored timestamp as UTC when it is read back.
    /// </summary>
    internal static class UtcDateTimeConverters
    {
        public static readonly ValueConverter<DateTime, DateTime> Required = new(
            value => value,
            value => DateTime.SpecifyKind(value, DateTimeKind.Utc));

        public static readonly ValueConverter<DateTime?, DateTime?> Optional = new(
            value => value,
            value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : value);
    }

    public class RepairJobConfiguration : IEntityTypeConfiguration<RepairJob>
    {
        public void Configure(EntityTypeBuilder<RepairJob> entity)
        {
            entity.ToTable("RepairJobs");

            entity.Property(job => job.Priority).HasConversion<string>().HasMaxLength(32);
            entity.Property(job => job.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(job => job.Version).IsConcurrencyToken();

            entity.Property(job => job.CreatedAt).HasConversion(UtcDateTimeConverters.Required);
            entity.Property(job => job.UpdatedAt).HasConversion(UtcDateTimeConverters.Required);
            entity.Property(job => job.StartedAt).HasConversion(UtcDateTimeConverters.Optional);
            entity.Property(job => job.CompletedAt).HasConversion(UtcDateTimeConverters.Optional);

            entity.HasIndex(job => job.Status);

            entity.HasMany(job => job.History)
                .WithOne(entry => entry.Job)
                .HasForeignKey(entry => entry.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class RepairJobHistoryEntryConfiguration : IEntityTypeConfiguration<RepairJobHistoryEntry>
    {
        public void Configure(EntityTypeBuilder<RepairJobHistoryEntry> entity)
        {
            entity.ToTable("RepairJobHistory");

            entity.Property(entry => entry.Type).HasConversion<string>().HasMaxLength(32);
            entity.Property(entry => entry.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(entry => entry.CreatedAt).HasConversion(UtcDateTimeConverters.Required);

            entity.HasIndex(entry => new { entry.JobId, entry.CreatedAt });
        }
    }
}
