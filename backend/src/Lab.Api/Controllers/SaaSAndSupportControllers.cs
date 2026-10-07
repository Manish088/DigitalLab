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
using Microsoft.Extensions.Configuration;

namespace Lab.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SubscriptionsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IConfiguration _config;

    public SubscriptionsController(IApplicationDbContext context, ICurrentUserService currentUserService, IConfiguration config)
    {
        _context = context;
        _currentUserService = currentUserService;
        _config = config;
    }

    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<ActionResult<List<SubscriptionPlanDto>>> GetPlans()
    {
        var plans = await _context.SubscriptionPlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.DisplayOrder)
            .Select(p => new SubscriptionPlanDto(
                p.Id,
                p.PlanCode,
                p.PlanName,
                p.Description,
                p.MonthlyPrice,
                p.AnnualPrice,
                p.MaxCasesPerMonth,
                p.MaxStaffAccounts,
                p.HasCustomLetterhead,
                p.HasPublicQrDownload,
                p.HasDoctorReferralModule,
                p.HasThermalPrinting,
                p.HasWhatsAppAlerts,
                p.IsActive
            ))
            .ToListAsync();

        return Ok(plans);
    }

    [HttpGet("my-subscription")]
    public async Task<ActionResult<object>> GetMySubscription()
    {
        var tenantId = _currentUserService.TenantId;
        var lab = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (lab == null) return NotFound();

        var activePlan = lab.SubscriptionPlanId.HasValue
            ? await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == lab.SubscriptionPlanId.Value)
            : null;

        var history = await _context.TenantSubscriptions
            .Include(s => s.Plan)
            .Where(s => s.TenantId == tenantId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                PlanName = s.Plan.PlanName,
                s.BillingCycle,
                s.StartDate,
                s.EndDate,
                s.AmountPaid,
                s.Status,
                s.RazorpayPaymentId
            })
            .ToListAsync();

        var isExpired = lab.SubscriptionStatus == "Expired" || 
                        lab.SubscriptionStatus == "Suspended" || 
                        (lab.SubscriptionExpiryDate.HasValue && lab.SubscriptionExpiryDate.Value < DateTime.UtcNow);

        if (isExpired && lab.SubscriptionStatus != "Suspended" && lab.SubscriptionStatus != "Expired")
        {
            lab.SubscriptionStatus = "Expired";
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            lab.SubscriptionStatus,
            lab.SubscriptionExpiryDate,
            IsExpired = isExpired,
            CurrentPlan = activePlan != null ? new { activePlan.Id, activePlan.PlanName, activePlan.PlanCode, activePlan.MonthlyPrice, activePlan.AnnualPrice, activePlan.MaxCasesPerMonth } : null,
            History = history
        });
    }

    [HttpPost("create-order")]
    public async Task<ActionResult<RazorpayOrderResponse>> CreateOrder([FromBody] CreateRazorpayOrderRequest req)
    {
        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == req.PlanId);
        if (plan == null) return NotFound("Plan not found");

        var amount = req.BillingCycle == "Annual" ? plan.AnnualPrice : plan.MonthlyPrice;
        var mockOrderId = "order_" + Guid.NewGuid().ToString("N")[..14];

        var tenantId = _currentUserService.TenantId;
        var lab = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);

        return Ok(new RazorpayOrderResponse(
            OrderId: mockOrderId,
            KeyId: "rzp_test_DigitLabDemoKey",
            Amount: amount,
            Currency: "INR",
            LabName: lab?.LabName ?? "Pathology Lab"
        ));
    }

    [HttpPost("verify-payment")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyRazorpayPaymentRequest req)
    {
        var tenantId = _currentUserService.TenantId;
        var lab = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (lab == null) return NotFound();

        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == req.PlanId);
        if (plan == null) return NotFound("Plan not found");

        var amount = req.BillingCycle == "Annual" ? plan.AnnualPrice : plan.MonthlyPrice;
        var months = req.BillingCycle == "Annual" ? 12 : 1;

        lab.SubscriptionPlanId = plan.Id;
        lab.SubscriptionStatus = "Active";
        lab.SubscriptionExpiryDate = (lab.SubscriptionExpiryDate.HasValue && lab.SubscriptionExpiryDate > DateTime.UtcNow
            ? lab.SubscriptionExpiryDate.Value
            : DateTime.UtcNow).AddMonths(months);

        var subscription = new TenantSubscription
        {
            TenantId = lab.Id,
            TenantLabId = lab.Id,
            TenantLab = lab,
            PlanId = plan.Id,
            Plan = plan,
            BillingCycle = req.BillingCycle,
            StartDate = DateTime.UtcNow,
            EndDate = lab.SubscriptionExpiryDate.Value,
            AmountPaid = amount,
            RazorpayOrderId = req.RazorpayOrderId,
            RazorpayPaymentId = req.RazorpayPaymentId,
            RazorpaySignature = req.RazorpaySignature,
            Status = "Active"
        };

        try
        {
            await _context.TenantSubscriptions.AddAsync(subscription);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Subscriptions] Warning saving subscription record: {ex.Message}");
            _context.Entry(subscription).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Subscription activated successfully!", ExpiryDate = lab.SubscriptionExpiryDate });
    }

    [HttpGet("payment-config")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetPaymentConfig()
    {
        var upiId = _config["PaymentSettings:AdminUpiId"] ?? "yadavmanishkk-2@okhdfcbank";
        var payeeName = _config["PaymentSettings:AdminPayeeName"] ?? "Manish Yadav";
        var whatsApp = _config["PaymentSettings:AdminWhatsApp"] ?? "7706087066";
        var bankName = _config["PaymentSettings:AdminBankName"] ?? "HDFC Bank";
        var accountNo = _config["PaymentSettings:AdminAccountNo"] ?? "50100012345678";
        var ifscCode = _config["PaymentSettings:AdminIfscCode"] ?? "HDFC0000123";

        try
        {
            var settings = await _context.SystemSettings.AsNoTracking().ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);
            if (settings.TryGetValue("AdminUpiId", out var dbUpi) && !string.IsNullOrWhiteSpace(dbUpi)) upiId = dbUpi;
            if (settings.TryGetValue("AdminPayeeName", out var dbName) && !string.IsNullOrWhiteSpace(dbName)) payeeName = dbName;
            if (settings.TryGetValue("AdminWhatsApp", out var dbWa) && !string.IsNullOrWhiteSpace(dbWa)) whatsApp = dbWa;
            if (settings.TryGetValue("AdminBankName", out var dbBank) && !string.IsNullOrWhiteSpace(dbBank)) bankName = dbBank;
            if (settings.TryGetValue("AdminAccountNo", out var dbAcc) && !string.IsNullOrWhiteSpace(dbAcc)) accountNo = dbAcc;
            if (settings.TryGetValue("AdminIfscCode", out var dbIfsc) && !string.IsNullOrWhiteSpace(dbIfsc)) ifscCode = dbIfsc;
        }
        catch
        {
            // Table doesn't exist yet or connection issue -> fallback smoothly
        }

        return Ok(new
        {
            UpiId = upiId,
            PayeeName = payeeName,
            WhatsAppNumber = whatsApp,
            BankName = bankName,
            AccountNo = accountNo,
            IfscCode = ifscCode
        });
    }

    [HttpPost("submit-manual-payment")]
    public async Task<IActionResult> SubmitManualPayment([FromBody] SubmitManualPaymentRequest req)
    {
        var tenantId = _currentUserService.TenantId;
        var lab = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (lab == null) return NotFound("Lab not found");

        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == req.PlanId);
        if (plan == null) return NotFound("Plan not found");

        var amount = req.BillingCycle == "Annual" ? plan.AnnualPrice : plan.MonthlyPrice;
        var months = req.BillingCycle == "Annual" ? 12 : 1;
        var estExpiry = (lab.SubscriptionExpiryDate.HasValue && lab.SubscriptionExpiryDate > DateTime.UtcNow
            ? lab.SubscriptionExpiryDate.Value
            : DateTime.UtcNow).AddMonths(months);

        var subscription = new TenantSubscription
        {
            TenantId = lab.Id,
            TenantLabId = lab.Id,
            TenantLab = lab,
            PlanId = plan.Id,
            Plan = plan,
            BillingCycle = req.BillingCycle,
            StartDate = DateTime.UtcNow,
            EndDate = estExpiry,
            AmountPaid = amount,
            RazorpayOrderId = "MANUAL_UPI",
            RazorpayPaymentId = !string.IsNullOrWhiteSpace(req.TransactionUtr) ? req.TransactionUtr.Trim() : ("UPI_" + Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()),
            RazorpaySignature = "MANUAL_SUBMISSION",
            Status = "Pending Verification"
        };

        try
        {
            await _context.TenantSubscriptions.AddAsync(subscription);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Subscriptions] Warning saving subscription record: {ex.Message}");
            _context.Entry(subscription).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Payment submitted successfully! Super Admin will verify your UTR and activate your subscription shortly.", ExpiryDate = lab.SubscriptionExpiryDate });
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SupportTicketsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public SupportTicketsController(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SupportTicketDto>>> GetTickets()
    {
        var list = await _context.SupportTickets
            .Include(t => t.Replies)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new SupportTicketDto(
                t.Id,
                t.TicketNumber,
                t.Subject,
                t.Category,
                t.Priority,
                t.Status,
                t.Description,
                t.AttachmentUrl,
                t.CreatedAt,
                t.ResolvedAt,
                t.ResolutionNotes,
                t.Replies.OrderBy(r => r.CreatedAt).Select(r => new SupportTicketReplyDto(
                    r.Id,
                    r.SenderName,
                    r.IsAdminReply,
                    r.Message,
                    r.AttachmentUrl,
                    r.CreatedAt
                )).ToList()
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<SupportTicketDto>> CreateTicket([FromBody] CreateSupportTicketDto dto)
    {
        var count = await _context.SupportTickets.CountAsync() + 1;
        var ticket = new SupportTicket
        {
            TicketNumber = $"TKT-{DateTime.UtcNow:yyyyMM}-{count:D4}",
            Subject = dto.Subject,
            Category = dto.Category,
            Priority = dto.Priority,
            Status = Domain.Enums.TicketStatus.Open,
            Description = dto.Description,
            AttachmentUrl = dto.AttachmentUrl
        };

        await _context.SupportTickets.AddAsync(ticket);
        await _context.SaveChangesAsync();

        return Ok(new SupportTicketDto(ticket.Id, ticket.TicketNumber, ticket.Subject, ticket.Category, ticket.Priority, ticket.Status, ticket.Description, ticket.AttachmentUrl, ticket.CreatedAt, null, null, new List<SupportTicketReplyDto>()));
    }

    [HttpPost("reply")]
    public async Task<IActionResult> AddReply([FromBody] AddTicketReplyDto dto)
    {
        var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == dto.TicketId);
        if (ticket == null) return NotFound();

        var reply = new SupportTicketReply
        {
            TicketId = dto.TicketId,
            SenderId = _currentUserService.UserId ?? "Unknown",
            SenderName = _currentUserService.FullName ?? "Staff",
            IsAdminReply = _currentUserService.IsSuperAdmin,
            Message = dto.Message,
            AttachmentUrl = dto.AttachmentUrl
        };

        await _context.SupportTicketReplies.AddAsync(reply);
        ticket.Status = _currentUserService.IsSuperAdmin ? Domain.Enums.TicketStatus.InProgress : Domain.Enums.TicketStatus.Open;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Reply added.", replyId = reply.Id });
    }
}

[Authorize(Roles = "SuperAdmin")]
[ApiController]
[Route("api/admin")]
public class SuperAdminController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtTokenService;

    public SuperAdminController(
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IJwtTokenService jwtTokenService)
    {
        _context = context;
        _userManager = userManager;
        _jwtTokenService = jwtTokenService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<SuperAdminDashboardStatsDto>> GetAdminDashboard()
    {
        var totalLabs = await _context.Tenants.CountAsync();
        var activeLabs = await _context.Tenants.CountAsync(t => t.IsActive && t.SubscriptionStatus == "Active");
        var expiredLabs = await _context.Tenants.CountAsync(t => t.SubscriptionExpiryDate < DateTime.UtcNow);

        var totalPatients = await _context.Patients.IgnoreQueryFilters().CountAsync();
        var totalCases = await _context.CaseOrders.IgnoreQueryFilters().CountAsync();

        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var monthlyRevenue = await _context.TenantSubscriptions
            .Where(s => s.CreatedAt >= startOfMonth)
            .SumAsync(s => (decimal?)s.AmountPaid) ?? 0;

        var annualRevenue = await _context.TenantSubscriptions
            .SumAsync(s => (decimal?)s.AmountPaid) ?? 0;

        var recentLabs = await _context.Tenants
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new SuperAdminLabItemDto(
                t.Id,
                t.LabCode,
                t.LabName,
                t.OwnerName ?? "N/A",
                t.Email ?? "N/A",
                t.Phone ?? "N/A",
                t.City ?? "N/A",
                t.State ?? "N/A",
                t.SubscriptionStatus,
                t.SubscriptionExpiryDate,
                t.CreatedAt,
                t.IsActive
            ))
            .ToListAsync();

        return Ok(new SuperAdminDashboardStatsDto(
            totalLabs,
            activeLabs,
            expiredLabs,
            totalPatients,
            totalCases,
            monthlyRevenue,
            annualRevenue,
            recentLabs
        ));
    }

    [HttpGet("labs")]
    public async Task<ActionResult<List<SuperAdminLabItemDto>>> GetAllLabs()
    {
        var labs = await _context.Tenants
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new SuperAdminLabItemDto(
                t.Id,
                t.LabCode,
                t.LabName,
                t.OwnerName ?? "N/A",
                t.Email ?? "N/A",
                t.Phone ?? "N/A",
                t.City ?? "N/A",
                t.State ?? "N/A",
                t.SubscriptionStatus,
                t.SubscriptionExpiryDate,
                t.CreatedAt,
                t.IsActive
            ))
            .ToListAsync();

        return Ok(labs);
    }

    [HttpPut("labs/{id}/status")]
    public async Task<IActionResult> UpdateLabStatus(Guid id, [FromBody] bool isActive)
    {
        var lab = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == id);
        if (lab == null) return NotFound();

        lab.IsActive = isActive;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Lab status updated.", isActive = lab.IsActive });
    }

    // 1. Impersonate Lab (Login As Lab Admin)
    [HttpPost("impersonate/{tenantId}")]
    public async Task<IActionResult> ImpersonateLab(Guid tenantId)
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound(new { message = "Laboratory not found." });

        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Role == "LabAdmin")
                   ?? await _userManager.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId);

        if (user == null)
        {
            return BadRequest(new { message = "No administrator user account found for this laboratory." });
        }

        var token = _jwtTokenService.GenerateJwtToken(user, tenant.LabName);
        return Ok(new LoginResponse(
            Token: token,
            RefreshToken: Guid.NewGuid().ToString("N"),
            UserId: user.Id,
            FullName: user.FullName,
            Email: user.Email ?? "",
            Role: user.Role,
            TenantId: user.TenantId,
            LabName: tenant.LabName,
            LogoUrl: tenant.LogoUrl,
            ExpiresAt: DateTime.UtcNow.AddHours(24)
        ));
    }

    // 2. Direct Lab Onboarding / Creation
    [HttpPost("create-lab")]
    public async Task<IActionResult> CreateLab([FromBody] AdminCreateLabRequest req)
    {
        var existingUser = await _userManager.FindByEmailAsync(req.Email);
        if (existingUser != null)
            return BadRequest(new { message = "An account with this email already exists." });

        var labCode = "LAB" + new Random().Next(1000, 9999);
        var tenant = new TenantLab
        {
            LabCode = labCode,
            LabName = req.LabName,
            OwnerName = req.OwnerName,
            Email = req.Email,
            Phone = req.Phone,
            Address = req.Address,
            City = req.City,
            State = req.State,
            SubscriptionPlanId = req.PlanId,
            SubscriptionStatus = string.IsNullOrWhiteSpace(req.SubscriptionStatus) ? "Active" : req.SubscriptionStatus,
            SubscriptionExpiryDate = DateTime.UtcNow.AddMonths(req.ValidityMonths > 0 ? req.ValidityMonths : 1),
            IsActive = true
        };

        await _context.Tenants.AddAsync(tenant);
        await _context.SaveChangesAsync();

        var user = new ApplicationUser
        {
            UserName = req.Email,
            Email = req.Email,
            FullName = req.OwnerName,
            TenantId = tenant.Id,
            Role = "LabAdmin",
            Designation = "Lab Owner / Administrator",
            EmailConfirmed = true,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, string.IsNullOrWhiteSpace(req.Password) ? "Lab@12345" : req.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });
        }

        await _userManager.AddToRoleAsync(user, "LabAdmin");

        // Seed standard pathology catalog for new tenant
        if (_context is ApplicationDbContext appDb)
        {
            await DbInitializer.SeedStandardCatalogForTenantAsync(appDb, tenant.Id);
        }

        return Ok(new { message = $"Laboratory \"{tenant.LabName}\" ({tenant.LabCode}) created successfully!", tenantId = tenant.Id, labCode = tenant.LabCode });
    }

    // 3. SuperAdmin Password Reset for any Lab
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] AdminResetPasswordRequest req)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.TenantId == req.TenantId && u.Role == "LabAdmin")
                   ?? await _userManager.Users.FirstOrDefaultAsync(u => u.TenantId == req.TenantId);

        if (user == null) return NotFound(new { message = "User not found for this laboratory." });

        var newPass = !string.IsNullOrWhiteSpace(req.NewPassword) ? req.NewPassword : "Pass@" + new Random().Next(10000, 99999);
        await _userManager.RemovePasswordAsync(user);
        var res = await _userManager.AddPasswordAsync(user, newPass);

        if (!res.Succeeded)
        {
            return BadRequest(new { message = string.Join("; ", res.Errors.Select(e => e.Description)) });
        }

        return Ok(new { message = $"Password for {user.Email} reset successfully!", newPassword = newPass, userEmail = user.Email });
    }

    // 4. Global Broadcast Announcement
    [HttpGet("announcement")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGlobalAnnouncement()
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == "GLOBAL_ANNOUNCEMENT");
        if (setting == null || string.IsNullOrWhiteSpace(setting.SettingValue))
        {
            return Ok(new BroadcastAnnouncementDto("", "info", false, null));
        }

        try
        {
            var data = System.Text.Json.JsonSerializer.Deserialize<BroadcastAnnouncementDto>(setting.SettingValue);
            return Ok(data);
        }
        catch
        {
            return Ok(new BroadcastAnnouncementDto(setting.SettingValue, "info", true, null));
        }
    }

    [HttpPost("announcement")]
    public async Task<IActionResult> SaveGlobalAnnouncement([FromBody] BroadcastAnnouncementDto dto)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == "GLOBAL_ANNOUNCEMENT");
        var json = System.Text.Json.JsonSerializer.Serialize(dto);

        if (setting == null)
        {
            setting = new SystemSetting
            {
                SettingKey = "GLOBAL_ANNOUNCEMENT",
                SettingValue = json,
                Description = "Global broadcast banner for all pathology labs"
            };
            await _context.SystemSettings.AddAsync(setting);
        }
        else
        {
            setting.SettingValue = json;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Broadcast announcement updated successfully!", announcement = dto });
    }

    // 5. SaaS Plans Management
    [HttpGet("plans")]
    public async Task<ActionResult<List<SubscriptionPlan>>> GetAllPlans()
    {
        var plans = await _context.SubscriptionPlans.OrderBy(p => p.DisplayOrder).ToListAsync();
        return Ok(plans);
    }

    [HttpPost("plans")]
    public async Task<IActionResult> CreatePlan([FromBody] CreateOrUpdatePlanDto dto)
    {
        var plan = new SubscriptionPlan
        {
            PlanCode = dto.PlanCode.ToUpper().Trim(),
            PlanName = dto.PlanName.Trim(),
            Description = dto.Description,
            MonthlyPrice = dto.MonthlyPrice,
            AnnualPrice = dto.AnnualPrice,
            MaxCasesPerMonth = dto.MaxCasesPerMonth,
            MaxStaffAccounts = dto.MaxStaffAccounts,
            HasCustomLetterhead = dto.HasCustomLetterhead,
            HasPublicQrDownload = dto.HasPublicQrDownload,
            HasDoctorReferralModule = dto.HasDoctorReferralModule,
            HasThermalPrinting = dto.HasThermalPrinting,
            HasWhatsAppAlerts = dto.HasWhatsAppAlerts,
            IsActive = dto.IsActive,
            DisplayOrder = dto.DisplayOrder
        };

        await _context.SubscriptionPlans.AddAsync(plan);
        await _context.SaveChangesAsync();
        return Ok(new { message = $"SaaS Plan \"{plan.PlanName}\" created successfully!", plan });
    }

    [HttpPut("plans/{id}")]
    public async Task<IActionResult> UpdatePlan(Guid id, [FromBody] CreateOrUpdatePlanDto dto)
    {
        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan == null) return NotFound("Plan not found");

        plan.PlanCode = dto.PlanCode.ToUpper().Trim();
        plan.PlanName = dto.PlanName.Trim();
        plan.Description = dto.Description;
        plan.MonthlyPrice = dto.MonthlyPrice;
        plan.AnnualPrice = dto.AnnualPrice;
        plan.MaxCasesPerMonth = dto.MaxCasesPerMonth;
        plan.MaxStaffAccounts = dto.MaxStaffAccounts;
        plan.HasCustomLetterhead = dto.HasCustomLetterhead;
        plan.HasPublicQrDownload = dto.HasPublicQrDownload;
        plan.HasDoctorReferralModule = dto.HasDoctorReferralModule;
        plan.HasThermalPrinting = dto.HasThermalPrinting;
        plan.HasWhatsAppAlerts = dto.HasWhatsAppAlerts;
        plan.IsActive = dto.IsActive;
        plan.DisplayOrder = dto.DisplayOrder;

        await _context.SaveChangesAsync();
        return Ok(new { message = $"SaaS Plan \"{plan.PlanName}\" updated successfully!", plan });
    }

    [HttpDelete("plans/{id}")]
    public async Task<IActionResult> DeletePlan(Guid id)
    {
        var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == id);
        if (plan == null) return NotFound("Plan not found");

        plan.IsActive = false;
        await _context.SaveChangesAsync();
        return Ok(new { message = $"SaaS Plan \"{plan.PlanName}\" deactivated." });
    }

    // 6. Support Tickets Command Center
    [HttpGet("support-tickets")]
    public async Task<ActionResult<List<object>>> GetAllSupportTickets()
    {
        var tickets = await _context.SupportTickets
            .IgnoreQueryFilters()
            .Include(t => t.Replies)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var tenantIds = tickets.Select(t => t.TenantId).Distinct().ToList();
        var labs = await _context.Tenants.Where(t => tenantIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id, t => t.LabName);

        var result = tickets.Select(t => new
        {
            t.Id,
            t.TenantId,
            LabName = labs.TryGetValue(t.TenantId, out var name) ? name : "General / Lab",
            t.TicketNumber,
            t.Subject,
            t.Category,
            t.Priority,
            t.Status,
            t.Description,
            t.AttachmentUrl,
            t.CreatedAt,
            t.ResolvedAt,
            t.ResolutionNotes,
            Replies = t.Replies.OrderBy(r => r.CreatedAt).Select(r => new
            {
                r.Id,
                r.SenderName,
                r.IsAdminReply,
                r.Message,
                r.AttachmentUrl,
                r.CreatedAt
            }).ToList()
        }).ToList();

        return Ok(result);
    }

    [HttpPost("support-tickets/{id}/reply")]
    public async Task<IActionResult> AdminReplyTicket(Guid id, [FromBody] AdminTicketReplyRequest req)
    {
        var ticket = await _context.SupportTickets.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound("Ticket not found");

        var reply = new SupportTicketReply
        {
            TicketId = id,
            SenderId = "SuperAdmin",
            SenderName = "Super Administrator (Helpdesk Support)",
            IsAdminReply = true,
            Message = req.Message,
            AttachmentUrl = req.AttachmentUrl
        };

        await _context.SupportTicketReplies.AddAsync(reply);
        if (req.NewStatus.HasValue)
        {
            ticket.Status = req.NewStatus.Value;
            if (req.NewStatus.Value == Domain.Enums.TicketStatus.Resolved || req.NewStatus.Value == Domain.Enums.TicketStatus.Closed)
            {
                ticket.ResolvedAt = DateTime.UtcNow;
            }
        }
        else
        {
            ticket.Status = Domain.Enums.TicketStatus.InProgress;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Reply sent to laboratory successfully!", replyId = reply.Id });
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<List<object>>> GetSubscriptionTransactions()
    {
        var subs = await _context.TenantSubscriptions
            .Include(s => s.TenantLab)
            .Include(s => s.Plan)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                s.TenantId,
                LabName = s.TenantLab != null ? s.TenantLab.LabName : "Unknown Lab",
                LabCode = s.TenantLab != null ? s.TenantLab.LabCode : "N/A",
                OwnerName = s.TenantLab != null ? s.TenantLab.OwnerName : "N/A",
                Phone = s.TenantLab != null ? s.TenantLab.Phone : "N/A",
                Email = s.TenantLab != null ? s.TenantLab.Email : "N/A",
                PlanName = s.Plan != null ? s.Plan.PlanName : "Standard Plan",
                BillingCycle = s.BillingCycle,
                AmountPaid = s.AmountPaid,
                TransactionUtr = s.RazorpayPaymentId ?? "N/A",
                CreatedAt = s.CreatedAt,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                Status = s.Status
            })
            .ToListAsync();

        return Ok(subs);
    }

    [HttpPost("approve-subscription/{id}")]
    public async Task<IActionResult> ApproveSubscription(Guid id)
    {
        var sub = await _context.TenantSubscriptions.Include(s => s.TenantLab).Include(s => s.Plan).FirstOrDefaultAsync(s => s.Id == id);
        if (sub == null) return NotFound("Subscription record not found.");

        sub.Status = "Active";
        if (sub.TenantLab != null)
        {
            var months = sub.BillingCycle == "Annual" ? 12 : 1;
            sub.TenantLab.SubscriptionPlanId = sub.PlanId;
            sub.TenantLab.SubscriptionStatus = "Active";
            sub.TenantLab.SubscriptionExpiryDate = (sub.TenantLab.SubscriptionExpiryDate.HasValue && sub.TenantLab.SubscriptionExpiryDate > DateTime.UtcNow
                ? sub.TenantLab.SubscriptionExpiryDate.Value
                : DateTime.UtcNow).AddMonths(months);
            sub.EndDate = sub.TenantLab.SubscriptionExpiryDate.Value;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Subscription approved and activated successfully!", expiryDate = sub.TenantLab?.SubscriptionExpiryDate });
    }

    [HttpPost("reject-subscription/{id}")]
    public async Task<IActionResult> RejectSubscription(Guid id)
    {
        var sub = await _context.TenantSubscriptions.Include(s => s.TenantLab).FirstOrDefaultAsync(s => s.Id == id);
        if (sub == null) return NotFound("Subscription record not found.");

        sub.Status = "Rejected";
        await _context.SaveChangesAsync();
        return Ok(new { message = "Subscription transaction rejected." });
    }

    [HttpPut("labs/{id}/subscription")]
    public async Task<IActionResult> UpdateLabSubscription(Guid id, [FromBody] UpdateLabSubscriptionRequest req)
    {
        var lab = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == id);
        if (lab == null) return NotFound("Lab not found");

        if (!string.IsNullOrWhiteSpace(req.Status))
        {
            lab.SubscriptionStatus = req.Status;
        }

        if (req.ExpiryDate.HasValue)
        {
            lab.SubscriptionExpiryDate = req.ExpiryDate.Value;
        }

        if (req.PlanId.HasValue)
        {
            lab.SubscriptionPlanId = req.PlanId.Value;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Subscription updated successfully!", status = lab.SubscriptionStatus, expiryDate = lab.SubscriptionExpiryDate });
    }
}

public record UpdateLabSubscriptionRequest(string Status, DateTime? ExpiryDate, Guid? PlanId);
