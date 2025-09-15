using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MediChain.Api.Models;

namespace MediChain.Api.Data;

public class MediChainDbContext : IdentityDbContext<Patient>
{
    public MediChainDbContext(DbContextOptions<MediChainDbContext> options) : base(options)
    {
    }

    public DbSet<HealthRecord> HealthRecords { get; set; }
    public DbSet<HealthRecordFile> HealthRecordFiles { get; set; }
    public DbSet<EmergencyInfo> EmergencyInfos { get; set; }
    public DbSet<QRAccess> QRAccesses { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure Patient entity
        builder.Entity<Patient>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.FirstName).IsRequired().HasMaxLength(50);
            entity.Property(p => p.LastName).IsRequired().HasMaxLength(50);
            entity.Property(p => p.DateOfBirth).IsRequired();
            entity.Property(p => p.BloodType).HasMaxLength(10);
            entity.Property(p => p.ProfilePhoto).HasMaxLength(200);
            entity.Property(p => p.CreatedAt).HasDefaultValueSql("NOW()");
        });

        // Configure HealthRecord entity
        builder.Entity<HealthRecord>(entity =>
        {
            entity.HasKey(h => h.RecordID);
            entity.Property(h => h.Title).IsRequired().HasMaxLength(100);
            entity.Property(h => h.Category).IsRequired().HasMaxLength(50);
            entity.Property(h => h.Content).IsRequired();
            entity.Property(h => h.IsActive).HasDefaultValue(true);
            entity.Property(h => h.CreatedAt).HasDefaultValueSql("NOW()");

            entity.HasOne(h => h.Patient)
                  .WithMany(p => p.HealthRecords)
                  .HasForeignKey(h => h.PatientID)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure EmergencyInfo entity
        builder.Entity<EmergencyInfo>(entity =>
        {
            entity.HasKey(e => e.PatientID);
            entity.Property(e => e.EmergencyContactName).HasMaxLength(100);
            entity.Property(e => e.EmergencyContactPhone).HasMaxLength(20);
            entity.Property(e => e.BloodType).HasMaxLength(10);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");

            entity.HasOne(e => e.Patient)
                  .WithOne(p => p.EmergencyInfo)
                  .HasForeignKey<EmergencyInfo>(e => e.PatientID)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure QRAccess entity
        builder.Entity<QRAccess>(entity =>
        {
            entity.HasKey(q => q.AccessID);
            entity.Property(q => q.QRToken).IsRequired().HasMaxLength(50);
            entity.Property(q => q.AccessLevel).IsRequired().HasMaxLength(20);
            entity.Property(q => q.ExpiresAt).IsRequired();
            entity.Property(q => q.CreatedAt).HasDefaultValueSql("NOW()");

            entity.HasOne(q => q.Patient)
                  .WithMany(p => p.QRAccesses)
                  .HasForeignKey(q => q.PatientID)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(q => q.QRToken).IsUnique();
        });

        // Configure HealthRecordFile entity
        builder.Entity<HealthRecordFile>(entity =>
        {
            entity.HasKey(f => f.FileID);
            entity.Property(f => f.OriginalFileName).IsRequired().HasMaxLength(255);
            entity.Property(f => f.StoredFileName).IsRequired().HasMaxLength(255);
            entity.Property(f => f.ContentType).IsRequired().HasMaxLength(100);
            entity.Property(f => f.FileSize).IsRequired();
            entity.Property(f => f.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(f => f.UploadedAt).HasDefaultValueSql("NOW()");

            entity.HasOne(f => f.HealthRecord)
                  .WithMany()
                  .HasForeignKey(f => f.RecordID)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}