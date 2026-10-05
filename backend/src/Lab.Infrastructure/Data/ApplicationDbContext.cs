using Lab.Application.Common.Interfaces;
using Lab.Domain.Common;
using Lab.Domain.Entities;
using Lab.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Lab.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<TenantLab> Tenants => Set<TenantLab>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<DoctorReferral> Doctors => Set<DoctorReferral>();
    public DbSet<CollectionAgent> CollectionAgents => Set<CollectionAgent>();
    public DbSet<TestCategory> TestCategories => Set<TestCategory>();
    public DbSet<TestMaster> Tests => Set<TestMaster>();
    public DbSet<TestParameter> TestParameters => Set<TestParameter>();
    public DbSet<ParameterNormalRange> ParameterNormalRanges => Set<ParameterNormalRange>();
    public DbSet<PackageProfileItem> PackageProfileItems => Set<PackageProfileItem>();
    public DbSet<CaseOrder> CaseOrders => Set<CaseOrder>();
    public DbSet<CaseOrderItem> CaseOrderItems => Set<CaseOrderItem>();
    public DbSet<TestResultValue> TestResultValues => Set<TestResultValue>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<DoctorCommissionPayout> DoctorCommissionPayouts => Set<DoctorCommissionPayout>();
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();
    public DbSet<SupportTicketReply> SupportTicketReplies => Set<SupportTicketReply>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<TenantSubscription> TenantSubscriptions => Set<TenantSubscription>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Global multi-tenancy query filters
        builder.Entity<Patient>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId));
        builder.Entity<DoctorReferral>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId));
        builder.Entity<CollectionAgent>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId));
        builder.Entity<TestCategory>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId || e.TenantId == Guid.Empty));
        builder.Entity<TestMaster>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId || e.TenantId == Guid.Empty));
        builder.Entity<TestParameter>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId || e.TenantId == Guid.Empty));
        builder.Entity<ParameterNormalRange>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId || e.TenantId == Guid.Empty));
        builder.Entity<PackageProfileItem>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId || e.TenantId == Guid.Empty));
        builder.Entity<CaseOrder>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId));
        builder.Entity<CaseOrderItem>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId));
        builder.Entity<TestResultValue>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId));
        builder.Entity<PaymentTransaction>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId));
        builder.Entity<DoctorCommissionPayout>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId));
        builder.Entity<SupportTicket>().HasQueryFilter(e => !e.IsDeleted && (_currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId));
        builder.Entity<SupportTicketReply>().HasQueryFilter(e => !e.IsDeleted);

        // Precision configurations
        foreach (var property in builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(18);
            property.SetScale(2);
        }

        // Relationships & Indexes
        builder.Entity<CaseOrder>()
            .HasIndex(c => new { c.TenantId, c.CaseNumber });

        builder.Entity<CaseOrder>()
            .HasIndex(c => new { c.TenantId, c.Barcode });

        builder.Entity<Patient>()
            .HasIndex(p => new { p.TenantId, p.Uhid });

        builder.Entity<CaseOrder>()
            .HasOne(c => c.Patient)
            .WithMany()
            .HasForeignKey(c => c.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<CaseOrder>()
            .HasOne(c => c.ReferringDoctor)
            .WithMany()
            .HasForeignKey(c => c.ReferringDoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<CaseOrder>()
            .HasOne(c => c.CollectionAgent)
            .WithMany()
            .HasForeignKey(c => c.CollectionAgentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<CaseOrderItem>()
            .HasOne(c => c.Test)
            .WithMany()
            .HasForeignKey(c => c.TestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TestResultValue>()
            .HasOne(t => t.Parameter)
            .WithMany()
            .HasForeignKey(t => t.ParameterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<DoctorCommissionPayout>()
            .HasOne(d => d.Doctor)
            .WithMany()
            .HasForeignKey(d => d.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<TenantSubscription>()
            .HasOne(s => s.TenantLab)
            .WithMany()
            .HasForeignKey(s => s.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<TenantSubscription>()
            .HasOne(s => s.Plan)
            .WithMany()
            .HasForeignKey(s => s.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PackageProfileItem>()
            .HasOne(p => p.ParentPackage)
            .WithMany(m => m.ChildPackageItems)
            .HasForeignKey(p => p.ParentPackageId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PackageProfileItem>()
            .HasOne(p => p.ChildTest)
            .WithMany()
            .HasForeignKey(p => p.ChildTestId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var currentTenantId = _currentUserService.TenantId;
        var currentUserId = _currentUserService.UserId;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.CreatedBy = currentUserId;
                    if (entry.Entity is TenantEntity tenantEntity && tenantEntity.TenantId == Guid.Empty && currentTenantId.HasValue)
                    {
                        tenantEntity.TenantId = currentTenantId.Value;
                    }
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedBy = currentUserId;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
