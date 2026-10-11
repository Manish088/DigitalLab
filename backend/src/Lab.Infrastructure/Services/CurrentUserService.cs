using System.Security.Claims;
using Lab.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Lab.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    public static readonly Guid MasterTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

    public Guid? TenantId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirstValue("TenantId");
            if (Guid.TryParse(claim, out var tenantId) && tenantId != Guid.Empty)
            {
                return tenantId;
            }

            // Also support X-Tenant-Id header for API/Public testing
            var header = _httpContextAccessor.HttpContext?.Request.Headers["X-Tenant-Id"].FirstOrDefault();
            if (Guid.TryParse(header, out var headerTenantId) && headerTenantId != Guid.Empty)
            {
                return headerTenantId;
            }

            // Deterministic default tenant for SuperAdmin
            if (IsSuperAdmin)
            {
                return MasterTenantId;
            }

            return null;
        }
    }

    public string? Role =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);

    public string? FullName =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);

    public string? Email =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email);

    public bool IsSuperAdmin =>
        Role == "SuperAdmin";
}
