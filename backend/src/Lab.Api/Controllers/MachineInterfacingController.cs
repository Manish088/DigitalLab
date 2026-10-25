using System.Globalization;
using System.Security.Cryptography;
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

[ApiController]
[Route("api/machine-interfacing")]
public class MachineInterfacingController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMemoryCache _cache;
    private readonly IHubContext<LabRealtimeHub> _hubContext;
    private readonly ILogger<MachineInterfacingController> _logger;

    // Common standard analyzer parameter aliases across hematology & biochemistry analyzers
    private static readonly Dictionary<string, string[]> ParameterAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["HB"] = new[] { "HB", "HGB", "HEMO", "HEMOGLOBIN", "HB1" },
        ["TLC"] = new[] { "TLC", "WBC", "LEUKO", "LEUKOCYTES", "WHITE BLOOD CELLS", "WBC COUNT" },
        ["PLT"] = new[] { "PLT", "PLATELET", "PLATELETS", "PLATELET COUNT" },
        ["NEUT"] = new[] { "NEUT", "NEU", "NEU%", "NEUT%", "NEUTROPHILS", "NEUTROPHIL" },
        ["LYMPH"] = new[] { "LYMPH", "LYM", "LYM%", "LYMPH%", "LYMPHOCYTES", "LYMPHOCYTE" },
        ["MONO"] = new[] { "MONO", "MON", "MON%", "MONO%", "MONOCYTES", "MONOCYTE" },
        ["EOS"] = new[] { "EOS", "EOS%", "EOSINOPHILS", "EOSINOPHIL" },
        ["BASO"] = new[] { "BASO", "BAS", "BAS%", "BASOPHILS", "BASOPHIL" },
        ["PCV"] = new[] { "PCV", "HCT", "HEMATOCRIT" },
        ["RBC"] = new[] { "RBC", "ERYTHROCYTE", "RED BLOOD CELLS" },
        ["MCV"] = new[] { "MCV" },
        ["MCH"] = new[] { "MCH" },
        ["MCHC"] = new[] { "MCHC" },
        ["RDW"] = new[] { "RDW", "RDW-CV", "RDW-SD" },
        ["FBS"] = new[] { "FBS", "GLU", "GLUCOSE", "BSF", "FASTING BLOOD SUGAR" },
        ["PPBS"] = new[] { "PPBS", "BSPP", "POST PRANDIAL BLOOD SUGAR" },
        ["RBS"] = new[] { "RBS", "RANDOM BLOOD SUGAR" },
        ["CREAT"] = new[] { "CREAT", "CREATININE", "CREA" },
        ["UREA"] = new[] { "UREA", "BUN", "BLOOD UREA" },
        ["SGOT"] = new[] { "SGOT", "AST" },
        ["SGPT"] = new[] { "SGPT", "ALT" },
        ["BIL_T"] = new[] { "BIL_T", "TBIL", "TOTAL BILIRUBIN" }
    };

    public MachineInterfacingController(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IMemoryCache cache,
        IHubContext<LabRealtimeHub> hubContext,
        ILogger<MachineInterfacingController> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _cache = cache;
        _hubContext = hubContext;
        _logger = logger;
    }

    private IClientProxy GetTenantGroup(Guid tenantId)
    {
        return _hubContext.Clients.Group($"Tenant_{tenantId.ToString().ToLowerInvariant()}");
    }

    private void EvictReportCache(Guid caseOrderId, Guid publicAccessToken)
    {
        _cache.Remove($"pdf_report_{caseOrderId}_letterhead");
        _cache.Remove($"pdf_report_{caseOrderId}_plain");
        if (publicAccessToken != Guid.Empty)
        {
            _cache.Remove($"pdf_report_token_{publicAccessToken}_letterhead");
            _cache.Remove($"pdf_report_token_{publicAccessToken}_plain");
        }
    }

    /// <summary>
    /// Health & Status of the LIS Machine Interfacing Gateway
    /// </summary>
    [HttpGet("status")]
    public IActionResult GetGatewayStatus()
    {
        return Ok(new
        {
            service = "DigitLab LIS Machine Interfacing Gateway",
            status = "Online",
            supportedProtocols = new[] { "ASTM E1394-97", "ASTM E1381-02", "HL7 v2.3 / v2.5", "REST / JSON Socket" },
            supportedAnalyzers = new[]
            {
                "Mindray (BC-2800, BC-3000 Plus, BC-5000, BC-5150, BC-6000)",
                "Sysmex (XP-100, XP-300, XN-350, XN-550)",
                "Erba (H360, H560, Chem 5X, Chem 7)",
                "Horiba (Yumizen H500, ABX Micros 60)",
                "Beckman Coulter (DxH 500, ACT Diff)",
                "Transasia / Erba Mannheim",
                "Roche Cobas / Elecsys"
            },
            serverTime = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Authenticate and retrieve LIS connection parameters for a client's lab
    /// </summary>
    [HttpGet("config")]
    [Authorize]
    public async Task<ActionResult<LabMachineConfigDto>> GetLabConfig()
    {
        var tenantId = _currentUserService.TenantId;
        if (!tenantId.HasValue) return Unauthorized(new { message = "User does not belong to any tenant lab." });

        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        if (tenant == null) return NotFound(new { message = "Tenant lab not found." });

        // Auto-generate LisApiKey if not present
        if (string.IsNullOrWhiteSpace(tenant.LisApiKey))
        {
            tenant.LisApiKey = $"lis_{tenant.LabCode.ToLowerInvariant()}_{Convert.ToHexString(RandomNumberGenerator.GetBytes(12)).ToLowerInvariant()}";
            await _context.SaveChangesAsync();
        }

        var scheme = Request.Scheme;
        var host = Request.Host.Value;
        var syncUrl = $"{scheme}://{host}/api/machine-interfacing/sync";

        return Ok(new LabMachineConfigDto
        {
            TenantId = tenant.Id,
            LabCode = tenant.LabCode,
            LabName = tenant.LabName,
            LisApiKey = tenant.LisApiKey,
            SyncApiEndpoint = syncUrl,
            DefaultListeningPort = 5100
        });
    }

    /// <summary>
    /// Regenerate LIS API Key for security
    /// </summary>
    [HttpPost("regenerate-key")]
    [Authorize]
    public async Task<IActionResult> RegenerateApiKey()
    {
        var tenantId = _currentUserService.TenantId;
        if (!tenantId.HasValue) return Unauthorized();

        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        if (tenant == null) return NotFound();

        tenant.LisApiKey = $"lis_{tenant.LabCode.ToLowerInvariant()}_{Convert.ToHexString(RandomNumberGenerator.GetBytes(12)).ToLowerInvariant()}";
        await _context.SaveChangesAsync();

        return Ok(new { lisApiKey = tenant.LisApiKey });
    }

    /// <summary>
    /// Core Multi-Tenant Ingestion Endpoint: Receives test results from desktop LIS bridge / machines
    /// </summary>
    [HttpPost("sync")]
    public async Task<ActionResult<MachineSyncResponseDto>> SyncMachineResults([FromBody] MachineResultSyncRequest req)
    {
        if (req == null) return BadRequest(new { message = "Invalid request payload." });
        if (string.IsNullOrWhiteSpace(req.Barcode))
        {
            return BadRequest(new { message = "Sample Barcode or Case Number is required." });
        }

        // 1. Authenticate Tenant Lab
        var apiKeyHeader = Request.Headers["x-lis-key"].ToString();
        var labCodeHeader = Request.Headers["x-lab-code"].ToString();
        var effectiveKey = !string.IsNullOrWhiteSpace(req.ApiKey) ? req.ApiKey.Trim() : apiKeyHeader.Trim();

        TenantLab? tenant = null;

        if (!string.IsNullOrWhiteSpace(effectiveKey))
        {
            tenant = await _context.Tenants.IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.LisApiKey == effectiveKey || t.LabCode == effectiveKey);
        }

        if (tenant == null && !string.IsNullOrWhiteSpace(req.LabId) && Guid.TryParse(req.LabId, out var parsedTenantId))
        {
            tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == parsedTenantId);
        }

        if (tenant == null && !string.IsNullOrWhiteSpace(req.LabCode))
        {
            tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.LabCode == req.LabCode.Trim());
        }

        if (tenant == null && !string.IsNullOrWhiteSpace(labCodeHeader))
        {
            tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.LabCode == labCodeHeader.Trim());
        }

        if (tenant == null && _currentUserService.TenantId.HasValue)
        {
            tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == _currentUserService.TenantId.Value);
        }

        // Fallback for single tenant dev test environment
        if (tenant == null)
        {
            tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.IsActive);
        }

        if (tenant == null)
        {
            return Unauthorized(new { message = "Unauthorized LIS client. Please provide a valid Lab API Key or Lab Code." });
        }

        // 2. Locate Case Order by Barcode or CaseNumber
        var searchBarcode = req.Barcode.Trim();
        var trimmedBarcode = searchBarcode.TrimStart('0');

        var caseOrder = await _context.CaseOrders.IgnoreQueryFilters()
            .Include(c => c.Patient)
            .Include(c => c.Items).ThenInclude(i => i.Test)
            .Include(c => c.Items).ThenInclude(i => i.Results).ThenInclude(r => r.Parameter)
            .FirstOrDefaultAsync(c => c.TenantId == tenant.Id &&
                (c.Barcode == searchBarcode ||
                 c.CaseNumber == searchBarcode ||
                 c.Barcode == trimmedBarcode ||
                 c.CaseNumber.EndsWith(searchBarcode)));

        if (caseOrder == null)
        {
            return NotFound(new MachineSyncResponseDto
            {
                Success = false,
                Message = $"No case found in lab '{tenant.LabName}' matching barcode/sample ID: '{searchBarcode}'. Please ensure sample is registered.",
                Barcode = searchBarcode,
                MachineName = req.MachineName
            });
        }

        if (caseOrder.Status == CaseStatus.Approved)
        {
            return BadRequest(new MachineSyncResponseDto
            {
                Success = false,
                Message = $"Report for Case {caseOrder.CaseNumber} is already verified and approved. Unlock the report to allow automated machine updates.",
                CaseId = caseOrder.Id,
                CaseNumber = caseOrder.CaseNumber,
                Barcode = caseOrder.Barcode
            });
        }

        // 3. Normal Ranges & Evaluation Setup
        var patientAgeDays = caseOrder.Patient.AgeYears * 365 + caseOrder.Patient.AgeMonths * 30 + caseOrder.Patient.AgeDays;
        var allResults = caseOrder.Items.SelectMany(i => i.Results).ToList();
        var paramIds = allResults.Select(r => r.ParameterId).Distinct().ToList();

        var normalRangesList = await _context.ParameterNormalRanges.IgnoreQueryFilters()
            .Where(nr => paramIds.Contains(nr.ParameterId))
            .ToListAsync();
        var normalRangesLookup = normalRangesList.ToLookup(nr => nr.ParameterId);

        var syncedDetails = new List<SyncedParameterDetailDto>();
        var unmatchedList = new List<string>();
        int criticalCount = 0;

        // 4. Map and update results
        foreach (var incoming in req.TestResults)
        {
            var rawCode = incoming.ParameterCode.Trim();
            var incomingVal = incoming.Value?.Trim();

            if (string.IsNullOrWhiteSpace(incomingVal)) continue;

            // Find matching parameter in the case order items
            TestResultValue? targetResult = null;

            // Direct code match
            targetResult = allResults.FirstOrDefault(r =>
                r.Parameter != null &&
                string.Equals(r.Parameter.ParameterCode, rawCode, StringComparison.OrdinalIgnoreCase));

            // Name match if not found
            if (targetResult == null)
            {
                targetResult = allResults.FirstOrDefault(r =>
                    r.Parameter != null &&
                    (string.Equals(r.Parameter.ParameterName, rawCode, StringComparison.OrdinalIgnoreCase) ||
                     r.Parameter.ParameterName.IndexOf(rawCode, StringComparison.OrdinalIgnoreCase) >= 0));
            }

            // Alias match
            if (targetResult == null)
            {
                foreach (var aliasEntry in ParameterAliases)
                {
                    if (aliasEntry.Value.Any(a => string.Equals(a, rawCode, StringComparison.OrdinalIgnoreCase)))
                    {
                        var standardCode = aliasEntry.Key;
                        targetResult = allResults.FirstOrDefault(r =>
                            r.Parameter != null &&
                            (string.Equals(r.Parameter.ParameterCode, standardCode, StringComparison.OrdinalIgnoreCase) ||
                             aliasEntry.Value.Any(a => string.Equals(a, r.Parameter.ParameterCode, StringComparison.OrdinalIgnoreCase))));
                        if (targetResult != null) break;
                    }
                }
            }

            if (targetResult == null)
            {
                unmatchedList.Add(rawCode);
                continue;
            }

            // Value formatting & Unit safety
            decimal? numericVal = null;
            var cleanValStr = incomingVal.Replace(",", "").Trim();
            if (decimal.TryParse(cleanValStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedNum))
            {
                // Smart auto-scaling for Platelets (e.g. 245000 -> 2.45 if unit is lakhs/cumm)
                var paramCodeUpper = targetResult.Parameter.ParameterCode.ToUpperInvariant();
                var unitUpper = (targetResult.Unit ?? "").ToUpperInvariant();
                if ((paramCodeUpper == "PLT" || paramCodeUpper == "PLATELET") &&
                    (unitUpper.Contains("LAKH") || unitUpper.Contains("LAC")) &&
                    parsedNum > 1000)
                {
                    parsedNum = parsedNum / 100000m;
                    cleanValStr = parsedNum.ToString("0.00", CultureInfo.InvariantCulture);
                }
                else if ((paramCodeUpper == "PLT" || paramCodeUpper == "PLATELET") &&
                    (unitUpper.Contains("LAKH") || unitUpper.Contains("LAC")) &&
                    parsedNum > 50 && parsedNum <= 1000) // sent in 10^3/uL
                {
                    parsedNum = parsedNum / 100m;
                    cleanValStr = parsedNum.ToString("0.00", CultureInfo.InvariantCulture);
                }

                numericVal = parsedNum;
            }

            targetResult.ResultValue = cleanValStr;
            targetResult.NumericValue = numericVal;
            if (!string.IsNullOrWhiteSpace(incoming.Remarks))
            {
                targetResult.Remarks = incoming.Remarks;
            }

            // Evaluate Normal Range & Flags
            var ranges = normalRangesLookup[targetResult.ParameterId];
            var matchedRange = ranges.FirstOrDefault(nr =>
                (nr.ApplicableGender == Gender.Both || nr.ApplicableGender == caseOrder.Patient.Gender) &&
                patientAgeDays >= nr.MinAgeDays &&
                patientAgeDays <= nr.MaxAgeDays);

            var rangeText = matchedRange?.TextualRange ??
                (matchedRange?.MinNormalValue.HasValue == true && matchedRange?.MaxNormalValue.HasValue == true
                    ? $"{matchedRange.MinNormalValue} - {matchedRange.MaxNormalValue} {targetResult.Unit}"
                    : null);

            if (!string.IsNullOrWhiteSpace(rangeText))
            {
                targetResult.NormalRangeText = rangeText;
            }

            if (numericVal.HasValue && matchedRange != null)
            {
                var num = numericVal.Value;
                if (matchedRange.PanicLowValue.HasValue && num <= matchedRange.PanicLowValue.Value)
                {
                    targetResult.Flag = ResultFlag.Critical;
                    targetResult.IsCriticalPanic = true;
                    targetResult.IsAbnormal = true;
                    criticalCount++;
                }
                else if (matchedRange.PanicHighValue.HasValue && num >= matchedRange.PanicHighValue.Value)
                {
                    targetResult.Flag = ResultFlag.Critical;
                    targetResult.IsCriticalPanic = true;
                    targetResult.IsAbnormal = true;
                    criticalCount++;
                }
                else if (matchedRange.MinNormalValue.HasValue && num < matchedRange.MinNormalValue.Value)
                {
                    targetResult.Flag = ResultFlag.Low;
                    targetResult.IsAbnormal = true;
                    targetResult.IsCriticalPanic = false;
                }
                else if (matchedRange.MaxNormalValue.HasValue && num > matchedRange.MaxNormalValue.Value)
                {
                    targetResult.Flag = ResultFlag.High;
                    targetResult.IsAbnormal = true;
                    targetResult.IsCriticalPanic = false;
                }
                else
                {
                    targetResult.Flag = ResultFlag.Normal;
                    targetResult.IsAbnormal = false;
                    targetResult.IsCriticalPanic = false;
                }
            }
            else
            {
                targetResult.Flag = ResultFlag.Normal;
                targetResult.IsAbnormal = false;
                targetResult.IsCriticalPanic = false;
            }

            syncedDetails.Add(new SyncedParameterDetailDto
            {
                ParameterCode = targetResult.Parameter.ParameterCode,
                ParameterName = targetResult.Parameter.ParameterName,
                Value = targetResult.ResultValue,
                Unit = targetResult.Unit,
                NormalRange = targetResult.NormalRangeText,
                Flag = targetResult.Flag.ToString(),
                IsAbnormal = targetResult.IsAbnormal,
                IsCriticalPanic = targetResult.IsCriticalPanic
            });
        }

        // 5. Update Status of items and case
        foreach (var item in caseOrder.Items)
        {
            var hasAnyResult = item.Results.Any(r => !string.IsNullOrWhiteSpace(r.ResultValue));
            if (hasAnyResult)
            {
                item.Status = ItemResultStatus.Completed;
            }
        }

        var allItemsHaveResults = caseOrder.Items.All(i =>
            i.Results.Any() && i.Results.All(r => !string.IsNullOrWhiteSpace(r.ResultValue)));

        if (allItemsHaveResults)
        {
            caseOrder.Status = CaseStatus.Completed;
        }

        if (!caseOrder.SampleCollectedDate.HasValue)
        {
            caseOrder.SampleCollectedDate = req.TestedAt ?? DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        EvictReportCache(caseOrder.Id, caseOrder.PublicAccessToken);

        // 6. Real-Time SignalR Broadcast to Lab Users
        try
        {
            await GetTenantGroup(caseOrder.TenantId).SendAsync("MachineDataSynced", new
            {
                caseId = caseOrder.Id,
                caseNumber = caseOrder.CaseNumber,
                barcode = caseOrder.Barcode,
                patientName = caseOrder.Patient.FullName,
                machineName = req.MachineName ?? "Automated Analyzer",
                syncedCount = syncedDetails.Count,
                criticalCount,
                syncedTime = DateTime.UtcNow
            });

            await GetTenantGroup(caseOrder.TenantId).SendAsync("CaseStatusChanged", new
            {
                caseId = caseOrder.Id,
                caseNumber = caseOrder.CaseNumber,
                status = caseOrder.Status.ToString(),
                patientName = caseOrder.Patient.FullName,
                hasCriticalPanic = criticalCount > 0
            });

            if (criticalCount > 0)
            {
                var criticalParams = syncedDetails.Where(d => d.IsCriticalPanic).ToList();
                await GetTenantGroup(caseOrder.TenantId).SendAsync("CriticalPanicAlert", new
                {
                    caseId = caseOrder.Id,
                    caseNumber = caseOrder.CaseNumber,
                    patientName = caseOrder.Patient.FullName,
                    criticalCount,
                    parameters = criticalParams,
                    alertTime = DateTime.UtcNow
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SignalR notification failed for machine sync on Case: {CaseNumber}", caseOrder.CaseNumber);
        }

        _logger.LogInformation("Successfully synced {Count} parameters from machine '{Machine}' for Case {CaseNumber} (Barcode: {Barcode})",
            syncedDetails.Count, req.MachineName, caseOrder.CaseNumber, caseOrder.Barcode);

        return Ok(new MachineSyncResponseDto
        {
            Success = true,
            Message = $"Successfully synced {syncedDetails.Count} parameter(s) from analyzer machine into patient report.",
            MachineName = req.MachineName ?? "Analyzer",
            CaseId = caseOrder.Id,
            CaseNumber = caseOrder.CaseNumber,
            Barcode = caseOrder.Barcode,
            PatientName = caseOrder.Patient.FullName,
            SyncedParametersCount = syncedDetails.Count,
            CriticalPanicCount = criticalCount,
            SyncedParameters = syncedDetails,
            UnmatchedParameters = unmatchedList
        });
    }

    /// <summary>
    /// Direct Test Simulator: Allows 1-click test simulation without needing a physical machine or external script
    /// </summary>
    [HttpPost("simulate-test")]
    public async Task<ActionResult<MachineSyncResponseDto>> SimulateTest([FromBody] SimulateMachineTestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.BarcodeOrCaseNumber))
        {
            return BadRequest(new { message = "Barcode or Case Number is required for simulation." });
        }

        var results = new List<MachineParameterResultDto>();

        switch (dto.MachinePreset)
        {
            case "Severe_Anemia":
                results = new List<MachineParameterResultDto>
                {
                    new() { ParameterCode = "HGB", Value = "5.2", Unit = "g/dL" },
                    new() { ParameterCode = "WBC", Value = "6800", Unit = "/cumm" },
                    new() { ParameterCode = "PLT", Value = "210000", Unit = "cells/cumm" },
                    new() { ParameterCode = "RBC", Value = "2.10", Unit = "mil/cumm" },
                    new() { ParameterCode = "PCV", Value = "18.5", Unit = "%" },
                    new() { ParameterCode = "MCV", Value = "65.0", Unit = "fL" },
                    new() { ParameterCode = "MCH", Value = "20.1", Unit = "pg" },
                    new() { ParameterCode = "MCHC", Value = "28.5", Unit = "g/dL" },
                    new() { ParameterCode = "NEUT", Value = "65", Unit = "%" },
                    new() { ParameterCode = "LYMPH", Value = "28", Unit = "%" },
                    new() { ParameterCode = "MONO", Value = "4", Unit = "%" },
                    new() { ParameterCode = "EOS", Value = "2", Unit = "%" },
                    new() { ParameterCode = "BASO", Value = "1", Unit = "%" }
                };
                break;

            case "High_Infection":
                results = new List<MachineParameterResultDto>
                {
                    new() { ParameterCode = "HGB", Value = "12.5", Unit = "g/dL" },
                    new() { ParameterCode = "WBC", Value = "28500", Unit = "/cumm" },
                    new() { ParameterCode = "PLT", Value = "380000", Unit = "cells/cumm" },
                    new() { ParameterCode = "RBC", Value = "4.2", Unit = "mil/cumm" },
                    new() { ParameterCode = "PCV", Value = "39.0", Unit = "%" },
                    new() { ParameterCode = "NEUT", Value = "88", Unit = "%" },
                    new() { ParameterCode = "LYMPH", Value = "8", Unit = "%" },
                    new() { ParameterCode = "MONO", Value = "3", Unit = "%" },
                    new() { ParameterCode = "EOS", Value = "1", Unit = "%" }
                };
                break;

            case "Thrombocytopenia":
                results = new List<MachineParameterResultDto>
                {
                    new() { ParameterCode = "HGB", Value = "13.2", Unit = "g/dL" },
                    new() { ParameterCode = "WBC", Value = "4500", Unit = "/cumm" },
                    new() { ParameterCode = "PLT", Value = "18000", Unit = "cells/cumm" }, // Critical Low
                    new() { ParameterCode = "RBC", Value = "4.6", Unit = "mil/cumm" }
                };
                break;

            default: // Mindray CBC Normal Preset
                results = new List<MachineParameterResultDto>
                {
                    new() { ParameterCode = "HGB", Value = "14.2", Unit = "g/dL" },
                    new() { ParameterCode = "WBC", Value = "7400", Unit = "/cumm" },
                    new() { ParameterCode = "PLT", Value = "245000", Unit = "cells/cumm" },
                    new() { ParameterCode = "RBC", Value = "4.85", Unit = "mil/cumm" },
                    new() { ParameterCode = "PCV", Value = "42.5", Unit = "%" },
                    new() { ParameterCode = "MCV", Value = "88.2", Unit = "fL" },
                    new() { ParameterCode = "MCH", Value = "29.4", Unit = "pg" },
                    new() { ParameterCode = "MCHC", Value = "33.5", Unit = "g/dL" },
                    new() { ParameterCode = "NEUT", Value = "62", Unit = "%" },
                    new() { ParameterCode = "LYMPH", Value = "30", Unit = "%" },
                    new() { ParameterCode = "MONO", Value = "5", Unit = "%" },
                    new() { ParameterCode = "EOS", Value = "2", Unit = "%" },
                    new() { ParameterCode = "BASO", Value = "1", Unit = "%" }
                };
                break;
        }

        var syncRequest = new MachineResultSyncRequest
        {
            Barcode = dto.BarcodeOrCaseNumber,
            MachineName = $"Simulated Analyzer ({dto.MachinePreset})",
            Protocol = "ASTM-1394-SIMULATOR",
            TestedAt = DateTime.UtcNow,
            TestResults = results
        };

        return await SyncMachineResults(syncRequest);
    }
}
