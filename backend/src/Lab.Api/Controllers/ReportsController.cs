using Lab.Application.Common.Interfaces;
using Lab.Domain.Entities;
using Lab.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Lab.Api.Controllers;

public class SendWhatsAppPdfRequest
{
    public Guid CaseOrderId { get; set; }
    public string RecipientType { get; set; } = "Patient"; // "Patient", "Doctor", "Both"
    public string? CustomPhone { get; set; }
    public bool LetterheadMode { get; set; } = true;
    public string? CustomMessage { get; set; }
}

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("PdfReportPolicy")]
public class ReportsController : ControllerBase
{
    private readonly IPdfReportService _pdfReportService;
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly IWhatsAppNotificationService _whatsAppNotificationService;

    public ReportsController(
        IPdfReportService pdfReportService,
        IApplicationDbContext context,
        IMemoryCache cache,
        IWhatsAppNotificationService whatsAppNotificationService)
    {
        _pdfReportService = pdfReportService;
        _context = context;
        _cache = cache;
        _whatsAppNotificationService = whatsAppNotificationService;
    }

    [AllowAnonymous]
    [HttpGet("pdf/{caseOrderId}")]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadReportPdf(Guid caseOrderId, [FromQuery] bool letterheadMode = true, [FromQuery] bool download = false)
    {
        if (!await IsLabSubscriptionActiveAsync(caseOrderId))
            return StatusCode(403, new { message = "Laboratory subscription has expired. Please renew your plan to generate and download patient reports." });

        var cacheKey = $"report_pdf_{caseOrderId}_{letterheadMode}";
        if (!_cache.TryGetValue(cacheKey, out byte[]? pdfBytes) || pdfBytes == null)
        {
            pdfBytes = await _pdfReportService.GeneratePatientReportPdfAsync(caseOrderId, letterheadMode);
            _cache.Set(cacheKey, pdfBytes, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
                SlidingExpiration = TimeSpan.FromMinutes(3)
            });
        }

        var disposition = download ? "attachment" : "inline";
        Response.Headers.Append("Content-Disposition", $"{disposition}; filename=DiagnosticReport_{caseOrderId}.pdf");
        return File(pdfBytes, "application/pdf", download ? $"DiagnosticReport_{caseOrderId}.pdf" : null);
    }

    [AllowAnonymous]
    [HttpGet("invoice/{caseOrderId}")]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadInvoicePdf(Guid caseOrderId, [FromQuery] bool download = false)
    {
        if (!await IsLabSubscriptionActiveAsync(caseOrderId))
            return StatusCode(403, new { message = "Laboratory subscription has expired. Please renew your plan to download tax invoices and bills." });

        var cacheKey = $"invoice_pdf_{caseOrderId}";
        if (!_cache.TryGetValue(cacheKey, out byte[]? pdfBytes) || pdfBytes == null)
        {
            pdfBytes = await _pdfReportService.GenerateInvoicePdfAsync(caseOrderId);
            _cache.Set(cacheKey, pdfBytes, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
                SlidingExpiration = TimeSpan.FromMinutes(3)
            });
        }

        var disposition = download ? "attachment" : "inline";
        Response.Headers.Append("Content-Disposition", $"{disposition}; filename=TaxInvoice_{caseOrderId}.pdf");
        return File(pdfBytes, "application/pdf", download ? $"TaxInvoice_{caseOrderId}.pdf" : null);
    }

    [AllowAnonymous]
    [HttpGet("thermal-receipt/{caseOrderId}")]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadThermalReceiptPdf(Guid caseOrderId, [FromQuery] int width = 80, [FromQuery] bool download = false)
    {
        if (!await IsLabSubscriptionActiveAsync(caseOrderId))
            return StatusCode(403, new { message = "Laboratory subscription has expired. Please renew your plan to download thermal receipts." });

        var cacheKey = $"thermal_receipt_{caseOrderId}_{width}";
        if (!_cache.TryGetValue(cacheKey, out byte[]? pdfBytes) || pdfBytes == null)
        {
            pdfBytes = await _pdfReportService.GenerateThermalReceiptPdfAsync(caseOrderId, width);
            _cache.Set(cacheKey, pdfBytes, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
                SlidingExpiration = TimeSpan.FromMinutes(3)
            });
        }

        var disposition = download ? "attachment" : "inline";
        Response.Headers.Append("Content-Disposition", $"{disposition}; filename=ThermalReceipt_{caseOrderId}.pdf");
        return File(pdfBytes, "application/pdf", download ? $"ThermalReceipt_{caseOrderId}.pdf" : null);
    }

    // WhatsApp Cloud Gateway Status
    [AllowAnonymous]
    [HttpGet("whatsapp-status")]
    public IActionResult GetWhatsAppStatus()
    {
        return Ok(new
        {
            isConfigured = _whatsAppNotificationService.IsConfigured,
            provider = _whatsAppNotificationService.ProviderName,
            message = _whatsAppNotificationService.IsConfigured
                ? $"WhatsApp Cloud API ({_whatsAppNotificationService.ProviderName}) is configured for direct PDF delivery."
                : "Direct Cloud Gateway is not configured. Direct PDF file share via device / Web Share API will be used."
        });
    }

    // Direct WhatsApp PDF Document Dispatch Endpoint
    [HttpPost("send-whatsapp-pdf")]
    public async Task<IActionResult> SendWhatsAppReportPdf([FromBody] SendWhatsAppPdfRequest request)
    {
        if (request == null || request.CaseOrderId == Guid.Empty)
            return BadRequest(new { message = "Invalid request. CaseOrderId is required." });

        var caseOrder = await _context.CaseOrders
            .IgnoreQueryFilters()
            .Include(c => c.Patient)
            .Include(c => c.ReferringDoctor)
            .FirstOrDefaultAsync(c => c.Id == request.CaseOrderId);

        if (caseOrder == null)
            return NotFound(new { message = "Case order not found." });

        if (!await IsLabSubscriptionActiveAsync(caseOrder.Id))
            return StatusCode(403, new { message = "Laboratory subscription has expired. Please renew your plan." });

        if (caseOrder.PublicAccessToken == Guid.Empty)
        {
            caseOrder.PublicAccessToken = Guid.NewGuid();
            await _context.SaveChangesAsync();
        }

        var pdfBytes = await _pdfReportService.GeneratePatientReportPdfAsync(caseOrder.Id, request.LetterheadMode);
        var origin = $"{Request.Scheme}://{Request.Host}";
        var downloadUrl = $"{origin}/api/reports/public/{caseOrder.PublicAccessToken}/download?letterheadMode={request.LetterheadMode}";
        var fileName = $"Report_{caseOrder.CaseNumber}.pdf";

        var isBoth = request.RecipientType.Equals("Both", StringComparison.OrdinalIgnoreCase);
        var isDoctor = request.RecipientType.Equals("Doctor", StringComparison.OrdinalIgnoreCase);

        var sendOutcomes = new List<object>();

        if (isBoth || !isDoctor)
        {
            var patientPhone = request.CustomPhone ?? caseOrder.Patient?.Phone ?? "";
            var patientName = caseOrder.Patient?.FullName ?? "Patient";
            var patResult = await _whatsAppNotificationService.SendReportPdfAsync(
                patientPhone,
                patientName,
                caseOrder.CaseNumber,
                downloadUrl,
                pdfBytes,
                fileName,
                request.CustomMessage);

            sendOutcomes.Add(new
            {
                recipient = "Patient",
                name = patientName,
                phone = patientPhone,
                success = patResult.Success,
                message = patResult.Message,
                deliveryChannel = patResult.DeliveryChannel,
                requiresClientShare = patResult.RequiresClientShare
            });
        }

        if (isBoth || isDoctor)
        {
            var doctorPhone = (isBoth ? null : request.CustomPhone) ?? caseOrder.ReferringDoctor?.Phone ?? "";
            var doctorName = caseOrder.ReferringDoctor?.DoctorName ?? "Doctor";
            var docTitle = doctorName.Trim().ToLower().StartsWith("dr") ? doctorName.Trim() : $"Dr. {doctorName.Trim()}";
            var docResult = await _whatsAppNotificationService.SendReportPdfAsync(
                doctorPhone,
                docTitle,
                caseOrder.CaseNumber,
                downloadUrl,
                pdfBytes,
                fileName,
                request.CustomMessage);

            sendOutcomes.Add(new
            {
                recipient = "Doctor",
                name = docTitle,
                phone = doctorPhone,
                success = docResult.Success,
                message = docResult.Message,
                deliveryChannel = docResult.DeliveryChannel,
                requiresClientShare = docResult.RequiresClientShare
            });
        }

        var anySuccess = sendOutcomes.Any(o => (bool)((dynamic)o).success);
        var allRequireClient = sendOutcomes.All(o => (bool)((dynamic)o).requiresClientShare);

        return Ok(new
        {
            success = anySuccess,
            requiresClientShare = allRequireClient,
            provider = _whatsAppNotificationService.ProviderName,
            isConfigured = _whatsAppNotificationService.IsConfigured,
            downloadUrl,
            fileName,
            token = caseOrder.PublicAccessToken.ToString(),
            caseNumber = caseOrder.CaseNumber,
            outcomes = sendOutcomes
        });
    }

    // Public QR Code token-based access (No login needed!)
    [AllowAnonymous]
    [HttpGet("public/{token}")]
    public async Task<IActionResult> GetPublicReportByToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token) ||
            token.Equals("undefined", StringComparison.OrdinalIgnoreCase) ||
            token.Equals("null", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Invalid report verification link. Please check the URL or request the lab to resend the link." });
        }

        var trimmedToken = token.Trim();
        CaseOrder? caseOrder = null;

        if (Guid.TryParse(trimmedToken, out var guidToken) && guidToken != Guid.Empty)
        {
            caseOrder = await _context.CaseOrders
                .IgnoreQueryFilters()
                .Include(c => c.Patient)
                .Include(c => c.Items).ThenInclude(i => i.Test)
                .FirstOrDefaultAsync(c => c.PublicAccessToken == guidToken || c.Id == guidToken);
        }

        if (caseOrder == null)
        {
            caseOrder = await _context.CaseOrders
                .IgnoreQueryFilters()
                .Include(c => c.Patient)
                .Include(c => c.Items).ThenInclude(i => i.Test)
                .FirstOrDefaultAsync(c => c.CaseNumber.ToLower() == trimmedToken.ToLower() || c.Barcode.ToLower() == trimmedToken.ToLower());
        }

        if (caseOrder == null)
            return NotFound(new { message = "Report link is invalid or expired." });

        if (caseOrder.PublicAccessToken == Guid.Empty)
        {
            caseOrder.PublicAccessToken = Guid.NewGuid();
            await _context.SaveChangesAsync();
        }

        var lab = await _context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == caseOrder.TenantId);

        var isLabExpired = lab != null && (lab.SubscriptionStatus == "Expired" || lab.SubscriptionStatus == "Suspended" || (lab.SubscriptionExpiryDate.HasValue && lab.SubscriptionExpiryDate.Value < DateTime.UtcNow));
        if (isLabExpired)
            return StatusCode(403, new { message = "Laboratory access is currently inactive / expired. Please contact laboratory administration." });

        return Ok(new
        {
            CaseId = caseOrder.Id,
            caseOrder.PublicAccessToken,
            caseOrder.CaseNumber,
            caseOrder.Barcode,
            PatientName = caseOrder.Patient?.FullName ?? "Patient",
            PatientPhone = caseOrder.Patient?.Phone,
            PatientAgeGender = $"{caseOrder.Patient?.AgeYears ?? 0} Y / {caseOrder.Patient?.Gender.ToString() ?? "N/A"}",
            caseOrder.OrderDate,
            Status = caseOrder.Status.ToString(),
            caseOrder.ApprovedByName,
            caseOrder.ApprovedAt,
            LabName = lab?.LabName ?? "Pathology Lab",
            LabPhone = lab?.Phone,
            LabAddress = $"{lab?.Address}, {lab?.City}",
            Tests = caseOrder.Items.Select(i => i.Test?.TestName ?? "Investigation").ToList()
        });
    }

    [AllowAnonymous]
    [HttpGet("public/{token}/download")]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadPublicReportPdf(string token, [FromQuery] bool letterheadMode = true, [FromQuery] bool download = false)
    {
        if (string.IsNullOrWhiteSpace(token) ||
            token.Equals("undefined", StringComparison.OrdinalIgnoreCase) ||
            token.Equals("null", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Invalid report verification token." });
        }

        var trimmedToken = token.Trim();
        CaseOrder? caseOrder = null;

        if (Guid.TryParse(trimmedToken, out var guidToken) && guidToken != Guid.Empty)
        {
            caseOrder = await _context.CaseOrders
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.PublicAccessToken == guidToken || c.Id == guidToken);
        }

        if (caseOrder == null)
        {
            caseOrder = await _context.CaseOrders
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.CaseNumber.ToLower() == trimmedToken.ToLower() || c.Barcode.ToLower() == trimmedToken.ToLower());
        }

        if (caseOrder == null)
            return NotFound(new { message = "Report link is invalid or expired." });

        if (caseOrder.PublicAccessToken == Guid.Empty)
        {
            caseOrder.PublicAccessToken = Guid.NewGuid();
            await _context.SaveChangesAsync();
        }

        if (!await IsLabSubscriptionActiveAsync(caseOrder.Id))
            return StatusCode(403, new { message = "Laboratory access is currently inactive / expired. Please contact laboratory administration." });

        if (caseOrder.Status != CaseStatus.Approved)
            return BadRequest(new { message = "Report is currently under lab testing/processing and has not been approved yet." });

        var cacheKey = $"public_report_pdf_{caseOrder.PublicAccessToken}_{letterheadMode}";
        if (!_cache.TryGetValue(cacheKey, out byte[]? pdfBytes) || pdfBytes == null)
        {
            pdfBytes = await _pdfReportService.GeneratePatientReportPdfAsync(caseOrder.Id, letterheadMode);
            _cache.Set(cacheKey, pdfBytes, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
                SlidingExpiration = TimeSpan.FromMinutes(3)
            });
        }

        var disposition = download ? "attachment" : "inline";
        Response.Headers.Append("Content-Disposition", $"{disposition}; filename=Report_{caseOrder.CaseNumber}.pdf");
        return File(pdfBytes, "application/pdf");
    }

    private async Task<bool> IsLabSubscriptionActiveAsync(Guid caseOrderId)
    {
        var caseOrder = await _context.CaseOrders.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(c => c.Id == caseOrderId);
        if (caseOrder == null) return false;

        var lab = await _context.Tenants.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(t => t.Id == caseOrder.TenantId);
        if (lab == null) return true;

        var isExpired = lab.SubscriptionStatus == "Expired" || 
                        lab.SubscriptionStatus == "Suspended" || 
                        (lab.SubscriptionExpiryDate.HasValue && lab.SubscriptionExpiryDate.Value < DateTime.UtcNow);

        return !isExpired;
    }
}
