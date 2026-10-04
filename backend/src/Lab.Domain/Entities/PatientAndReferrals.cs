using Lab.Domain.Common;
using Lab.Domain.Enums;

namespace Lab.Domain.Entities;

public class Patient : TenantEntity
{
    public string Uhid { get; set; } = string.Empty; // e.g. PAT-2026-0001
    public string FullName { get; set; } = string.Empty;
    public Gender Gender { get; set; } = Gender.Male;
    public int AgeYears { get; set; }
    public int AgeMonths { get; set; }
    public int AgeDays { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? BloodGroup { get; set; }
    public string? MedicalHistory { get; set; }

    public ICollection<CaseOrder> CaseOrders { get; set; } = new List<CaseOrder>();
}

public class DoctorReferral : TenantEntity
{
    public string DoctorCode { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string? Degree { get; set; }
    public string? Specialization { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? ClinicHospitalName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public CommissionType CommissionType { get; set; } = CommissionType.Percentage;
    public decimal DefaultCommissionValue { get; set; } = 0; // % or flat amount
    public bool IsActive { get; set; } = true;

    public ICollection<CaseOrder> CaseOrders { get; set; } = new List<CaseOrder>();
    public ICollection<DoctorCommissionPayout> Payouts { get; set; } = new List<DoctorCommissionPayout>();
}

public class CollectionAgent : TenantEntity
{
    public string AgentCode { get; set; } = string.Empty;
    public string AgentName { get; set; } = string.Empty;
    public string? CentreName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public decimal CommissionPercent { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public ICollection<CaseOrder> CaseOrders { get; set; } = new List<CaseOrder>();
}
