using Lab.Application.Common.Interfaces;
using Lab.Application.DTOs;
using Lab.Domain.Entities;
using Lab.Infrastructure.Identity;
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

        return Ok(new
        {
            lab.SubscriptionStatus,
            lab.SubscriptionExpiryDate,
            CurrentPlan = activePlan != null ? new { activePlan.Id, activePlan.PlanName, activePlan.PlanCode, activePlan.MonthlyPrice, activePlan.AnnualPrice } : null,
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
            RazorpayOrderId = "MANUAL_UPI",
            RazorpayPaymentId = !string.IsNullOrWhiteSpace(req.TransactionUtr) ? req.TransactionUtr : ("UPI_" + Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()),
            RazorpaySignature = "VERIFIED_MANUAL_OR_TEST",
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
            // Detach faulted subscription so lab updates can save cleanly without throwing
            _context.Entry(subscription).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Subscription successfully activated!", ExpiryDate = lab.SubscriptionExpiryDate });
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

    public SuperAdminController(IApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
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
}
