using Lab.Application.Common.Interfaces;
using Lab.Application.DTOs;
using Lab.Domain.Entities;
using Lab.Domain.Enums;
using Lab.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AgentsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public AgentsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<CollectionAgentDto>>> GetAgents()
    {
        var list = await _context.CollectionAgents
            .Include(a => a.CaseOrders)
            .OrderBy(a => a.AgentName)
            .Select(a => new CollectionAgentDto(
                a.Id,
                a.AgentCode,
                a.AgentName,
                a.CentreName,
                a.Phone,
                a.Email,
                a.Address,
                a.CommissionPercent,
                a.IsActive,
                a.CaseOrders.Count,
                a.CaseOrders.Sum(c => c.NetAmount)
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<CollectionAgentDto>> CreateAgent([FromBody] CreateCollectionAgentDto dto)
    {
        var agent = new CollectionAgent
        {
            AgentCode = dto.AgentCode,
            AgentName = dto.AgentName,
            CentreName = dto.CentreName,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            CommissionPercent = dto.CommissionPercent,
            IsActive = true
        };

        await _context.CollectionAgents.AddAsync(agent);
        await _context.SaveChangesAsync();

        return Ok(new CollectionAgentDto(agent.Id, agent.AgentCode, agent.AgentName, agent.CentreName, agent.Phone, agent.Email, agent.Address, agent.CommissionPercent, agent.IsActive, 0, 0));
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public TransactionsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetTransactions(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] PaymentMethod? paymentMethod)
    {
        var query = _context.PaymentTransactions
            .Include(t => t.CaseOrder).ThenInclude(c => c.Patient)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(t => t.TransactionDate >= fromDate.Value.Date);

        if (toDate.HasValue)
            query = query.Where(t => t.TransactionDate <= toDate.Value.Date.AddDays(1).AddTicks(-1));

        if (paymentMethod.HasValue)
            query = query.Where(t => t.PaymentMethod == paymentMethod.Value);

        var list = await query
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => new
            {
                t.Id,
                t.TransactionNumber,
                t.TransactionDate,
                t.Amount,
                PaymentMethod = t.PaymentMethod.ToString(),
                t.ReferenceNumber,
                t.ReceivedByName,
                t.Remarks,
                CaseNumber = t.CaseOrder.CaseNumber,
                PatientName = t.CaseOrder.Patient.FullName
            })
            .ToListAsync();

        var totalCollection = list.Sum(t => t.Amount);

        // Calculate Today's Day-End Counter Closing Breakdown
        var today = DateTime.UtcNow.Date;
        var todayTxns = await _context.PaymentTransactions
            .Where(t => t.TransactionDate >= today)
            .ToListAsync();

        var todayCases = await _context.CaseOrders
            .Where(c => c.OrderDate >= today)
            .ToListAsync();

        var todayCash = todayTxns.Where(t => t.PaymentMethod == PaymentMethod.Cash).Sum(t => t.Amount);
        var todayUpi = todayTxns.Where(t => t.PaymentMethod == PaymentMethod.UPI).Sum(t => t.Amount);
        var todayCard = todayTxns.Where(t => t.PaymentMethod == PaymentMethod.Card || t.PaymentMethod == PaymentMethod.NetBanking).Sum(t => t.Amount);
        var todayTotalCollection = todayTxns.Sum(t => t.Amount);
        var todayBilled = todayCases.Sum(c => c.NetAmount);
        var todayDiscount = todayCases.Sum(c => c.DiscountAmount);
        var todayDueCreated = todayCases.Sum(c => c.DueAmount);

        return Ok(new
        {
            totalCollection,
            count = list.Count,
            transactions = list,
            todayClosing = new
            {
                todayCash,
                todayUpi,
                todayCard,
                todayTotalCollection,
                todayBilled,
                todayDiscount,
                todayDueCreated,
                todayCasesCount = todayCases.Count
            }
        });
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LetterheadController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public LetterheadController(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<LetterheadConfigDto>> GetConfig()
    {
        var tenantId = _currentUserService.TenantId;
        var lab = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (lab == null) return NotFound();

        return Ok(new LetterheadConfigDto(
            lab.LabName,
            lab.Tagline,
            lab.OwnerName,
            lab.Phone,
            lab.Email,
            lab.Address,
            lab.City,
            lab.State,
            lab.Pincode,
            lab.Gstin,
            lab.NablNumber,
            lab.LogoUrl,
            lab.HeaderImageUrl,
            lab.FooterImageUrl,
            lab.DigitalSignatureUrl,
            lab.PathologistName,
            lab.PathologistDegree,
            lab.PathologistRegNo,
            lab.LetterheadMarginTopMm,
            lab.LetterheadMarginBottomMm,
            lab.LetterheadMarginLeftMm,
            lab.LetterheadMarginRightMm,
            lab.ShowHeader,
            lab.ShowFooter,
            lab.ShowQrCode,
            lab.ShowBarcodeOnBill,
            lab.ShowDigitalSignature,
            lab.ReportFontFamily,
            lab.PrimaryColor
        ));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateConfig([FromBody] LetterheadConfigDto dto)
    {
        var tenantId = _currentUserService.TenantId;
        var lab = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (lab == null) return NotFound();

        lab.LabName = dto.LabName;
        lab.Tagline = dto.Tagline;
        lab.OwnerName = dto.OwnerName;
        lab.Phone = dto.Phone;
        lab.Email = dto.Email;
        lab.Address = dto.Address;
        lab.City = dto.City;
        lab.State = dto.State;
        lab.Pincode = dto.Pincode;
        lab.Gstin = dto.Gstin;
        lab.NablNumber = dto.NablNumber;
        lab.LogoUrl = dto.LogoUrl;
        lab.HeaderImageUrl = dto.HeaderImageUrl;
        lab.FooterImageUrl = dto.FooterImageUrl;
        lab.DigitalSignatureUrl = dto.DigitalSignatureUrl;
        lab.PathologistName = dto.PathologistName;
        lab.PathologistDegree = dto.PathologistDegree;
        lab.PathologistRegNo = dto.PathologistRegNo;
        lab.LetterheadMarginTopMm = dto.LetterheadMarginTopMm;
        lab.LetterheadMarginBottomMm = dto.LetterheadMarginBottomMm;
        lab.LetterheadMarginLeftMm = dto.LetterheadMarginLeftMm;
        lab.LetterheadMarginRightMm = dto.LetterheadMarginRightMm;
        lab.ShowHeader = dto.ShowHeader;
        lab.ShowFooter = dto.ShowFooter;
        lab.ShowQrCode = dto.ShowQrCode;
        lab.ShowBarcodeOnBill = dto.ShowBarcodeOnBill;
        lab.ShowDigitalSignature = dto.ShowDigitalSignature;
        lab.ReportFontFamily = dto.ReportFontFamily;
        lab.PrimaryColor = dto.PrimaryColor;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Letterhead and branding settings updated." });
    }
}

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;

    public StaffController(UserManager<ApplicationUser> userManager, ICurrentUserService currentUserService)
    {
        _userManager = userManager;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<List<StaffUserDto>>> GetStaffList()
    {
        var tenantId = _currentUserService.TenantId;
        var list = await _userManager.Users
            .Where(u => u.TenantId == tenantId)
            .OrderBy(u => u.FullName)
            .Select(u => new StaffUserDto(
                u.Id,
                u.FullName,
                u.Email ?? "",
                u.PhoneNumber ?? "",
                u.Role,
                u.Designation,
                u.IsActive,
                u.PermissionsJson
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffUserRequest req)
    {
        var existing = await _userManager.FindByEmailAsync(req.Email);
        if (existing != null)
            return BadRequest(new { message = "Email already in use." });

        var user = new ApplicationUser
        {
            UserName = req.Email,
            Email = req.Email,
            FullName = req.FullName,
            PhoneNumber = req.PhoneNumber,
            TenantId = _currentUserService.TenantId,
            Role = req.Role,
            Designation = req.Designation,
            PermissionsJson = req.PermissionsJson,
            EmailConfirmed = true,
            IsActive = true
        };

        var res = await _userManager.CreateAsync(user, req.Password);
        if (!res.Succeeded)
            return BadRequest(new { message = string.Join("; ", res.Errors.Select(e => e.Description)) });

        await _userManager.AddToRoleAsync(user, req.Role);

        return Ok(new { message = "Staff member created successfully.", userId = user.Id });
    }

    [HttpPut("{id}/toggle-status")]
    public async Task<IActionResult> ToggleStaffStatus(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.TenantId != _currentUserService.TenantId)
            return NotFound();

        user.IsActive = !user.IsActive;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "Staff status toggled.", isActive = user.IsActive });
    }
}
