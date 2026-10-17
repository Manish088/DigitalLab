using System.Globalization;
using Lab.Api.Hubs;
using Lab.Application.Common.Interfaces;
using Lab.Application.DTOs;
using Lab.Domain.Entities;
using Lab.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Lab.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvestigationsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMemoryCache _cache;
    private readonly IHubContext<LabRealtimeHub> _hubContext;

    public InvestigationsController(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMemoryCache cache,
        IHubContext<LabRealtimeHub> hubContext)
    {
        _context = context;
        _currentUserService = currentUserService;
        _cache = cache;
        _hubContext = hubContext;
    }

    [HttpGet("{caseOrderId}")]
    public async Task<ActionResult<object>> GetCaseInvestigationDetails(Guid caseOrderId)
    {
        var caseOrder = await _context.CaseOrders
            .Include(c => c.Patient)
            .Include(c => c.ReferringDoctor)
            .FirstOrDefaultAsync(c => c.Id == caseOrderId);

        if (caseOrder == null) return NotFound();

        if (caseOrder.PublicAccessToken == Guid.Empty)
        {
            caseOrder.PublicAccessToken = Guid.NewGuid();
            await _context.SaveChangesAsync();
        }

        var itemsList = await _context.CaseOrderItems
            .Include(i => i.Test).ThenInclude(t => t.Category)
            .Include(i => i.Results).ThenInclude(r => r.Parameter)
            .Where(i => i.CaseOrderId == caseOrderId)
            .ToListAsync();

        caseOrder.Items = itemsList;

        var patientAgeDays = caseOrder.Patient.AgeYears * 365 + caseOrder.Patient.AgeMonths * 30 + caseOrder.Patient.AgeDays;

        var paramIds = caseOrder.Items
            .SelectMany(i => i.Results)
            .Select(r => r.ParameterId)
            .Distinct()
            .ToList();

        var normalRangesList = await _context.ParameterNormalRanges
            .Where(nr => paramIds.Contains(nr.ParameterId))
            .ToListAsync();

        var normalRangesLookup = normalRangesList.ToLookup(nr => nr.ParameterId);

        var items = caseOrder.Items.Select(item => new
        {
            item.Id,
            item.TestId,
            TestCode = item.Test?.TestCode ?? "TEST",
            TestName = item.Test?.TestName ?? "Investigation",
            CategoryName = item.Test?.Category?.CategoryName ?? "General",
            SampleType = item.Test?.SampleType ?? "Whole Blood",
            ContainerVialType = item.Test?.ContainerVialType ?? "EDTA Tube",
            Methodology = item.Test?.Methodology ?? "Standard Laboratory Analysis",
            InterpretationTemplate = item.Test?.InterpretationTemplate,
            Status = item.Status.ToString(),
            item.PathologistRemarks,
            item.InterpretationNote,
            Parameters = item.Results.OrderBy(r => r.DisplayOrder).Select(res =>
            {
                var ranges = normalRangesLookup[res.ParameterId];
                var matchedRange = ranges.FirstOrDefault(nr =>
                    (nr.ApplicableGender == Gender.Both || nr.ApplicableGender == caseOrder.Patient.Gender) &&
                    patientAgeDays >= nr.MinAgeDays &&
                    patientAgeDays <= nr.MaxAgeDays);

                var normalRangeDisplay = !string.IsNullOrWhiteSpace(res.NormalRangeText)
                    ? res.NormalRangeText
                    : (!string.IsNullOrWhiteSpace(matchedRange?.TextualRange)
                        ? matchedRange.TextualRange
                        : (matchedRange != null && matchedRange.MinNormalValue.HasValue && matchedRange.MaxNormalValue.HasValue
                            ? $"{matchedRange.MinNormalValue} - {matchedRange.MaxNormalValue} {res.Unit}"
                            : "N/A"));

                return new
                {
                    res.Id,
                    res.ParameterId,
                    ParameterName = res.ParameterName ?? res.Parameter?.ParameterName ?? "Parameter",
                    Unit = res.Unit ?? res.Parameter?.Unit ?? "",
                    InputType = res.Parameter != null ? res.Parameter.InputType.ToString() : "Numeric",
                    OptionsJson = res.Parameter?.OptionsJson,
                    FormulaExpression = res.Parameter?.FormulaExpression,
                    res.ResultValue,
                    NormalRangeText = normalRangeDisplay,
                    MinNormalValue = matchedRange?.MinNormalValue,
                    MaxNormalValue = matchedRange?.MaxNormalValue,
                    PanicLowValue = matchedRange?.PanicLowValue,
                    PanicHighValue = matchedRange?.PanicHighValue,
                    Flag = res.Flag.ToString(),
                    res.IsAbnormal,
                    res.IsCriticalPanic,
                    res.Remarks,
                    res.DisplayOrder
                };
            }).ToList()
        }).ToList();

        return Ok(new
        {
            caseOrder.Id,
            caseOrder.CaseNumber,
            caseOrder.Barcode,
            caseOrder.PublicAccessToken,
            Patient = new
            {
                caseOrder.Patient.Id,
                caseOrder.Patient.FullName,
                caseOrder.Patient.Uhid,
                caseOrder.Patient.Gender,
                caseOrder.Patient.AgeYears,
                caseOrder.Patient.AgeMonths,
                caseOrder.Patient.AgeDays,
                caseOrder.Patient.BloodGroup,
                caseOrder.Patient.Phone
            },
            PatientName = caseOrder.Patient.FullName,
            PatientPhone = caseOrder.Patient.Phone,
            DoctorName = caseOrder.ReferringDoctor?.DoctorName ?? "Direct",
            DoctorPhone = caseOrder.ReferringDoctor?.Phone,
            ReferringDoctorId = caseOrder.ReferringDoctorId,
            caseOrder.OrderDate,
            Status = caseOrder.Status.ToString(),
            caseOrder.ApprovedByName,
            caseOrder.ApprovedAt,
            Items = items
        });
    }

    [HttpPost("save-results")]
    public async Task<IActionResult> SaveResults([FromBody] SaveCaseResultsDto dto)
    {
        var caseOrder = await _context.CaseOrders
            .Include(c => c.Patient)
            .FirstOrDefaultAsync(c => c.Id == dto.CaseOrderId);

        if (caseOrder == null) return NotFound(new { message = "Case order not found." });

        var isSuperAdmin = _currentUserService.IsSuperAdmin || User.IsInRole("SuperAdmin");
        var labTenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == caseOrder.TenantId);
        var isExpired = !isSuperAdmin && labTenant != null && (labTenant.SubscriptionStatus == "Expired" || labTenant.SubscriptionStatus == "Suspended" || (labTenant.SubscriptionExpiryDate.HasValue && labTenant.SubscriptionExpiryDate.Value < DateTime.UtcNow));
        if (isExpired)
        {
            return StatusCode(403, new { message = "Laboratory subscription has expired. Please renew your plan to enter diagnostic test results." });
        }

        if (caseOrder.Status == CaseStatus.Approved)
        {
            return BadRequest(new { message = "This diagnostic report is already approved and locked. Results cannot be modified without unlocking the report." });
        }

        var itemsList = await _context.CaseOrderItems
            .Include(i => i.Test)
            .Include(i => i.Results).ThenInclude(r => r.Parameter)
            .Where(i => i.CaseOrderId == dto.CaseOrderId)
            .ToListAsync();

        caseOrder.Items = itemsList;

        // Strictly validate that ALL parameters across all tests are filled
        var missingTests = new List<string>();
        foreach (var item in caseOrder.Items)
        {
            var itemDto = dto.Items?.FirstOrDefault(i => i.CaseOrderItemId == item.Id);
            var missingCount = item.Results.Count(r => {
                var resDto = itemDto?.Results?.FirstOrDefault(rd => rd.ParameterId == r.ParameterId);
                return string.IsNullOrWhiteSpace(resDto?.ResultValue);
            });

            if (missingCount > 0 || !item.Results.Any())
            {
                var testName = item.Test?.TestName ?? "Test";
                missingTests.Add($"{testName} ({missingCount} parameter(s) empty)");
            }
        }

        if (missingTests.Any())
        {
            return BadRequest(new { 
                message = $"All parameter values are required before saving. Missing in: {string.Join(", ", missingTests)}. Please fill all parameters." 
            });
        }

        var patientAgeDays = caseOrder.Patient.AgeYears * 365 + caseOrder.Patient.AgeMonths * 30 + caseOrder.Patient.AgeDays;

        var paramIds = caseOrder.Items
            .SelectMany(i => i.Results)
            .Select(r => r.ParameterId)
            .Distinct()
            .ToList();

        var normalRangesList = await _context.ParameterNormalRanges
            .Where(nr => paramIds.Contains(nr.ParameterId))
            .ToListAsync();

        var normalRangesLookup = normalRangesList.ToLookup(nr => nr.ParameterId);

        foreach (var itemDto in dto.Items ?? new List<SaveItemResultDto>())
        {
            var item = caseOrder.Items.FirstOrDefault(i => i.Id == itemDto.CaseOrderItemId);
            if (item == null) continue;

            item.PathologistRemarks = itemDto.PathologistRemarks;
            item.InterpretationNote = itemDto.InterpretationNote;
            item.Status = ItemResultStatus.Completed;

            foreach (var resDto in itemDto.Results ?? new List<SaveResultValueDto>())
            {
                var res = item.Results.FirstOrDefault(r => r.ParameterId == resDto.ParameterId);
                if (res == null) continue;

                res.ResultValue = resDto.ResultValue?.Trim();
                res.Remarks = resDto.Remarks;

                // Auto match range & determine Flag (Normal, High, Low, Critical)
                var ranges = normalRangesLookup[res.ParameterId];
                var matchedRange = ranges.FirstOrDefault(nr =>
                    (nr.ApplicableGender == Gender.Both || nr.ApplicableGender == caseOrder.Patient.Gender) &&
                    patientAgeDays >= nr.MinAgeDays &&
                    patientAgeDays <= nr.MaxAgeDays);

                var rangeText = matchedRange?.TextualRange ??
                    (matchedRange?.MinNormalValue.HasValue == true && matchedRange?.MaxNormalValue.HasValue == true
                        ? $"{matchedRange.MinNormalValue} - {matchedRange.MaxNormalValue} {res.Unit}"
                        : null);

                if (!string.IsNullOrWhiteSpace(rangeText))
                {
                    res.NormalRangeText = rangeText;
                }

                if (decimal.TryParse(res.ResultValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var numVal))
                {
                    res.NumericValue = numVal;

                    if (matchedRange != null)
                    {
                        if (matchedRange.PanicLowValue.HasValue && numVal <= matchedRange.PanicLowValue.Value)
                        {
                            res.Flag = ResultFlag.Critical;
                            res.IsCriticalPanic = true;
                            res.IsAbnormal = true;
                        }
                        else if (matchedRange.PanicHighValue.HasValue && numVal >= matchedRange.PanicHighValue.Value)
                        {
                            res.Flag = ResultFlag.Critical;
                            res.IsCriticalPanic = true;
                            res.IsAbnormal = true;
                        }
                        else if (matchedRange.MinNormalValue.HasValue && numVal < matchedRange.MinNormalValue.Value)
                        {
                            res.Flag = ResultFlag.Low;
                            res.IsAbnormal = true;
                            res.IsCriticalPanic = false;
                        }
                        else if (matchedRange.MaxNormalValue.HasValue && numVal > matchedRange.MaxNormalValue.Value)
                        {
                            res.Flag = ResultFlag.High;
                            res.IsAbnormal = true;
                            res.IsCriticalPanic = false;
                        }
                        else
                        {
                            res.Flag = ResultFlag.Normal;
                            res.IsAbnormal = false;
                            res.IsCriticalPanic = false;
                        }
                    }
                }
                else
                {
                    res.NumericValue = null;
                    res.Flag = ResultFlag.Normal;
                    res.IsAbnormal = false;
                }
            }
        }

        caseOrder.Status = CaseStatus.Completed;

        await _context.SaveChangesAsync();
        EvictReportCache(caseOrder.Id, caseOrder.PublicAccessToken);

        // SignalR Real-Time Broadcast
        try
        {
            var criticalResults = caseOrder.Items
                .SelectMany(i => i.Results)
                .Where(r => r.IsCriticalPanic)
                .Select(r => new { r.ParameterName, r.ResultValue, r.Unit, r.NormalRangeText })
                .ToList();

            if (criticalResults.Any())
            {
                await _hubContext.Clients.Group($"Tenant_{caseOrder.TenantId}").SendAsync("CriticalPanicAlert", new
                {
                    caseId = caseOrder.Id,
                    caseNumber = caseOrder.CaseNumber,
                    patientName = caseOrder.Patient?.FullName ?? "Patient",
                    criticalCount = criticalResults.Count,
                    parameters = criticalResults,
                    alertTime = DateTime.UtcNow
                });
            }

            await _hubContext.Clients.Group($"Tenant_{caseOrder.TenantId}").SendAsync("CaseStatusChanged", new
            {
                caseId = caseOrder.Id,
                caseNumber = caseOrder.CaseNumber,
                status = caseOrder.Status.ToString(),
                patientName = caseOrder.Patient?.FullName ?? "Patient",
                hasCriticalPanic = criticalResults.Any()
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SignalR Broadcast Error] {ex.Message}");
        }

        return Ok(new { 
            message = "All investigation results saved successfully. Ready for verification." 
        });
    }

    [HttpPost("{caseOrderId}/approve")]
    public async Task<IActionResult> ApproveReport(Guid caseOrderId)
    {
        var caseOrder = await _context.CaseOrders
            .Include(c => c.Items).ThenInclude(i => i.Results).ThenInclude(r => r.Parameter)
            .Include(c => c.Items).ThenInclude(i => i.Test)
            .FirstOrDefaultAsync(c => c.Id == caseOrderId);

        if (caseOrder == null) return NotFound(new { message = "Case order not found." });

        var isSuperAdmin = _currentUserService.IsSuperAdmin || User.IsInRole("SuperAdmin");
        var labTenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == caseOrder.TenantId);
        var isExpired = !isSuperAdmin && labTenant != null && (labTenant.SubscriptionStatus == "Expired" || labTenant.SubscriptionStatus == "Suspended" || (labTenant.SubscriptionExpiryDate.HasValue && labTenant.SubscriptionExpiryDate.Value < DateTime.UtcNow));
        if (isExpired)
        {
            return StatusCode(403, new { message = "Laboratory subscription has expired. Please renew your plan to approve diagnostic reports." });
        }

        if (!caseOrder.Items.Any())
        {
            return BadRequest(new { message = "Cannot approve a case with no tests." });
        }

        // Validate that all test parameters have results entered
        var missingTests = new List<string>();
        foreach (var item in caseOrder.Items)
        {
            var missingCount = item.Results.Count(r => string.IsNullOrWhiteSpace(r.ResultValue));
            if (missingCount > 0 || !item.Results.Any())
            {
                var testTitle = item.Test?.TestName ?? "Test";
                missingTests.Add($"{testTitle} ({missingCount} parameter(s) empty)");
            }
        }

        if (missingTests.Any())
        {
            return BadRequest(new { 
                message = $"Cannot approve report: Results are missing for the following test(s):\n• " + string.Join("\n• ", missingTests) + "\nPlease enter all result values before approving." 
            });
        }

        var approverName = !string.IsNullOrWhiteSpace(_currentUserService.FullName)
            ? _currentUserService.FullName
            : (!string.IsNullOrWhiteSpace(labTenant?.PathologistName) 
                ? labTenant.PathologistName 
                : (!string.IsNullOrWhiteSpace(_currentUserService.Email) ? _currentUserService.Email : "Lab Administrator"));

        caseOrder.Status = CaseStatus.Approved;
        caseOrder.ApprovedByName = approverName;
        caseOrder.ApprovedByUserId = _currentUserService.UserId;
        caseOrder.ApprovedAt = DateTime.UtcNow;

        foreach (var item in caseOrder.Items)
        {
            item.Status = ItemResultStatus.Approved;
            item.VerifiedByName = caseOrder.ApprovedByName;
            item.VerifiedAt = DateTime.UtcNow;
        }

        if (caseOrder.PublicAccessToken == Guid.Empty)
        {
            caseOrder.PublicAccessToken = Guid.NewGuid();
        }

        await _context.SaveChangesAsync();
        EvictReportCache(caseOrderId, caseOrder.PublicAccessToken);

        try
        {
            await _hubContext.Clients.Group($"Tenant_{caseOrder.TenantId}").SendAsync("ReportApproved", new
            {
                caseId = caseOrder.Id,
                caseNumber = caseOrder.CaseNumber,
                status = caseOrder.Status.ToString(),
                approvedByName = caseOrder.ApprovedByName,
                approvedAt = caseOrder.ApprovedAt,
                publicAccessToken = caseOrder.PublicAccessToken
            });
        }
        catch {}

        return Ok(new 
        { 
            message = "Report verified and approved successfully.", 
            ApprovedByName = caseOrder.ApprovedByName, 
            ApprovedAt = caseOrder.ApprovedAt,
            PublicAccessToken = caseOrder.PublicAccessToken 
        });
    }

    [HttpPost("{caseOrderId}/unlock")]
    public async Task<IActionResult> UnlockReport(Guid caseOrderId)
    {
        var caseOrder = await _context.CaseOrders
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == caseOrderId);

        if (caseOrder == null) return NotFound(new { message = "Case order not found." });

        var isSuperAdmin = _currentUserService.IsSuperAdmin || User.IsInRole("SuperAdmin");
        var labTenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == caseOrder.TenantId);
        var isExpired = !isSuperAdmin && labTenant != null && (labTenant.SubscriptionStatus == "Expired" || labTenant.SubscriptionStatus == "Suspended" || (labTenant.SubscriptionExpiryDate.HasValue && labTenant.SubscriptionExpiryDate.Value < DateTime.UtcNow));
        if (isExpired)
        {
            return StatusCode(403, new { message = "Laboratory subscription has expired. Please renew your plan to modify or unlock diagnostic reports." });
        }

        if (caseOrder.Status != CaseStatus.Approved)
            return BadRequest(new { message = "Report is not currently in Approved status." });

        caseOrder.Status = CaseStatus.Completed;
        caseOrder.ApprovedByName = null;
        caseOrder.ApprovedByUserId = null;
        caseOrder.ApprovedAt = null;

        foreach (var item in caseOrder.Items)
        {
            item.Status = ItemResultStatus.Completed;
            item.VerifiedByName = null;
            item.VerifiedAt = null;
        }

        await _context.SaveChangesAsync();
        EvictReportCache(caseOrderId, caseOrder.PublicAccessToken);

        return Ok(new { message = "Report unlocked successfully. Results can now be edited and re-verified." });
    }

    private void EvictReportCache(Guid caseOrderId, Guid publicAccessToken)
    {
        try
        {
            _cache.Remove($"report_pdf_{caseOrderId}_true");
            _cache.Remove($"report_pdf_{caseOrderId}_false");
            _cache.Remove($"invoice_pdf_{caseOrderId}");
            _cache.Remove($"thermal_receipt_{caseOrderId}_80");
            _cache.Remove($"thermal_receipt_{caseOrderId}_58");
            if (publicAccessToken != Guid.Empty)
            {
                _cache.Remove($"public_report_pdf_{publicAccessToken}_true");
                _cache.Remove($"public_report_pdf_{publicAccessToken}_false");
            }
        }
        catch { /* Ignore cache eviction failure */ }
    }
}
