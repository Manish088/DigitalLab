using Lab.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IPdfReportService _pdfReportService;
    private readonly IApplicationDbContext _context;

    public ReportsController(
        IPdfReportService pdfReportService,
        IApplicationDbContext context)
    {
        _pdfReportService = pdfReportService;
        _context = context;
    }

    [AllowAnonymous]
    [HttpGet("pdf/{caseOrderId}")]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadReportPdf(Guid caseOrderId, [FromQuery] bool letterheadMode = true, [FromQuery] bool download = false)
    {
        var pdfBytes = await _pdfReportService.GeneratePatientReportPdfAsync(caseOrderId, letterheadMode);
        var disposition = download ? "attachment" : "inline";
        Response.Headers.Append("Content-Disposition", $"{disposition}; filename=DiagnosticReport_{caseOrderId}.pdf");
        return File(pdfBytes, "application/pdf", download ? $"DiagnosticReport_{caseOrderId}.pdf" : null);
    }

    [AllowAnonymous]
    [HttpGet("invoice/{caseOrderId}")]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadInvoicePdf(Guid caseOrderId, [FromQuery] bool download = false)
    {
        var pdfBytes = await _pdfReportService.GenerateInvoicePdfAsync(caseOrderId);
        var disposition = download ? "attachment" : "inline";
        Response.Headers.Append("Content-Disposition", $"{disposition}; filename=TaxInvoice_{caseOrderId}.pdf");
        return File(pdfBytes, "application/pdf", download ? $"TaxInvoice_{caseOrderId}.pdf" : null);
    }

    // Public QR Code token-based access (No login needed!)
    [AllowAnonymous]
    [HttpGet("public/{token}")]
    public async Task<IActionResult> GetPublicReportByToken(Guid token)
    {
        var caseOrder = await _context.CaseOrders
            .IgnoreQueryFilters()
            .Include(c => c.Patient)
            .Include(c => c.Items).ThenInclude(i => i.Test)
            .FirstOrDefaultAsync(c => c.PublicAccessToken == token);

        if (caseOrder == null)
            return NotFound(new { message = "Report link is invalid or expired." });

        var lab = await _context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == caseOrder.TenantId);

        return Ok(new
        {
            CaseId = caseOrder.Id,
            caseOrder.CaseNumber,
            caseOrder.Barcode,
            PatientName = caseOrder.Patient.FullName,
            PatientAgeGender = $"{caseOrder.Patient.AgeYears} Y / {caseOrder.Patient.Gender}",
            caseOrder.OrderDate,
            Status = caseOrder.Status.ToString(),
            caseOrder.ApprovedByName,
            caseOrder.ApprovedAt,
            LabName = lab?.LabName ?? "Pathology Lab",
            LabPhone = lab?.Phone,
            LabAddress = $"{lab?.Address}, {lab?.City}",
            Tests = caseOrder.Items.Select(i => i.Test.TestName).ToList()
        });
    }

    [AllowAnonymous]
    [HttpGet("public/{token}/download")]
    [Produces("application/pdf")]
    public async Task<IActionResult> DownloadPublicReportPdf(Guid token)
    {
        var caseOrder = await _context.CaseOrders
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.PublicAccessToken == token);

        if (caseOrder == null)
            return NotFound(new { message = "Report link is invalid or expired." });

        var pdfBytes = await _pdfReportService.GeneratePatientReportPdfAsync(caseOrder.Id, false);
        Response.Headers.Append("Content-Disposition", $"inline; filename=Report_{caseOrder.CaseNumber}.pdf");
        return File(pdfBytes, "application/pdf");
    }
}
