using System.Globalization;
using Lab.Application.Common.Interfaces;
using Lab.Application.DTOs;
using Lab.Domain.Entities;
using Lab.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvestigationsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public InvestigationsController(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet("{caseOrderId}")]
    public async Task<ActionResult<object>> GetCaseInvestigationDetails(Guid caseOrderId)
    {
        var caseOrder = await _context.CaseOrders
            .Include(c => c.Patient)
            .Include(c => c.ReferringDoctor)
            .FirstOrDefaultAsync(c => c.Id == caseOrderId);

        if (caseOrder == null) return NotFound();

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
            Patient = new
            {
                caseOrder.Patient.Id,
                caseOrder.Patient.FullName,
                caseOrder.Patient.Uhid,
                caseOrder.Patient.Gender,
                caseOrder.Patient.AgeYears,
                caseOrder.Patient.AgeMonths,
                caseOrder.Patient.AgeDays,
                caseOrder.Patient.BloodGroup
            },
            DoctorName = caseOrder.ReferringDoctor?.DoctorName ?? "Direct",
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

        if (caseOrder.Status == CaseStatus.Approved)
        {
            return BadRequest(new { message = "This diagnostic report is already approved and locked. Results cannot be modified without unlocking the report." });
        }

        // Validate that at least one parameter value has been entered
        var totalValuesEntered = dto.Items?
            .SelectMany(i => i.Results ?? new List<SaveResultValueDto>())
            .Count(r => !string.IsNullOrWhiteSpace(r.ResultValue)) ?? 0;

        if (totalValuesEntered == 0)
        {
            return BadRequest(new { message = "Cannot save empty results. Please enter at least one test parameter value." });
        }

        var itemsList = await _context.CaseOrderItems
            .Include(i => i.Results).ThenInclude(r => r.Parameter)
            .Where(i => i.CaseOrderId == dto.CaseOrderId)
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

        foreach (var itemDto in dto.Items)
        {
            var item = caseOrder.Items.FirstOrDefault(i => i.Id == itemDto.CaseOrderItemId);
            if (item == null) continue;

            item.PathologistRemarks = itemDto.PathologistRemarks;
            item.InterpretationNote = itemDto.InterpretationNote;

            foreach (var resDto in itemDto.Results)
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

            // Update item status based on item parameter completion
            int itemTotalParams = item.Results.Count;
            int itemFilledParams = item.Results.Count(r => !string.IsNullOrWhiteSpace(r.ResultValue));
            if (itemTotalParams > 0 && itemFilledParams == itemTotalParams)
            {
                item.Status = ItemResultStatus.Completed;
            }
            else if (itemFilledParams > 0)
            {
                item.Status = ItemResultStatus.InProgress;
            }
            else
            {
                item.Status = ItemResultStatus.Pending;
            }
        }

        // Smart status progression for overall CaseOrder
        var allCaseParams = caseOrder.Items.SelectMany(i => i.Results).ToList();
        var allFilledParams = allCaseParams.Count(r => !string.IsNullOrWhiteSpace(r.ResultValue));

        if (allCaseParams.Count > 0 && allFilledParams == allCaseParams.Count)
        {
            caseOrder.Status = CaseStatus.Completed;
        }
        else
        {
            caseOrder.Status = CaseStatus.InProgress;
        }

        await _context.SaveChangesAsync();
        return Ok(new { 
            message = caseOrder.Status == CaseStatus.Completed 
                ? "All investigation results saved successfully. Ready for verification." 
                : "Investigation results saved (Status: In Progress)." 
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

        caseOrder.Status = CaseStatus.Approved;
        caseOrder.ApprovedByName = _currentUserService.FullName ?? "Dr. Ananya Sen, MD";
        caseOrder.ApprovedByUserId = _currentUserService.UserId;
        caseOrder.ApprovedAt = DateTime.UtcNow;

        foreach (var item in caseOrder.Items)
        {
            item.Status = ItemResultStatus.Approved;
            item.VerifiedByName = caseOrder.ApprovedByName;
            item.VerifiedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Report verified and approved successfully.", ApprovedByName = caseOrder.ApprovedByName, ApprovedAt = caseOrder.ApprovedAt });
    }

    [HttpPost("{caseOrderId}/unlock")]
    public async Task<IActionResult> UnlockReport(Guid caseOrderId)
    {
        var caseOrder = await _context.CaseOrders
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == caseOrderId);

        if (caseOrder == null) return NotFound(new { message = "Case order not found." });

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
        return Ok(new { message = "Report unlocked successfully. Results can now be edited and re-verified." });
    }
}
