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
        var identifier = (request.EmailOrUsername ?? "").Trim();
        var cleanPhone = new string(identifier.Where(char.IsDigit).ToArray());

        var user = await _userManager.FindByEmailAsync(identifier)
                   ?? await _userManager.FindByNameAsync(identifier);

        if (user == null && !string.IsNullOrWhiteSpace(cleanPhone))
        {
            user = await _userManager.Users.FirstOrDefaultAsync(u => 
                u.PhoneNumber == cleanPhone || 
                u.UserName == cleanPhone || 
                u.Email == $"{cleanPhone}@digitlab.in" ||
                u.Email == $"{cleanPhone}@digitlab.com" ||
                (u.PhoneNumber != null && u.PhoneNumber.EndsWith(cleanPhone)));
        }

        if (user == null)
            return Unauthorized(new { message = "This mobile number or email is not registered. Please start your 14-Day Free Trial." });

        if (!user.IsActive)
            return Unauthorized(new { message = "This account has been deactivated. Please contact administrator." });

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
            return Unauthorized(new { message = "Incorrect password. Please enter the correct password." });

        string? labName = null;
        string? logoUrl = null;
        try
        {
            if (user.Role == "SuperAdmin" && (!user.TenantId.HasValue || user.TenantId == Guid.Empty))
            {
                var masterTenant = await _context.Tenants.FirstOrDefaultAsync(t => t.LabCode == "MASTER")
                                   ?? await _context.Tenants.FirstOrDefaultAsync(t => t.IsActive);
                if (masterTenant != null)
                {
                    user.TenantId = masterTenant.Id;
                    await _userManager.UpdateAsync(user);
                }
            }

            if (user.TenantId.HasValue)
            {
                var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == user.TenantId.Value);
                labName = tenant?.LabName;
                logoUrl = tenant?.LogoUrl;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Login Tenant Warning] Could not resolve tenant details: {ex.Message}");
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
        if (string.IsNullOrWhiteSpace(request.LabName))
            return BadRequest(new { message = "Laboratory name is required." });

        if (string.IsNullOrWhiteSpace(request.OwnerName))
            return BadRequest(new { message = "Owner / Doctor name is required." });

        if (string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest(new { message = "Mobile / WhatsApp number is required." });

        var cleanPhone = new string((request.Phone ?? "").Where(char.IsDigit).ToArray());
        if (cleanPhone.Length < 10)
            return BadRequest(new { message = "Please enter a valid 10-digit mobile number." });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters long." });

        string userEmail;
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            userEmail = $"{cleanPhone}@digitlab.in";
        }
        else
        {
            if (!request.Email.Contains('@') || !request.Email.Contains('.'))
                return BadRequest(new { message = "Please enter a valid email address (e.g. lab@example.com)." });
            userEmail = request.Email.Trim().ToLowerInvariant();
        }

        var existingUser = await _userManager.FindByEmailAsync(userEmail);
        if (existingUser == null && !string.IsNullOrWhiteSpace(cleanPhone))
        {
            existingUser = await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == cleanPhone || u.UserName == cleanPhone || u.Email == $"{cleanPhone}@digitlab.in");
        }

        if (existingUser != null)
            return BadRequest(new { message = "An account with this mobile number or email already exists. Please Sign In." });

        var labCode = "LAB" + new Random().Next(1000, 9999);
        var trialPlan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.PlanCode == "TRIAL");

        var tenant = new TenantLab
        {
            LabCode = labCode,
            LabName = request.LabName,
            OwnerName = request.OwnerName,
            Email = userEmail,
            Phone = request.Phone,
            Address = request.Address ?? "",
            City = request.City ?? "",
            State = request.State ?? "",
            SubscriptionPlanId = trialPlan?.Id,
            SubscriptionStatus = "Trial",
            SubscriptionExpiryDate = DateTime.UtcNow.AddDays(14),
            IsActive = true
        };

        // Handle Referral Program: If valid referral code is provided, reward referrer with 30 days (1 month free)
        if (!string.IsNullOrWhiteSpace(request.ReferralCode))
        {
            var refCode = request.ReferralCode.Trim().ToUpperInvariant();
            var referrer = await _context.Tenants.FirstOrDefaultAsync(t => t.LabCode == refCode || t.Phone == request.ReferralCode.Trim());
            if (referrer != null)
            {
                var refExpiry = referrer.SubscriptionExpiryDate ?? DateTime.UtcNow;
                if (refExpiry < DateTime.UtcNow) refExpiry = DateTime.UtcNow;
                referrer.SubscriptionExpiryDate = refExpiry.AddDays(30);
                if (referrer.SubscriptionStatus == "Expired")
                    referrer.SubscriptionStatus = "Active";
                Console.WriteLine($"[Referral] Referral code {refCode} used! Extended Lab {referrer.LabCode} expiry by +30 days free!");
            }
        }

        await _context.Tenants.AddAsync(tenant);
        await _context.SaveChangesAsync();

        var user = new ApplicationUser
        {
            UserName = userEmail,
            Email = userEmail,
            PhoneNumber = cleanPhone,
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

        // Record initial 14-day free trial subscription in history
        if (trialPlan != null)
        {
            var trialSub = new TenantSubscription
            {
                TenantId = tenant.Id,
                TenantLabId = tenant.Id,
                PlanId = trialPlan.Id,
                BillingCycle = "Trial",
                StartDate = DateTime.UtcNow,
                EndDate = tenant.SubscriptionExpiryDate ?? DateTime.UtcNow.AddDays(14),
                AmountPaid = 0,
                PromoCodeUsed = "TRIAL14",
                Status = "Trial"
            };
            try
            {
                await _context.TenantSubscriptions.AddAsync(trialSub);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Auth] Trial sub record notice: {ex.Message}");
            }
        }

        // Seed complete standard pathology catalog (CBC, Lipid, LFT, KFT, Glucose, Urine, Thyroid, etc.)
        if (_context is ApplicationDbContext appDb)
        {
            try
            {
                await DbInitializer.SeedStandardCatalogForTenantAsync(appDb, tenant.Id);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Auth] Tenant seeding notice: {ex.Message}");
            }
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
