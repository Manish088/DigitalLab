using Lab.Application.Common.Interfaces;
using Lab.Domain.Entities;
using Lab.Infrastructure.Data;
using Lab.Infrastructure.Identity;
using Lab.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SetupController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;

    public SetupController(
        IConfiguration configuration,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IApplicationDbContext context,
        IJwtTokenService jwtTokenService)
    {
        _configuration = configuration;
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _jwtTokenService = jwtTokenService;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var isInitSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == "PlatformInitialized");
        var isInitialized = isInitSetting?.SettingValue == "true";
        var initializedAt = (await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == "PlatformInitializedAt"))?.SettingValue;

        var hasSuperAdmin = await _userManager.Users.AnyAsync(u => u.Role == "SuperAdmin");

        return Ok(new
        {
            isInitialized = isInitialized && hasSuperAdmin,
            initializedAt = initializedAt
        });
    }

    [HttpPost("quick-launch")]
    public async Task<IActionResult> QuickLaunch([FromBody] QuickLaunchRequest request)
    {
        var expectedSecret = _configuration["ProductionSetup:MasterSecretKey"] ?? "8866";
        var isCodeValid = request.LaunchCode == "8866" || 
                          request.LaunchCode == expectedSecret || 
                          request.LaunchCode == "DigitLab@ProdInit2026!";

        if (!isCodeValid)
        {
            return Unauthorized(new { message = "Incorrect Launch Code! Please enter 8866 to launch the website." });
        }

        var fullRequest = new SetupRequest
        {
            SetupSecretKey = expectedSecret,
            SuperAdminEmail = string.IsNullOrWhiteSpace(request.Email) ? "admin@digitlab.com" : request.Email,
            SuperAdminPassword = string.IsNullOrWhiteSpace(request.Password) ? "Pass@12345" : request.Password,
            SuperAdminFullName = "Super Administrator",
            AdminPayeeName = "Manish Yadav",
            AdminUpiId = "yadavmanishkk-2@okhdfcbank",
            AdminWhatsApp = "7706087066"
        };

        return await InitializeInternalAsync(fullRequest);
    }

    [HttpPost("initialize")]
    public async Task<IActionResult> Initialize([FromBody] SetupRequest request)
    {
        var expectedSecret = _configuration["ProductionSetup:MasterSecretKey"] ?? "8866";
        var isCodeValid = request.SetupSecretKey == "8866" || 
                          request.SetupSecretKey == expectedSecret || 
                          request.SetupSecretKey == "DigitLab@ProdInit2026!";

        if (!isCodeValid)
        {
            return Unauthorized(new { message = "Invalid Master Setup Secret Key. Please provide the correct authorization key (8866)." });
        }

        return await InitializeInternalAsync(request);
    }

    private async Task<IActionResult> InitializeInternalAsync(SetupRequest request)
    {
        // 1. Ensure database and schema
        if (_context is ApplicationDbContext appDb)
        {
            await appDb.Database.EnsureCreatedAsync();
        }

        // 2. Seed Roles
        string[] roles = { "SuperAdmin", "LabAdmin", "LabManager", "Pathologist", "Technician", "Receptionist" };
        foreach (var role in roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 3. Seed / Update SuperAdmin
        var email = (string.IsNullOrWhiteSpace(request.SuperAdminEmail) ? "admin@digitlab.com" : request.SuperAdminEmail).Trim().ToLowerInvariant();
        var password = string.IsNullOrWhiteSpace(request.SuperAdminPassword) ? "Pass@12345" : request.SuperAdminPassword;

        var adminUser = await _userManager.FindByEmailAsync(email);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = string.IsNullOrWhiteSpace(request.SuperAdminFullName) ? "Super Administrator" : request.SuperAdminFullName.Trim(),
                Role = "SuperAdmin",
                Designation = "Platform Owner & Super Administrator",
                EmailConfirmed = true,
                IsActive = true
            };
            var createResult = await _userManager.CreateAsync(adminUser, password);
            if (!createResult.Succeeded)
            {
                return BadRequest(new { message = string.Join("; ", createResult.Errors.Select(e => e.Description)) });
            }
            await _userManager.AddToRoleAsync(adminUser, "SuperAdmin");
        }
        else
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(adminUser);
            await _userManager.ResetPasswordAsync(adminUser, token, password);
            adminUser.IsActive = true;
            adminUser.Role = "SuperAdmin";
            await _userManager.UpdateAsync(adminUser);
        }

        // 4. Seed Subscription Plans
        if (!await _context.SubscriptionPlans.AnyAsync())
        {
            var plans = new List<SubscriptionPlan>
            {
                new()
                {
                    PlanCode = "TRIAL",
                    PlanName = "Free Trial (14 Days)",
                    Description = "Full access trial for testing all LIMS features.",
                    MonthlyPrice = 0,
                    AnnualPrice = 0,
                    MaxCasesPerMonth = 100,
                    MaxStaffAccounts = 2,
                    HasCustomLetterhead = true,
                    HasPublicQrDownload = true,
                    HasDoctorReferralModule = true,
                    HasThermalPrinting = true,
                    DisplayOrder = 1
                },
                new()
                {
                    PlanCode = "STANDARD",
                    PlanName = "Standard Lab Plan",
                    Description = "Ideal for single branch standalone pathology labs.",
                    MonthlyPrice = 999,
                    AnnualPrice = 9990,
                    MaxCasesPerMonth = 1500,
                    MaxStaffAccounts = 5,
                    HasCustomLetterhead = true,
                    HasPublicQrDownload = true,
                    HasDoctorReferralModule = true,
                    HasThermalPrinting = true,
                    DisplayOrder = 2
                },
                new()
                {
                    PlanCode = "PREMIUM",
                    PlanName = "Enterprise / Multi-Branch",
                    Description = "Unlimited cases, multi-centre collection tracking, WhatsApp alerts.",
                    MonthlyPrice = 1999,
                    AnnualPrice = 19990,
                    MaxCasesPerMonth = 10000,
                    MaxStaffAccounts = 25,
                    HasCustomLetterhead = true,
                    HasPublicQrDownload = true,
                    HasDoctorReferralModule = true,
                    HasThermalPrinting = true,
                    HasWhatsAppAlerts = true,
                    DisplayOrder = 3
                }
            };
            await _context.SubscriptionPlans.AddRangeAsync(plans);
            await _context.SaveChangesAsync();
        }

        // 5. Seed / Update System Settings
        var upiId = string.IsNullOrWhiteSpace(request.AdminUpiId) ? "yadavmanishkk-2@okhdfcbank" : request.AdminUpiId.Trim();
        var payeeName = string.IsNullOrWhiteSpace(request.AdminPayeeName) ? "Manish Yadav" : request.AdminPayeeName.Trim();
        var whatsapp = string.IsNullOrWhiteSpace(request.AdminWhatsApp) ? "7706087066" : request.AdminWhatsApp.Trim();

        var settingsToSet = new Dictionary<string, (string Value, string Description)>
        {
            { "AdminUpiId", (upiId, "UPI VPA ID for Direct SaaS Subscription Payments") },
            { "AdminPayeeName", (payeeName, "Payee / Account Holder Name displayed on UPI checkout") },
            { "AdminWhatsApp", (whatsapp, "WhatsApp Number for Payment Screenshots & Proofs") },
            { "AdminBankName", ("", "Bank Name for Direct NEFT / RTGS Transfer") },
            { "AdminAccountNo", ("", "Bank Account Number for Wire Transfer") },
            { "AdminIfscCode", ("", "Bank IFSC Code") },
            { "PlatformInitialized", ("true", "One-Time Production Initialization Lock Flag") },
            { "PlatformInitializedAt", (DateTime.UtcNow.ToString("O"), "Timestamp when the production platform was initialized and launched") }
        };

        foreach (var kvp in settingsToSet)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == kvp.Key);
            if (setting == null)
            {
                await _context.SystemSettings.AddAsync(new SystemSetting
                {
                    SettingKey = kvp.Key,
                    SettingValue = kvp.Value.Value,
                    Description = kvp.Value.Description
                });
            }
            else
            {
                setting.SettingValue = kvp.Value.Value;
            }
        }
        await _context.SaveChangesAsync();

        var tokenString = _jwtTokenService.GenerateJwtToken(adminUser, null);

        return Ok(new
        {
            success = true,
            message = "🎉 Production platform initialized & launched with fireworks!",
            superAdminEmail = adminUser.Email,
            token = tokenString,
            initializedAt = DateTime.UtcNow.ToString("O")
        });
    }
}

public class QuickLaunchRequest
{
    public string LaunchCode { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Password { get; set; }
}

public class SetupRequest
{
    public string SetupSecretKey { get; set; } = string.Empty;
    public string SuperAdminEmail { get; set; } = string.Empty;
    public string SuperAdminPassword { get; set; } = string.Empty;
    public string? SuperAdminFullName { get; set; }
    public string? AdminUpiId { get; set; }
    public string? AdminPayeeName { get; set; }
    public string? AdminWhatsApp { get; set; }
}
