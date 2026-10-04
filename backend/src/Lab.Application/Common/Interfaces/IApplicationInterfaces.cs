using Lab.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Lab.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<TenantLab> Tenants { get; }
    DbSet<Patient> Patients { get; }
    DbSet<DoctorReferral> Doctors { get; }
    DbSet<CollectionAgent> CollectionAgents { get; }
    DbSet<TestCategory> TestCategories { get; }
    DbSet<TestMaster> Tests { get; }
    DbSet<TestParameter> TestParameters { get; }
    DbSet<ParameterNormalRange> ParameterNormalRanges { get; }
    DbSet<PackageProfileItem> PackageProfileItems { get; }
    DbSet<CaseOrder> CaseOrders { get; }
    DbSet<CaseOrderItem> CaseOrderItems { get; }
    DbSet<TestResultValue> TestResultValues { get; }
    DbSet<PaymentTransaction> PaymentTransactions { get; }
    DbSet<DoctorCommissionPayout> DoctorCommissionPayouts { get; }
    DbSet<SupportTicket> SupportTickets { get; }
    DbSet<SupportTicketReply> SupportTicketReplies { get; }
    DbSet<SubscriptionPlan> SubscriptionPlans { get; }
    DbSet<TenantSubscription> TenantSubscriptions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ICurrentUserService
{
    string? UserId { get; }
    Guid? TenantId { get; }
    string? Role { get; }
    string? FullName { get; }
    bool IsSuperAdmin { get; }
}

public interface IPdfReportService
{
    Task<byte[]> GeneratePatientReportPdfAsync(Guid caseOrderId, bool isLetterheadMode = true);
    Task<byte[]> GenerateInvoicePdfAsync(Guid caseOrderId);
}

public interface IBarcodeService
{
    string GenerateCode39Svg(string barcodeText);
    string GenerateQrCodeSvg(string content);
}
