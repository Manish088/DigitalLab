using Microsoft.AspNetCore.Identity;

namespace Lab.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public Guid? TenantId { get; set; }
    public string Role { get; set; } = "LabStaff"; // SuperAdmin, LabAdmin, LabManager, Pathologist, Technician, Receptionist
    public string Designation { get; set; } = "Lab Staff";
    public string? DigitalSignatureUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? PermissionsJson { get; set; } // JSON array of permitted module codes
}
