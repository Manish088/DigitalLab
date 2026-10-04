using Lab.Domain.Common;
using Lab.Domain.Enums;

namespace Lab.Domain.Entities;

public class CaseOrder : TenantEntity
{
    public string CaseNumber { get; set; } = string.Empty; // e.g. LS-2026-00101
    public string Barcode { get; set; } = string.Empty; // e.g. 2600101

    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public Guid? ReferringDoctorId { get; set; }
    public DoctorReferral? ReferringDoctor { get; set; }

    public Guid? CollectionAgentId { get; set; }
    public CollectionAgent? CollectionAgent { get; set; }

    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime? SampleCollectedDate { get; set; }
    public DateTime? ReportingDate { get; set; }
    public PriorityLevel Priority { get; set; } = PriorityLevel.Routine;
    public CaseStatus Status { get; set; } = CaseStatus.Registered;

    // Financials
    public decimal TotalAmount { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? DiscountReason { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal NetAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DueAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;

    // Referral Commissions
    public decimal DoctorCommissionAmount { get; set; }
    public decimal AgentCommissionAmount { get; set; }
    public bool IsDoctorCommissionPaid { get; set; } = false;

    // Security & Public Access
    public Guid PublicAccessToken { get; set; } = Guid.NewGuid();
    public string? ClinicalNotes { get; set; }

    // Approvals
    public string? ApprovedByUserId { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public ICollection<CaseOrderItem> Items { get; set; } = new List<CaseOrderItem>();
    public ICollection<PaymentTransaction> Transactions { get; set; } = new List<PaymentTransaction>();
}

public class CaseOrderItem : TenantEntity
{
    public Guid CaseOrderId { get; set; }
    public CaseOrder CaseOrder { get; set; } = null!;

    public Guid TestId { get; set; }
    public TestMaster Test { get; set; } = null!;

    public decimal ItemPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal NetAmount { get; set; }

    public ItemResultStatus Status { get; set; } = ItemResultStatus.Pending;
    public string? SampleCollectedNotes { get; set; }
    public string? PathologistRemarks { get; set; }
    public string? InterpretationNote { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedByName { get; set; }

    public ICollection<TestResultValue> Results { get; set; } = new List<TestResultValue>();
}

public class TestResultValue : TenantEntity
{
    public Guid CaseOrderItemId { get; set; }
    public CaseOrderItem CaseOrderItem { get; set; } = null!;

    public Guid ParameterId { get; set; }
    public TestParameter Parameter { get; set; } = null!;

    public string ParameterName { get; set; } = string.Empty;
    public string? ResultValue { get; set; }
    public string? Unit { get; set; }
    public string? NormalRangeText { get; set; }
    public decimal? NumericValue { get; set; }
    public ResultFlag Flag { get; set; } = ResultFlag.Normal;
    public bool IsAbnormal { get; set; } = false;
    public bool IsCriticalPanic { get; set; } = false;
    public string? Remarks { get; set; }
    public int DisplayOrder { get; set; }
}

public class PaymentTransaction : TenantEntity
{
    public Guid CaseOrderId { get; set; }
    public CaseOrder CaseOrder { get; set; } = null!;

    public string TransactionNumber { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public string? ReferenceNumber { get; set; } // UPI UTR, Card Auth Code, Cheque No
    public string? ReceivedByName { get; set; }
    public string? Remarks { get; set; }
}

public class DoctorCommissionPayout : TenantEntity
{
    public Guid DoctorId { get; set; }
    public DoctorReferral Doctor { get; set; } = null!;

    public string PayoutNumber { get; set; } = string.Empty;
    public DateTime PayoutDate { get; set; } = DateTime.UtcNow;
    public DateTime PeriodStartDate { get; set; }
    public DateTime PeriodEndDate { get; set; }
    public int TotalCasesCount { get; set; }
    public decimal TotalBillingVolume { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.NetBanking;
    public string? TransactionReference { get; set; }
    public string? Remarks { get; set; }
}
