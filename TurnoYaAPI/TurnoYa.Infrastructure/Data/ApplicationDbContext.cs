using Microsoft.EntityFrameworkCore;
using TurnoYa.Core.Entities;

namespace TurnoYa.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<AppointmentStatusHistory> AppointmentStatusHistory => Set<AppointmentStatusHistory>();
    public DbSet<BusinessSettings> BusinessSettings => Set<BusinessSettings>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<BusinessImage> BusinessImages => Set<BusinessImage>();
    public DbSet<WompiTransaction> WompiTransactions => Set<WompiTransaction>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(p => p.AverageRating).HasPrecision(3,2);
        });

        modelBuilder.Entity<Business>(e =>
        {
            e.HasOne(b => b.Owner).WithMany(u => u.OwnedBusinesses).HasForeignKey(b => b.OwnerId).OnDelete(DeleteBehavior.Restrict);
            e.Property(p => p.AverageRating).HasPrecision(3,2);
            e.Property(p => p.Latitude).HasPrecision(10,7);
            e.Property(p => p.Longitude).HasPrecision(10,7);
            e.HasMany(b => b.Images).WithOne(img => img.Business).HasForeignKey(img => img.BusinessId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Service>(e =>
        {
            e.HasOne(s => s.Business).WithMany(b => b.Services).HasForeignKey(s => s.BusinessId).OnDelete(DeleteBehavior.Cascade);
            e.Property(p => p.Price).HasPrecision(10,2);
            e.Property(p => p.DepositAmount).HasPrecision(10,2);
        });

        modelBuilder.Entity<Employee>(e =>
        {
            e.HasOne(emp => emp.Business).WithMany(b => b.Employees).HasForeignKey(emp => emp.BusinessId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(emp => emp.User).WithMany().HasForeignKey(emp => emp.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Appointment>(e =>
        {
            e.HasIndex(a => a.ReferenceNumber).IsUnique();
            e.HasOne(a => a.User).WithMany(u => u.Appointments).HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.Business).WithMany(b => b.Appointments).HasForeignKey(a => a.BusinessId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.Service).WithMany(s => s.Appointments).HasForeignKey(a => a.ServiceId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.Employee).WithMany(e => e.Appointments).HasForeignKey(a => a.EmployeeId).OnDelete(DeleteBehavior.SetNull);
            e.Property(a => a.Status).HasConversion<string>();
            e.Property(a => a.PaymentMethod).HasConversion<string>();
            e.Property(a => a.PaymentStatus).HasConversion<string>();
            e.Property(p => p.TotalAmount).HasPrecision(10,2);
            e.Property(p => p.DepositAmount).HasPrecision(10,2);
        });

        modelBuilder.Entity<AppointmentStatusHistory>(e =>
        {
            e.HasOne(h => h.Appointment).WithMany(a => a.StatusHistory).HasForeignKey(h => h.AppointmentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BusinessSettings>(e =>
        {
            e.HasOne(s => s.Business).WithOne(b => b.Settings).HasForeignKey<BusinessSettings>(s => s.BusinessId).OnDelete(DeleteBehavior.Cascade);
            e.Property(p => p.NoShowDepositAmount).HasPrecision(10,2);
            e.Property(p => p.LateCancellationFee).HasPrecision(10,2);
        });

        modelBuilder.Entity<Review>(e =>
        {
            e.HasIndex(r => new { r.BusinessId, r.Rating });
            e.HasOne(r => r.Appointment).WithOne(a => a.Review).HasForeignKey<Review>(r => r.AppointmentId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(r => r.Business).WithMany(b => b.Reviews).HasForeignKey(r => r.BusinessId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(r => r.User).WithMany(u => u.Reviews).HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WompiTransaction>(e =>
        {
            e.HasIndex(t => t.Reference).IsUnique();
            e.HasOne(t => t.Appointment).WithOne(a => a.WompiTransaction).HasForeignKey<WompiTransaction>(t => t.AppointmentId).OnDelete(DeleteBehavior.Cascade);
            e.Property(p => p.Amount).HasPrecision(10,2);
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasIndex(rt => rt.Token).IsUnique();
            e.HasOne(rt => rt.User).WithMany().HasForeignKey(rt => rt.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}