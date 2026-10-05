using System.ComponentModel.DataAnnotations.Schema;
using Lab.Domain.Common;
using Lab.Domain.Enums;

namespace Lab.Domain.Entities;

public class SupportTicket : TenantEntity
{
    public string TicketNumber { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = "General"; // Billing, Software, Report, Integration
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketStatus Status { get; set; } = TicketStatus.Open;
    public string Description { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolutionNotes { get; set; }

    public ICollection<SupportTicketReply> Replies { get; set; } = new List<SupportTicketReply>();
}

public class SupportTicketReply : BaseEntity
{
    public Guid TicketId { get; set; }
    public SupportTicket Ticket { get; set; } = null!;

    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public bool IsAdminReply { get; set; } = false;
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
}

public class SubscriptionPlan : BaseEntity
{
    public string PlanCode { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public decimal AnnualPrice { get; set; }
    public int MaxCasesPerMonth { get; set; } = 500;
    public int MaxStaffAccounts { get; set; } = 5;
    public bool HasCustomLetterhead { get; set; } = true;
    public bool HasPublicQrDownload { get; set; } = true;
    public bool HasDoctorReferralModule { get; set; } = true;
    public bool HasThermalPrinting { get; set; } = true;
    public bool HasWhatsAppAlerts { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}

public class TenantSubscription : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid? TenantLabId { get; set; }

    [ForeignKey(nameof(TenantId))]
    public TenantLab? TenantLab { get; set; }

    public Guid PlanId { get; set; }

    [ForeignKey(nameof(PlanId))]
    public SubscriptionPlan? Plan { get; set; }

    public string BillingCycle { get; set; } = "Monthly"; // Monthly, Annual
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; }
    public decimal AmountPaid { get; set; }
    public string? PromoCodeUsed { get; set; }
    public decimal DiscountGiven { get; set; }
    public string? RazorpayOrderId { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public string? RazorpaySignature { get; set; }
    public string Status { get; set; } = "Active"; // Active, Expired, Cancelled
    public string? InvoicePdfUrl { get; set; }
}

public class SystemSetting : BaseEntity
{
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string? Description { get; set; }
}
