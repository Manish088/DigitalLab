using Lab.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

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
    DbSet<SystemSetting> SystemSettings { get; }
    DbSet<AdCampaign> AdCampaigns { get; }
    DbSet<AdCampaignLab> AdCampaignLabs { get; }

    EntityEntry<TEntity> Entry<TEntity>(TEntity entity) where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ICurrentUserService
{
    string? UserId { get; }
    Guid? TenantId { get; }
    string? Role { get; }
    string? FullName { get; }
    string? Email { get; }
    bool IsSuperAdmin { get; }
}

public interface IPdfReportService
{
    Task<byte[]> GeneratePatientReportPdfAsync(Guid caseOrderId, bool isLetterheadMode = true);
    Task<byte[]> GenerateInvoicePdfAsync(Guid caseOrderId);
    Task<byte[]> GenerateThermalReceiptPdfAsync(Guid caseOrderId, int widthMm = 80);
}

public interface IBarcodeService
{
    string GenerateCode39Svg(string barcodeText);
    string GenerateQrCodeSvg(string content);
}

public class WhatsAppSendResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? MessageId { get; set; }
    public string DeliveryChannel { get; set; } = "None"; // MetaCloudApi, UltraMsg, Twilio, ClientShareNeeded
    public bool RequiresClientShare { get; set; }
}

public interface IWhatsAppNotificationService
{
    bool IsConfigured { get; }
    string ProviderName { get; }
    Task<WhatsAppSendResult> SendReportPdfAsync(
        string recipientPhone,
        string recipientName,
        string caseNumber,
        string downloadUrl,
        byte[] pdfBytes,
        string fileName,
        string? customMessage = null);
}

public interface IEmailService
{
    bool IsConfigured { get; }
    Task<(bool Success, string Message)> SendPasswordResetOtpAsync(string toEmail, string recipientName, string otp);
    Task<(bool Success, string Message)> SendRegistrationVerificationOtpAsync(string toEmail, string recipientName, string otp);
    Task<(bool Success, string Message)> SendWelcomeCredentialsEmailAsync(string toEmail, string recipientName, string labName, string defaultPassword);
    Task<(bool Success, string Message)> SendPatientReportReadyEmailAsync(string toEmail, string patientName, string labName, string caseNumber, string uhid, List<string> testNames, string downloadUrl);
    Task<(bool Success, string Message)> SendPatientRegistrationReceiptEmailAsync(string toEmail, string patientName, string labName, string caseNumber, string uhid, List<string> testNames, decimal netAmount, decimal paidAmount, decimal dueAmount, string viewUrl);
    Task<(bool Success, string Message)> SendStaffCredentialsEmailAsync(string toEmail, string staffName, string labName, string role, string designation, string password);
    Task<(bool Success, string Message)> SendTicketReplyNotificationEmailAsync(string toEmail, string recipientName, string ticketNumber, string subject, string senderName, string replyMessage);
    Task<(bool Success, string Message)> SendEmailAsync(string toEmail, string subject, string htmlBody);
}
