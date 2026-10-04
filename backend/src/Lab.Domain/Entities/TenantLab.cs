using Lab.Domain.Common;

namespace Lab.Domain.Entities;

public class TenantLab : BaseEntity
{
    public string LabCode { get; set; } = string.Empty;
    public string LabName { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? OwnerName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public string? Gstin { get; set; }
    public string? NablNumber { get; set; }
    public string? LogoUrl { get; set; }
    public string? HeaderImageUrl { get; set; }
    public string? FooterImageUrl { get; set; }
    public string? DigitalSignatureUrl { get; set; }
    public string? PathologistName { get; set; }
    public string? PathologistDegree { get; set; }
    public string? PathologistRegNo { get; set; }

    public double LetterheadMarginTopMm { get; set; } = 35.0;
    public double LetterheadMarginBottomMm { get; set; } = 30.0;
    public double LetterheadMarginLeftMm { get; set; } = 15.0;
    public double LetterheadMarginRightMm { get; set; } = 15.0;
    public bool ShowHeader { get; set; } = true;
    public bool ShowFooter { get; set; } = true;
    public bool ShowQrCode { get; set; } = true;
    public bool ShowBarcodeOnBill { get; set; } = true;
    public bool ShowDigitalSignature { get; set; } = true;
    public string ReportFontFamily { get; set; } = "Helvetica";
    public string PrimaryColor { get; set; } = "#0284c7";

    public bool IsActive { get; set; } = true;
    public Guid? SubscriptionPlanId { get; set; }
    public DateTime? SubscriptionExpiryDate { get; set; }
    public string SubscriptionStatus { get; set; } = "Trial"; // Trial, Active, Expired, Suspended

    public ICollection<Patient> Patients { get; set; } = new List<Patient>();
    public ICollection<CaseOrder> CaseOrders { get; set; } = new List<CaseOrder>();
    public ICollection<TestMaster> Tests { get; set; } = new List<TestMaster>();
    public ICollection<DoctorReferral> Doctors { get; set; } = new List<DoctorReferral>();
}
