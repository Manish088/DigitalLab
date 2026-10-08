using Lab.Application.Common.Interfaces;
using Lab.Application.DTOs;
using Lab.Domain.Entities;
using Lab.Infrastructure.Data;
using Lab.Infrastructure.Identity;
using Lab.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtTokenService jwtTokenService,
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.EmailOrUsername)
                   ?? await _userManager.FindByNameAsync(request.EmailOrUsername);

        if (user == null)
            return Unauthorized(new { message = "This email or username is not registered. Please register first." });

        if (!user.IsActive)
            return Unauthorized(new { message = "This account has been deactivated. Please contact administrator." });

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
            return Unauthorized(new { message = "Incorrect password. Please enter the correct password." });

        string? labName = null;
        string? logoUrl = null;
        if (user.TenantId.HasValue)
        {
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == user.TenantId.Value);
            labName = tenant?.LabName;
            logoUrl = tenant?.LogoUrl;
        }

        var token = _jwtTokenService.GenerateJwtToken(user, labName);

        return Ok(new LoginResponse(
            Token: token,
            RefreshToken: Guid.NewGuid().ToString("N"),
            UserId: user.Id,
            FullName: user.FullName,
            Email: user.Email ?? "",
            Role: user.Role,
            TenantId: user.TenantId,
            LabName: labName,
            LogoUrl: logoUrl,
            ExpiresAt: DateTime.UtcNow.AddHours(24)
        ));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterLabRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
            return BadRequest(new { message = "An account with this email already exists." });

        var labCode = "LAB" + new Random().Next(1000, 9999);
        var tenant = new TenantLab
        {
            LabCode = labCode,
            LabName = request.LabName,
            OwnerName = request.OwnerName,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            City = request.City,
            State = request.State,
            SubscriptionStatus = "Trial",
            SubscriptionExpiryDate = DateTime.UtcNow.AddDays(14)
        };

        await _context.Tenants.AddAsync(tenant);
        await _context.SaveChangesAsync();

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.OwnerName,
            TenantId = tenant.Id,
            Role = "LabAdmin",
            Designation = "Lab Owner / Administrator",
            EmailConfirmed = true,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });
        }

        await _userManager.AddToRoleAsync(user, "LabAdmin");

        // Seed complete standard pathology catalog (CBC, Lipid, LFT, KFT, Glucose, Urine, Thyroid, etc.)
        if (_context is ApplicationDbContext appDb)
        {
            await DbInitializer.SeedStandardCatalogForTenantAsync(appDb, tenant.Id);
        }

        var token = _jwtTokenService.GenerateJwtToken(user, tenant.LabName);

        return Ok(new LoginResponse(
            Token: token,
            RefreshToken: Guid.NewGuid().ToString("N"),
            UserId: user.Id,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role,
            TenantId: tenant.Id,
            LabName: tenant.LabName,
            LogoUrl: tenant.LogoUrl,
            ExpiresAt: DateTime.UtcNow.AddHours(24)
        ));
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound();

        string? labName = null;
        if (user.TenantId.HasValue)
        {
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == user.TenantId.Value);
            labName = tenant?.LabName;
        }

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.PhoneNumber,
            user.Role,
            user.Designation,
            user.TenantId,
            LabName = labName,
            user.PermissionsJson
        });
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound();

        var result = await _userManager.ChangePasswordAsync(user, request.OldPassword, request.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

        return Ok(new { message = "Password updated successfully." });
    }
}
