using Lab.Domain.Enums;

namespace Lab.Application.DTOs;

// Auth DTOs
public record LoginRequest(string EmailOrUsername, string Password);
public record LoginResponse(string Token, string RefreshToken, string UserId, string FullName, string Email, string Role, Guid? TenantId, string? LabName, string? LogoUrl, DateTime ExpiresAt);
public record RegisterLabRequest(string LabName, string OwnerName, string Email, string Phone, string Password, string? Address, string? City, string? State);
public record ChangePasswordRequest(string OldPassword, string NewPassword);
public record StaffUserDto(string Id, string FullName, string Email, string PhoneNumber, string Role, string Designation, bool IsActive, string? PermissionsJson);
public record CreateStaffUserRequest(string FullName, string Email, string PhoneNumber, string Password, string Role, string Designation, string? PermissionsJson);

// Dashboard DTOs
public record DashboardStatsDto(
    int TotalPatients,
    int TodayCases,
    int PendingTests,
    int CompletedReports,
    int ApprovedReports,
    decimal TodayCollection,
    decimal MonthlyRevenue,
    decimal TotalPendingDues,
    int TotalDoctors,
    int TotalAgents,
    List<DailyRevenueDto> RevenueTrend,
    List<RecentCaseItemDto> RecentCases,
    decimal TodayCashCollection = 0,
    decimal TodayUpiCollection = 0,
    decimal TodayCardCollection = 0,
    decimal TodayBilledAmount = 0,
    decimal TodayDiscountGiven = 0,
    decimal TodayDueCreated = 0
);

public record DailyRevenueDto(string Date, decimal Revenue, int CasesCount);
public record RecentCaseItemDto(Guid Id, string CaseNumber, string Barcode, string PatientName, string PatientPhone, decimal NetAmount, decimal DueAmount, string Status, string PaymentStatus, DateTime OrderDate);

// Patient & Case DTOs
public record PatientDto(Guid Id, string Uhid, string FullName, Gender Gender, int AgeYears, int AgeMonths, int AgeDays, string? Phone, string? Email, string? Address, string? BloodGroup);
public record CreatePatientDto(string FullName, Gender Gender, int AgeYears, int AgeMonths, int AgeDays, string? Phone, string? Email, string? Address, string? BloodGroup);

public record CreateCaseOrderDto(
    Guid? PatientId,
    CreatePatientDto? NewPatient,
    Guid? ReferringDoctorId,
    Guid? CollectionAgentId,
    PriorityLevel Priority,
    List<Guid> SelectedTestIds,
    decimal DiscountPercent,
    decimal DiscountAmount,
    string? DiscountReason,
    decimal PaidAmount,
    PaymentMethod PaymentMethod,
    string? TransactionRef,
    string? Notes
);

public record AddTestsToCaseDto(
    List<Guid> TestIds,
    decimal AdditionalDiscountAmount = 0,
    decimal AdditionalPaidAmount = 0,
    PaymentMethod PaymentMethod = PaymentMethod.Cash,
    string? TransactionRef = null
);

public record CaseOrderDto(
    Guid Id,
    Guid TenantId,
    string CaseNumber,
    string Barcode,
    Guid PatientId,
    PatientDto Patient,
    Guid? ReferringDoctorId,
    string? DoctorName,
    Guid? CollectionAgentId,
    string? AgentName,
    DateTime OrderDate,
    DateTime? SampleCollectedDate,
    DateTime? ReportingDate,
    PriorityLevel Priority,
    CaseStatus Status,
    decimal TotalAmount,
    decimal DiscountAmount,
    decimal DiscountPercent,
    string? DiscountReason,
    decimal TaxAmount,
    decimal NetAmount,
    decimal PaidAmount,
    decimal DueAmount,
    PaymentStatus PaymentStatus,
    Guid PublicAccessToken,
    string? ApprovedByName,
    DateTime? ApprovedAt,
    List<CaseOrderItemDto> Items,
    List<PaymentTransactionDto> Transactions
);

public record CaseOrderItemDto(
    Guid Id,
    Guid TestId,
    string TestCode,
    string TestName,
    string? CategoryName,
    string? SampleType,
    string? ContainerVialType,
    decimal ItemPrice,
    decimal NetAmount,
    ItemResultStatus Status,
    string? PathologistRemarks,
    string? InterpretationNote,
    List<TestResultValueDto> Results
);

public record TestResultValueDto(
    Guid Id,
    Guid ParameterId,
    string ParameterName,
    string? ResultValue,
    string? Unit,
    string? NormalRangeText,
    decimal? NumericValue,
    ResultFlag Flag,
    bool IsAbnormal,
    bool IsCriticalPanic,
    string? Remarks,
    int DisplayOrder
);

public record SettleDuePaymentDto(Guid CaseOrderId, decimal Amount, PaymentMethod PaymentMethod, string? ReferenceNumber, string? Remarks);
public record PaymentTransactionDto(Guid Id, string TransactionNumber, DateTime TransactionDate, decimal Amount, PaymentMethod PaymentMethod, string? ReferenceNumber, string? ReceivedByName, string? Remarks);

// Investigation Result Entry DTOs
public record SaveCaseResultsDto(
    Guid CaseOrderId,
    List<SaveItemResultDto> Items
);

public record SaveItemResultDto(
    Guid CaseOrderItemId,
    string? PathologistRemarks,
    string? InterpretationNote,
    List<SaveResultValueDto> Results
);

public record SaveResultValueDto(
    Guid ParameterId,
    string? ResultValue,
    string? Remarks
);

// Test Catalog DTOs
public record TestCategoryDto(Guid Id, string CategoryCode, string CategoryName, int DisplayOrder, bool IsActive, int TestsCount);
public record CreateTestCategoryDto(string CategoryCode, string CategoryName, int DisplayOrder);

public record TestMasterDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string TestCode,
    string TestName,
    string? ShortName,
    TestItemType ItemType,
    string? SampleType,
    string? ContainerVialType,
    decimal Price,
    decimal? CostPrice,
    int TatHours,
    string? Methodology,
    string? ClinicalSignificance,
    string? PreTestInstructions,
    string? InterpretationTemplate,
    bool IsActive,
    List<TestParameterDto> Parameters
);

public record CreateTestMasterDto(
    Guid CategoryId,
    string TestCode,
    string TestName,
    string? ShortName,
    TestItemType ItemType,
    string? SampleType,
    string? ContainerVialType,
    decimal Price,
    decimal? CostPrice,
    int TatHours,
    string? Methodology,
    string? ClinicalSignificance,
    string? PreTestInstructions,
    string? InterpretationTemplate,
    List<CreateTestParameterDto> Parameters
);

public record TestParameterDto(
    Guid Id,
    Guid TestId,
    string ParameterCode,
    string ParameterName,
    string? Unit,
    ParameterInputType InputType,
    string? DefaultValue,
    string? OptionsJson,
    string? FormulaExpression,
    int DisplayOrder,
    bool IsMandatory,
    List<ParameterNormalRangeDto> NormalRanges
);

public record CreateTestParameterDto(
    string ParameterCode,
    string ParameterName,
    string? Unit,
    ParameterInputType InputType,
    string? DefaultValue,
    string? OptionsJson,
    string? FormulaExpression,
    int DisplayOrder,
    bool IsMandatory,
    List<ParameterNormalRangeDto> NormalRanges
);

public record ParameterNormalRangeDto(
    Guid? Id,
    Gender ApplicableGender,
    int MinAgeDays,
    int MaxAgeDays,
    decimal? MinNormalValue,
    decimal? MaxNormalValue,
    decimal? PanicLowValue,
    decimal? PanicHighValue,
    string? TextualRange,
    string? AgeDisplayGroup
);

// Doctor & Agent DTOs
public record DoctorReferralDto(
    Guid Id,
    string DoctorCode,
    string DoctorName,
    string? Degree,
    string? Specialization,
    string? RegistrationNumber,
    string? ClinicHospitalName,
    string? Phone,
    string? Email,
    string? Address,
    CommissionType CommissionType,
    decimal DefaultCommissionValue,
    bool IsActive,
    int TotalCasesCount,
    decimal TotalBillingVolume,
    decimal TotalCommissionEarned,
    decimal TotalCommissionPaid,
    decimal PendingCommissionDue
);

public record CreateDoctorReferralDto(
    string DoctorCode,
    string DoctorName,
    string? Degree,
    string? Specialization,
    string? RegistrationNumber,
    string? ClinicHospitalName,
    string? Phone,
    string? Email,
    string? Address,
    CommissionType CommissionType,
    decimal DefaultCommissionValue
);

public record CollectionAgentDto(
    Guid Id,
    string AgentCode,
    string AgentName,
    string? CentreName,
    string? Phone,
    string? Email,
    string? Address,
    decimal CommissionPercent,
    bool IsActive,
    int TotalCasesCount,
    decimal TotalBillingVolume
);

public record CreateCollectionAgentDto(
    string AgentCode,
    string AgentName,
    string? CentreName,
    string? Phone,
    string? Email,
    string? Address,
    decimal CommissionPercent
);

public record DoctorPayoutRequest(
    Guid DoctorId,
    DateTime PeriodStartDate,
    DateTime PeriodEndDate,
    decimal PaidAmount,
    PaymentMethod PaymentMethod,
    string? TransactionReference,
    string? Remarks
);

public record DoctorPayoutRecordDto(
    Guid Id,
    Guid DoctorId,
    string DoctorName,
    string DoctorCode,
    string? Degree,
    string? Specialization,
    string? ClinicHospitalName,
    string? Phone,
    string PayoutNumber,
    DateTime PayoutDate,
    DateTime PeriodStartDate,
    DateTime PeriodEndDate,
    int TotalCasesCount,
    decimal TotalBillingVolume,
    decimal TotalCommissionEarned,
    decimal PaidAmount,
    decimal RemainingDue,
    PaymentMethod PaymentMethod,
    string? TransactionReference,
    string? Remarks
);


// Letterhead & Branding DTOs
public record LetterheadConfigDto(
    string LabName,
    string? Tagline,
    string? OwnerName,
    string? Phone,
    string? Email,
    string? Address,
    string? City,
    string? State,
    string? Pincode,
    string? Gstin,
    string? NablNumber,
    string? LogoUrl,
    string? HeaderImageUrl,
    string? FooterImageUrl,
    string? DigitalSignatureUrl,
    string? PathologistName,
    string? PathologistDegree,
    string? PathologistRegNo,
    double LetterheadMarginTopMm,
    double LetterheadMarginBottomMm,
    double LetterheadMarginLeftMm,
    double LetterheadMarginRightMm,
    bool ShowHeader,
    bool ShowFooter,
    bool ShowQrCode,
    bool ShowBarcodeOnBill,
    bool ShowDigitalSignature,
    string ReportFontFamily,
    string PrimaryColor
);

// SaaS & Subscription DTOs
public record SubscriptionPlanDto(
    Guid Id,
    string PlanCode,
    string PlanName,
    string Description,
    decimal MonthlyPrice,
    decimal AnnualPrice,
    int MaxCasesPerMonth,
    int MaxStaffAccounts,
    bool HasCustomLetterhead,
    bool HasPublicQrDownload,
    bool HasDoctorReferralModule,
    bool HasThermalPrinting,
    bool HasWhatsAppAlerts,
    bool IsActive
);

public record CreateRazorpayOrderRequest(Guid PlanId, string BillingCycle, string? PromoCode);
public record RazorpayOrderResponse(string OrderId, string KeyId, decimal Amount, string Currency, string LabName);
public record VerifyRazorpayPaymentRequest(string RazorpayOrderId, string RazorpayPaymentId, string RazorpaySignature, Guid PlanId, string BillingCycle);
public record SubmitManualPaymentRequest(Guid PlanId, string BillingCycle, string? TransactionUtr, string? Remarks);

// Support Ticket DTOs
public record SupportTicketDto(
    Guid Id,
    string TicketNumber,
    string Subject,
    string Category,
    TicketPriority Priority,
    TicketStatus Status,
    string Description,
    string? AttachmentUrl,
    DateTime CreatedAt,
    DateTime? ResolvedAt,
    string? ResolutionNotes,
    List<SupportTicketReplyDto> Replies
);

public record SupportTicketReplyDto(
    Guid Id,
    string SenderName,
    bool IsAdminReply,
    string Message,
    string? AttachmentUrl,
    DateTime CreatedAt
);

public record CreateSupportTicketDto(
    string Subject,
    string Category,
    TicketPriority Priority,
    string Description,
    string? AttachmentUrl
);

public record AddTicketReplyDto(
    Guid TicketId,
    string Message,
    string? AttachmentUrl
);

// SuperAdmin DTOs
public record SuperAdminDashboardStatsDto(
    int TotalLabs,
    int ActiveLabs,
    int ExpiredTrialLabs,
    int TotalPatientsSystemWide,
    int TotalCasesSystemWide,
    decimal TotalPlatformRevenueMonthly,
    decimal TotalPlatformRevenueAnnual,
    List<SuperAdminLabItemDto> RecentLabs
);

public record SuperAdminLabItemDto(
    Guid Id,
    string LabCode,
    string LabName,
    string OwnerName,
    string Email,
    string Phone,
    string City,
    string State,
    string SubscriptionStatus,
    DateTime? SubscriptionExpiryDate,
    DateTime CreatedAt,
    bool IsActive
);
