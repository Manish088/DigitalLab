using System.Diagnostics;
using System.Globalization;
using Lab.Application.Common.Interfaces;
using Lab.Domain.Entities;
using Lab.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Lab.Infrastructure.Services;

public class PdfReportService : IPdfReportService
{
    private readonly IApplicationDbContext _context;

    public PdfReportService(IApplicationDbContext context)
    {
        _context = context;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GeneratePatientReportPdfAsync(Guid caseOrderId, bool isLetterheadMode = true)
    {
        var sw = Stopwatch.StartNew();
        Console.WriteLine($"[PDF] Starting report generation for case {caseOrderId}...");

        var caseOrder = await _context.CaseOrders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(c => c.Patient)
            .Include(c => c.ReferringDoctor)
            .FirstOrDefaultAsync(c => c.Id == caseOrderId);

        if (caseOrder == null)
            throw new KeyNotFoundException($"Case order {caseOrderId} not found");

        var items = await _context.CaseOrderItems
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(i => i.Test).ThenInclude(t => t.Category)
            .Include(i => i.Results)
            .Where(i => i.CaseOrderId == caseOrderId)
            .ToListAsync();

        caseOrder.Items = items;

        var lab = await _context.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == caseOrder.TenantId);

        // Lab Brand Colors & Info
        var primaryColor = !string.IsNullOrWhiteSpace(lab?.PrimaryColor) ? lab.PrimaryColor : "#0f766e";
        var labName = !string.IsNullOrWhiteSpace(lab?.LabName) ? lab.LabName : "CITY CARE DIAGNOSTICS & PATHOLOGY";
        var labPhone = !string.IsNullOrWhiteSpace(lab?.Phone) ? lab.Phone : "7706087066";
        var labEmail = !string.IsNullOrWhiteSpace(lab?.Email) ? lab.Email : "reports@citycarelab.com";
        var labAddressParts = new[] { lab?.Address, lab?.City, lab?.State, lab?.Pincode }
            .Where(s => !string.IsNullOrWhiteSpace(s));
        var labAddress = labAddressParts.Any() ? string.Join(", ", labAddressParts) : "Civil Lines, Azamgarh, Uttar Pradesh - 276001";

        var patientAgeDays = caseOrder.Patient.AgeYears * 365 + caseOrder.Patient.AgeMonths * 30 + caseOrder.Patient.AgeDays;

        var paramIds = caseOrder.Items
            .SelectMany(i => i.Results)
            .Select(r => r.ParameterId)
            .Distinct()
            .ToList();

        var normalRangesList = await _context.ParameterNormalRanges
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(nr => paramIds.Contains(nr.ParameterId))
            .ToListAsync();

        var normalRangesLookup = normalRangesList.ToLookup(nr => nr.ParameterId);

        // Dynamic Letterhead Margins from Tenant Settings
        var marginTop = isLetterheadMode ? 12f : (float)(lab?.LetterheadMarginTopMm ?? 45.0);
        var marginBottom = isLetterheadMode ? 12f : (float)(lab?.LetterheadMarginBottomMm ?? 25.0);
        var marginLeft = isLetterheadMode ? 12f : (float)(lab?.LetterheadMarginLeftMm ?? 12.0);
        var marginRight = isLetterheadMode ? 12f : (float)(lab?.LetterheadMarginRightMm ?? 12.0);

        var sampleTypes = caseOrder.Items
            .Select(i => i.Test?.SampleType)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct()
            .ToList();
        var sampleTypeDisplay = sampleTypes.Any() ? string.Join(", ", sampleTypes) : "Blood / Serum";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginTop(marginTop, Unit.Millimetre);
                page.MarginBottom(marginBottom, Unit.Millimetre);
                page.MarginLeft(marginLeft, Unit.Millimetre);
                page.MarginRight(marginRight, Unit.Millimetre);
                page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(8.5f));

                // 1. Header Section
                if (isLetterheadMode)
                {
                    var headerImageBytes = LoadImageBytes(lab?.HeaderImageUrl);
                    var logoImageBytes = LoadImageBytes(lab?.LogoUrl);

                    page.Header().Column(col =>
                    {
                        if (headerImageBytes != null)
                        {
                            col.Item().PaddingBottom(4).Image(headerImageBytes).FitWidth();
                        }
                        else
                        {
                            col.Item().Table(table =>
                            {
                                table.ColumnsDefinition(cols =>
                                {
                                    if (logoImageBytes != null)
                                    {
                                        cols.ConstantColumn(45); // Logo column
                                        cols.RelativeColumn(2.6f); // Lab details on left
                                    }
                                    else
                                    {
                                        cols.RelativeColumn(2.8f); // Lab details on left
                                    }
                                    cols.RelativeColumn(2.2f); // Diagnostic report title & barcode on right
                                });

                                if (logoImageBytes != null)
                                {
                                    table.Cell().PaddingRight(4).Image(logoImageBytes).FitArea();
                                }

                                table.Cell().Column(c =>
                                {
                                    c.Item().Text(labName.ToUpperInvariant()).FontSize(13).Bold().FontColor(primaryColor);
                                    if (!string.IsNullOrEmpty(lab?.Tagline))
                                        c.Item().Text(lab.Tagline).FontSize(7.5f).Italic().FontColor("#64748b");
                                    c.Item().Text($"{labAddress}").FontSize(7.5f).FontColor("#475569");
                                    c.Item().Text($"Ph: {labPhone} | Email: {labEmail}").FontSize(7.5f).FontColor("#475569");
                                    if (!string.IsNullOrWhiteSpace(lab?.NablNumber))
                                        c.Item().Text($"NABL Acc. No: {lab.NablNumber}").FontSize(7.5f).Bold().FontColor(primaryColor);
                                    else if (!string.IsNullOrWhiteSpace(lab?.Gstin))
                                        c.Item().Text($"GSTIN: {lab.Gstin}").FontSize(7.5f).FontColor("#475569");
                                });

                                table.Cell().Column(c =>
                                {
                                    c.Item().AlignRight().Border(1).BorderColor(primaryColor).Background("#f0fdfa").PaddingVertical(2).PaddingHorizontal(8)
                                        .Text("DIAGNOSTIC REPORT").FontSize(9.5f).Bold().FontColor(primaryColor);

                                    c.Item().PaddingTop(2).Text(t =>
                                    {
                                        t.AlignRight();
                                        t.Span("Case ID: ").FontSize(8f);
                                        t.Span(caseOrder.CaseNumber).Bold().FontSize(8.5f).FontColor("#0f172a");
                                    });

                                    c.Item().Text(t =>
                                    {
                                        t.AlignRight();
                                        t.Span("Barcode: ").FontSize(7.5f);
                                        t.Span(caseOrder.Barcode).FontSize(7.5f).FontColor("#475569");
                                    });

                                    c.Item().Text(t =>
                                    {
                                        t.AlignRight();
                                        t.Span("Priority: ").FontSize(7.5f);
                                        t.Span(caseOrder.Priority.ToString()).Bold().FontSize(7.5f)
                                            .FontColor(caseOrder.Priority == PriorityLevel.STAT || caseOrder.Priority == PriorityLevel.Urgent ? "#dc2626" : "#475569");
                                    });
                                });
                            });

                            col.Item().PaddingTop(3).LineHorizontal(1.5f).LineColor(primaryColor);
                        }
                    });
                }
                else
                {
                    page.Header().Column(col =>
                    {
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(3.0f);
                                cols.RelativeColumn(2.0f);
                            });

                            table.Cell().Text("").FontSize(8);
                            table.Cell().AlignRight().Text($"Case ID: {caseOrder.CaseNumber} | Barcode: {caseOrder.Barcode}").Bold().FontSize(8).FontColor("#475569");
                        });

                        col.Item().PaddingTop(2).LineHorizontal(0.5f).LineColor("#cbd5e1");
                    });
                }

                // 2. Content Section
                page.Content().Column(col =>
                {
                    col.Item().PaddingTop(4);

                    // Patient Demographics Box
                    col.Item().Border(1).BorderColor("#cbd5e1").Background("#f8fafc").Padding(5).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(1.4f); // Patient, Age/Gender, UHID, Sample Type
                            cols.RelativeColumn(1.3f); // Case No, Contact, Ref Doctor, Collection Time
                            cols.RelativeColumn(1.3f); // Registered, Reported, Status, Approved By
                        });

                        table.Cell().Column(c =>
                        {
                            c.Item().Text(t => { t.Span("Patient: ").Bold().FontSize(8.5f); t.Span(caseOrder.Patient.FullName.ToUpperInvariant()).Bold().FontSize(8.5f).FontColor("#0f172a"); });
                            c.Item().Text(t => { t.Span("Age / Gender: ").Bold().FontSize(8); t.Span($"{caseOrder.Patient.AgeYears} Yrs / {caseOrder.Patient.Gender}").FontSize(8); });
                            c.Item().Text(t => { t.Span("UHID: ").Bold().FontSize(8); t.Span(caseOrder.Patient.Uhid).FontSize(8); });
                            c.Item().Text(t => { t.Span("Sample Type: ").Bold().FontSize(8); t.Span(sampleTypeDisplay).FontSize(8).FontColor("#475569"); });
                        });

                        table.Cell().Column(c =>
                        {
                            c.Item().Text(t => { t.Span("Case No: ").Bold().FontSize(8); t.Span(caseOrder.CaseNumber).FontSize(8); });
                            c.Item().Text(t => { t.Span("Contact: ").Bold().FontSize(8); t.Span(caseOrder.Patient.Phone ?? "N/A").FontSize(8); });
                            var docDisplay = caseOrder.ReferringDoctor != null
                                ? $"{caseOrder.ReferringDoctor.DoctorName}{(string.IsNullOrWhiteSpace(caseOrder.ReferringDoctor.Degree) ? "" : $" ({caseOrder.ReferringDoctor.Degree})")}"
                                : "Direct / Self";
                            c.Item().Text(t => { t.Span("Ref. Doctor: ").Bold().FontSize(8); t.Span(docDisplay).FontSize(8); });
                            if (caseOrder.SampleCollectedDate.HasValue)
                            {
                                c.Item().Text(t => { t.Span("Collected: ").Bold().FontSize(8); t.Span(caseOrder.SampleCollectedDate.Value.ToString("dd-MMM-yyyy hh:mm tt")).FontSize(8); });
                            }
                        });

                        table.Cell().Column(c =>
                        {
                            c.Item().Text(t => { t.Span("Registered: ").Bold().FontSize(8); t.Span(caseOrder.OrderDate.ToString("dd-MMM-yyyy hh:mm tt")).FontSize(8); });
                            c.Item().Text(t => { t.Span("Reported: ").Bold().FontSize(8); t.Span((caseOrder.ApprovedAt ?? caseOrder.ReportingDate ?? DateTime.UtcNow).ToString("dd-MMM-yyyy hh:mm tt")).FontSize(8); });
                            c.Item().Text(t =>
                            {
                                t.Span("Status: ").Bold().FontSize(8);
                                t.Span(caseOrder.Status.ToString()).Bold().FontSize(8).FontColor(caseOrder.Status == CaseStatus.Approved ? "#15803d" : "#b45309");
                            });
                            if (!string.IsNullOrWhiteSpace(caseOrder.ApprovedByName))
                            {
                                c.Item().Text(t => { t.Span("Approved By: ").Bold().FontSize(8); t.Span(caseOrder.ApprovedByName).FontSize(8); });
                            }
                        });
                    });

                    col.Item().PaddingTop(5);

                    // Test Results Table
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3.6f); // Investigation / Parameter
                            columns.RelativeColumn(1.3f); // Result Value
                            columns.RelativeColumn(1.0f); // Unit
                            columns.RelativeColumn(2.4f); // Reference Interval
                            columns.RelativeColumn(1.3f); // Flag / Indicator
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background("#e0f2fe").BorderBottom(1).BorderColor("#93c5fd").Padding(3.5f).Text("TEST / INVESTIGATION PARAMETER").Bold().FontSize(7.5f).FontColor("#0369a1");
                            header.Cell().Background("#e0f2fe").BorderBottom(1).BorderColor("#93c5fd").Padding(3.5f).Text("RESULT VALUE").Bold().FontSize(7.5f).FontColor("#0369a1");
                            header.Cell().Background("#e0f2fe").BorderBottom(1).BorderColor("#93c5fd").Padding(3.5f).Text("UNIT").Bold().FontSize(7.5f).FontColor("#0369a1");
                            header.Cell().Background("#e0f2fe").BorderBottom(1).BorderColor("#93c5fd").Padding(3.5f).Text("REFERENCE INTERVAL").Bold().FontSize(7.5f).FontColor("#0369a1");
                            header.Cell().Background("#e0f2fe").BorderBottom(1).BorderColor("#93c5fd").Padding(3.5f).AlignCenter().Text("FLAG").Bold().FontSize(7.5f).FontColor("#0369a1");
                        });

                        foreach (var item in caseOrder.Items)
                        {
                            var deptName = item.Test?.Category?.CategoryName ?? "INVESTIGATION";
                            var testTitle = item.Test != null ? $"{deptName.ToUpperInvariant()} - {item.Test.TestName.ToUpperInvariant()} ({item.Test.TestCode})" : "INVESTIGATION";

                            table.Cell().ColumnSpan(5).Background("#f1f5f9").PaddingVertical(3).PaddingHorizontal(4).Row(r =>
                            {
                                r.RelativeItem().Text(testTitle).Bold().FontSize(8).FontColor("#0f172a");
                                if (!string.IsNullOrWhiteSpace(item.Test?.Methodology))
                                {
                                    r.AutoItem().Text($"Method: {item.Test.Methodology}").Italic().FontSize(7f).FontColor("#64748b");
                                }
                            });

                            var orderedResults = item.Results.OrderBy(r => r.DisplayOrder).ToList();
                            foreach (var res in orderedResults)
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

                                var currentFlag = res.Flag;
                                if (decimal.TryParse(res.ResultValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var numVal) && matchedRange != null)
                                {
                                    if (matchedRange.PanicLowValue.HasValue && numVal <= matchedRange.PanicLowValue.Value)
                                        currentFlag = ResultFlag.Critical;
                                    else if (matchedRange.PanicHighValue.HasValue && numVal >= matchedRange.PanicHighValue.Value)
                                        currentFlag = ResultFlag.Critical;
                                    else if (matchedRange.MinNormalValue.HasValue && numVal < matchedRange.MinNormalValue.Value)
                                        currentFlag = ResultFlag.Low;
                                    else if (matchedRange.MaxNormalValue.HasValue && numVal > matchedRange.MaxNormalValue.Value)
                                        currentFlag = ResultFlag.High;
                                    else
                                        currentFlag = ResultFlag.Normal;
                                }

                                var isHighOrCritical = currentFlag == ResultFlag.High || currentFlag == ResultFlag.Critical;
                                var isLow = currentFlag == ResultFlag.Low;
                                var isAbnormal = isHighOrCritical || isLow;

                                var valColor = currentFlag switch
                                {
                                    ResultFlag.Critical => "#b91c1c", // Dark red
                                    ResultFlag.High => "#dc2626",     // Red
                                    ResultFlag.Low => "#2563eb",      // Blue
                                    _ => "#0f172a"
                                };

                                var flagColor = currentFlag switch
                                {
                                    ResultFlag.Critical => "#b91c1c",
                                    ResultFlag.High => "#dc2626",
                                    ResultFlag.Low => "#2563eb",
                                    _ => "#16a34a"
                                };

                                // 1. Parameter Name
                                var paramName = !string.IsNullOrWhiteSpace(res.ParameterName) ? res.ParameterName : "Parameter";
                                table.Cell().BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(3)
                                    .Text(paramName).FontSize(8);

                                // 2. Result Value
                                var valDisplay = !string.IsNullOrWhiteSpace(res.ResultValue) ? res.ResultValue : "-";
                                table.Cell().BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(3)
                                    .Text(t =>
                                    {
                                        var span = t.Span(valDisplay).FontSize(8.5f).FontColor(valColor);
                                        if (isAbnormal && valDisplay != "-") span.Bold();
                                    });

                                // 3. Unit
                                var unitDisplay = !string.IsNullOrWhiteSpace(res.Unit) ? res.Unit : "-";
                                table.Cell().BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(3)
                                    .Text(unitDisplay).FontSize(7.5f).FontColor("#64748b");

                                // 4. Reference Interval
                                table.Cell().BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(3)
                                    .Text(normalRangeDisplay).FontSize(7.5f).FontColor("#475569");

                                // 5. Flag
                                var flagText = currentFlag switch
                                {
                                    ResultFlag.Normal => (!string.IsNullOrWhiteSpace(res.ResultValue) ? "NORMAL" : "-"),
                                    ResultFlag.High => "HIGH (H) ▲",
                                    ResultFlag.Low => "LOW (L) ▼",
                                    ResultFlag.Critical => "CRITICAL (*)",
                                    _ => "NORMAL"
                                };

                                table.Cell().BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(3).AlignCenter()
                                    .Text(t =>
                                    {
                                        var span = t.Span(flagText).FontSize(7.5f).FontColor(flagColor);
                                        if (isAbnormal) span.Bold();
                                    });
                            }

                            // Remarks / Clinical Interpretation Notes
                            if (!string.IsNullOrWhiteSpace(item.PathologistRemarks) || !string.IsNullOrWhiteSpace(item.InterpretationNote) || !string.IsNullOrWhiteSpace(item.Test?.ClinicalSignificance))
                            {
                                table.Cell().ColumnSpan(5).Background("#fafafa").BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(3.5f).Column(c =>
                                {
                                    if (!string.IsNullOrWhiteSpace(item.PathologistRemarks))
                                        c.Item().Text(t => { t.Span("Remarks: ").Bold().FontSize(7.5f); t.Span(item.PathologistRemarks).FontSize(7.5f); });
                                    if (!string.IsNullOrWhiteSpace(item.InterpretationNote))
                                        c.Item().Text(t => { t.Span("Clinical Interpretation: ").Bold().FontSize(7.5f); t.Span(item.InterpretationNote).FontSize(7.5f); });
                                    if (!string.IsNullOrWhiteSpace(item.Test?.ClinicalSignificance))
                                        c.Item().Text(t => { t.Span("Clinical Significance: ").Italic().FontSize(7f).FontColor("#64748b"); t.Span(item.Test.ClinicalSignificance).FontSize(7f).FontColor("#64748b"); });
                                });
                            }
                        }
                    });

                    // Verification & Signature Section (Dynamic or Removed if not configured)
                    var isSignatureEnabled = lab?.ShowDigitalSignature ?? true;
                    var dynamicDoctorName = !string.IsNullOrWhiteSpace(lab?.PathologistName) 
                        ? lab.PathologistName.Trim() 
                        : (!string.IsNullOrWhiteSpace(caseOrder.ApprovedByName) ? caseOrder.ApprovedByName.Trim() : null);

                    var hasValidDoctorSignature = isSignatureEnabled && !string.IsNullOrWhiteSpace(dynamicDoctorName);

                    if (hasValidDoctorSignature)
                    {
                        col.Item().PaddingTop(8).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(1.2f); // Online Verification Token & ISO Note
                                cols.RelativeColumn(1.8f); // Doctor Signature
                            });

                            table.Cell().Column(c =>
                            {
                                c.Item().Text("Online Report Verification:").FontSize(7.5f).Bold().FontColor("#475569");
                                c.Item().Text($"Token: {caseOrder.PublicAccessToken}").FontSize(6.5f).FontColor("#94a3b8");
                                c.Item().Text($"Report Generated: {DateTime.Now:dd-MMM-yyyy hh:mm tt}").FontSize(6.5f).FontColor("#64748b");
                                c.Item().Text("Note: Tests performed on automated calibrated analyzers with standard quality controls.").FontSize(6f).Italic().FontColor("#94a3b8");
                                c.Item().Text("Partial reproduction of this report is not permitted without laboratory approval.").FontSize(5.5f).Italic().FontColor("#94a3b8");
                            });

                            table.Cell().Column(c =>
                            {
                                var sigImageBytes = LoadImageBytes(lab?.DigitalSignatureUrl);
                                if (sigImageBytes != null)
                                {
                                    c.Item().AlignRight().Height(24).PaddingBottom(2).Image(sigImageBytes).FitArea();
                                }

                                c.Item().Text(t =>
                                {
                                    t.AlignRight();
                                    t.Span("Verified & Digitally Signed By:").FontSize(7.5f).Italic().FontColor("#475569");
                                });

                                c.Item().PaddingTop(2).Text(t =>
                                {
                                    t.AlignRight();
                                    t.Span(dynamicDoctorName).Bold().FontSize(8.5f).FontColor("#0f172a");
                                });

                                if (!string.IsNullOrWhiteSpace(lab?.PathologistDegree))
                                {
                                    c.Item().Text(t =>
                                    {
                                        t.AlignRight();
                                        t.Span(lab.PathologistDegree.Trim()).FontSize(7f).FontColor("#64748b");
                                    });
                                }

                                if (!string.IsNullOrWhiteSpace(lab?.PathologistRegNo))
                                {
                                    c.Item().Text(t =>
                                    {
                                        t.AlignRight();
                                        t.Span($"Reg. No: {lab.PathologistRegNo.Trim()}").FontSize(7f).Bold().FontColor(primaryColor);
                                    });
                                }

                                c.Item().Text(t =>
                                {
                                    t.AlignRight();
                                    t.Span("Consultant Pathologist").FontSize(7f).Italic().FontColor("#475569");
                                });
                            });
                        });
                    }
                    else
                    {
                        // Signature disabled or not configured: render verification token note only
                        col.Item().PaddingTop(8).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(1f);
                            });

                            table.Cell().Column(c =>
                            {
                                c.Item().Text("Online Report Verification:").FontSize(7.5f).Bold().FontColor("#475569");
                                c.Item().Text($"Token: {caseOrder.PublicAccessToken}  |  Report Generated: {DateTime.Now:dd-MMM-yyyy hh:mm tt}").FontSize(6.5f).FontColor("#64748b");
                                c.Item().Text("Note: Tests performed on automated calibrated analyzers with standard quality controls. Partial reproduction of this report is not permitted without laboratory approval.").FontSize(6f).Italic().FontColor("#94a3b8");
                            });
                        });
                    }

                    col.Item().PaddingTop(5).AlignCenter().Text("--- End of Diagnostic Report ---").FontSize(7.5f).Bold().FontColor("#94a3b8");
                });

                // 3. Footer
                var footerImageBytes = isLetterheadMode ? LoadImageBytes(lab?.FooterImageUrl) : null;
                page.Footer().Column(col =>
                {
                    if (footerImageBytes != null)
                    {
                        col.Item().PaddingBottom(2).Image(footerImageBytes).FitWidth();
                    }

                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Text(t =>
                        {
                            t.DefaultTextStyle(x => x.FontSize(7.5f).FontColor("#94a3b8"));
                            t.Span("Page ");
                            t.CurrentPageNumber();
                            t.Span(" of ");
                            t.TotalPages();
                        });

                        row.RelativeItem().AlignCenter().Text($"Verified Diagnostic Report | Case: {caseOrder.CaseNumber}").FontSize(7f).FontColor("#94a3b8");
                        row.RelativeItem().AlignRight().Text($"{labName} | Automated LIMS").FontSize(7.5f).FontColor("#94a3b8");
                    });
                });
            });
        });

        Console.WriteLine($"[PDF] Step 3: Document created in {sw.ElapsedMilliseconds}ms. Starting QuestPDF byte generation...");
        var bytes = document.GeneratePdf();
        Console.WriteLine($"[PDF] Step 4: Finished GeneratePdf in {sw.ElapsedMilliseconds}ms total! Output size: {bytes.Length} bytes.");
        return bytes;
    }

    public async Task<byte[]> GenerateInvoicePdfAsync(Guid caseOrderId)
    {
        var caseOrder = await _context.CaseOrders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(c => c.Patient)
            .Include(c => c.ReferringDoctor)
            .Include(c => c.Items).ThenInclude(i => i.Test)
            .Include(c => c.Transactions)
            .FirstOrDefaultAsync(c => c.Id == caseOrderId);

        if (caseOrder == null)
            throw new KeyNotFoundException($"Case order {caseOrderId} not found");

        var lab = await _context.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == caseOrder.TenantId);

        var primaryColor = !string.IsNullOrWhiteSpace(lab?.PrimaryColor) ? lab.PrimaryColor : "#0f766e";
        var labName = !string.IsNullOrWhiteSpace(lab?.LabName) ? lab.LabName : "CITY CARE DIAGNOSTICS & PATHOLOGY";
        var labPhone = !string.IsNullOrWhiteSpace(lab?.Phone) ? lab.Phone : "7706087066";
        var labAddressParts = new[] { lab?.Address, lab?.City, lab?.State, lab?.Pincode }
            .Where(s => !string.IsNullOrWhiteSpace(s));
        var labAddress = labAddressParts.Any() ? string.Join(", ", labAddressParts) : "Civil Lines, Azamgarh, Uttar Pradesh - 276001";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginTop(12, Unit.Millimetre);
                page.MarginBottom(12, Unit.Millimetre);
                page.MarginLeft(12, Unit.Millimetre);
                page.MarginRight(12, Unit.Millimetre);
                page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(8.5f));

                // 1. Header
                page.Header().Column(col =>
                {
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(2.8f); // Lab details on left
                            cols.RelativeColumn(2.2f); // Tax Invoice title & date on right
                        });

                        table.Cell().Column(c =>
                        {
                            c.Item().Text(labName.ToUpperInvariant()).FontSize(13).Bold().FontColor(primaryColor);
                            c.Item().Text($"{labAddress}").FontSize(7.5f).FontColor("#475569");
                            c.Item().Text($"Ph: {labPhone}").FontSize(7.5f).FontColor("#475569");
                            if (!string.IsNullOrEmpty(lab?.Gstin))
                                c.Item().Text($"GSTIN: {lab.Gstin}").FontSize(7.5f).Bold().FontColor(primaryColor);
                        });

                        table.Cell().Column(c =>
                        {
                            c.Item().Text(t =>
                            {
                                t.AlignRight();
                                t.Span(!string.IsNullOrWhiteSpace(lab?.Gstin) ? "TAX INVOICE / RECEIPT" : "DIAGNOSTIC BILL / RECEIPT").FontSize(11).Bold().FontColor("#1e293b");
                            });
                            c.Item().PaddingTop(2).Text(t =>
                            {
                                t.AlignRight();
                                t.Span($"Bill No: {caseOrder.CaseNumber}").Bold().FontSize(8.5f).FontColor(primaryColor);
                            });
                            c.Item().Text(t =>
                            {
                                t.AlignRight();
                                t.Span($"Date: {caseOrder.OrderDate:dd-MMM-yyyy hh:mm tt}").FontSize(7.5f).FontColor("#64748b");
                            });
                        });
                    });

                    col.Item().PaddingTop(3).LineHorizontal(1).LineColor("#cbd5e1");
                });

                // 2. Content
                page.Content().Column(col =>
                {
                    col.Item().PaddingTop(4);

                    // Patient Details Box
                    col.Item().Border(1).BorderColor("#cbd5e1").Background("#f8fafc").Padding(5).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(1.4f); // Patient, Age/Gender, Phone
                            cols.RelativeColumn(1.4f); // UHID, Ref Doctor, Payment Status
                        });

                        table.Cell().Column(c =>
                        {
                            c.Item().Text(t => { t.Span("Patient: ").Bold().FontSize(8.5f); t.Span(caseOrder.Patient.FullName).Bold().FontSize(8.5f); });
                            c.Item().Text(t => { t.Span("Age / Gender: ").Bold().FontSize(8); t.Span($"{caseOrder.Patient.AgeYears} Y / {caseOrder.Patient.Gender}").FontSize(8); });
                            c.Item().Text(t => { t.Span("Phone: ").Bold().FontSize(8); t.Span(caseOrder.Patient.Phone ?? "N/A").FontSize(8); });
                        });

                        table.Cell().Column(c =>
                        {
                            c.Item().Text(t => { t.Span("UHID: ").Bold().FontSize(8); t.Span(caseOrder.Patient.Uhid).FontSize(8); });
                            c.Item().Text(t => { t.Span("Ref. Doctor: ").Bold().FontSize(8); t.Span(caseOrder.ReferringDoctor?.DoctorName ?? "Direct / Self").FontSize(8); });
                            c.Item().Text(t =>
                            {
                                t.Span("Payment Status: ").Bold().FontSize(8);
                                t.Span(caseOrder.PaymentStatus.ToString()).Bold().FontSize(8).FontColor(caseOrder.PaymentStatus == PaymentStatus.Paid ? "#15803d" : "#b45309");
                            });
                        });
                    });

                    col.Item().PaddingTop(5);

                    // Invoice Line Items Table
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(24);   // #
                            columns.RelativeColumn(5.2f); // Test Name
                            columns.RelativeColumn(1.8f); // Rate
                            columns.RelativeColumn(1.8f); // Net Amount
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background("#f1f5f9").BorderBottom(1).BorderColor("#cbd5e1").Padding(3.5f).Text("#").Bold().FontSize(7.5f);
                            header.Cell().Background("#f1f5f9").BorderBottom(1).BorderColor("#cbd5e1").Padding(3.5f).Text("Particulars / Investigation").Bold().FontSize(7.5f);
                            header.Cell().Background("#f1f5f9").BorderBottom(1).BorderColor("#cbd5e1").Padding(3.5f).Text(t => { t.AlignRight(); t.Span("Rate (INR)").Bold().FontSize(7.5f); });
                            header.Cell().Background("#f1f5f9").BorderBottom(1).BorderColor("#cbd5e1").Padding(3.5f).Text(t => { t.AlignRight(); t.Span("Net Amount (INR)").Bold().FontSize(7.5f); });
                        });

                        int idx = 1;
                        foreach (var item in caseOrder.Items)
                        {
                            var tName = item.Test?.TestName ?? "Investigation";
                            table.Cell().BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(3.5f).Text(idx++.ToString()).FontSize(8);
                            table.Cell().BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(3.5f).Text(tName).FontSize(8);
                            table.Cell().BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(3.5f).Text(t => { t.AlignRight(); t.Span($"Rs. {item.ItemPrice:N2}").FontSize(8); });
                            table.Cell().BorderBottom(0.5f).BorderColor("#e2e8f0").Padding(3.5f).Text(t => { t.AlignRight(); t.Span($"Rs. {item.NetAmount:N2}").FontSize(8); });
                        }
                    });

                    // Summary & Payment History Section
                    col.Item().PaddingTop(6).Table(outerTable =>
                    {
                        outerTable.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(2.8f); // Payment History
                            cols.RelativeColumn(2.2f); // Amount Breakdown Box
                        });

                        // Left Cell: Payment History
                        outerTable.Cell().Column(c =>
                        {
                            c.Item().Text("Payment History:").Bold().FontSize(8).FontColor("#334155");
                            if (caseOrder.Transactions.Any())
                            {
                                foreach (var tx in caseOrder.Transactions)
                                {
                                    c.Item().Text($"- {tx.TransactionDate:dd-MMM hh:mm tt}: Rs. {tx.Amount:N2} via {tx.PaymentMethod} ({tx.ReferenceNumber ?? "Cash"})").FontSize(7).FontColor("#475569");
                                }
                            }
                            else
                            {
                                c.Item().Text($"- {caseOrder.OrderDate:dd-MMM hh:mm tt}: Rs. {caseOrder.PaidAmount:N2} via Cash").FontSize(7).FontColor("#475569");
                            }
                        });

                        // Right Cell: Totals Table inside Border Box
                        outerTable.Cell().Border(1).BorderColor("#cbd5e1").Background("#f8fafc").Padding(5).Table(totalsTable =>
                        {
                            totalsTable.ColumnsDefinition(tCols =>
                            {
                                tCols.RelativeColumn(1.1f); // Label
                                tCols.RelativeColumn(1.4f); // Amount
                            });

                            // Sub Total
                            totalsTable.Cell().Text("Sub Total:").FontSize(8);
                            totalsTable.Cell().Text(t => { t.AlignRight(); t.Span($"Rs. {caseOrder.TotalAmount:N2}").FontSize(8); });

                            // Discount if any
                            if (caseOrder.DiscountAmount > 0)
                            {
                                totalsTable.Cell().Text("Discount:").FontSize(8).FontColor("#dc2626");
                                totalsTable.Cell().Text(t => { t.AlignRight(); t.Span($"- Rs. {caseOrder.DiscountAmount:N2}").FontSize(8).FontColor("#dc2626"); });
                            }

                            // Divider
                            totalsTable.Cell().ColumnSpan(2).PaddingVertical(1).LineHorizontal(0.5f).LineColor("#cbd5e1");

                            // Net Total
                            totalsTable.Cell().Text("Net Total:").Bold().FontSize(8.5f);
                            totalsTable.Cell().Text(t => { t.AlignRight(); t.Span($"Rs. {caseOrder.NetAmount:N2}").Bold().FontSize(8.5f); });

                            // Paid Amount
                            totalsTable.Cell().Text("Paid Amount:").FontSize(8).FontColor("#15803d");
                            totalsTable.Cell().Text(t => { t.AlignRight(); t.Span($"Rs. {caseOrder.PaidAmount:N2}").Bold().FontSize(8.5f).FontColor("#15803d"); });

                            // Balance Due
                            totalsTable.Cell().Text("Balance Due:").Bold().FontSize(8).FontColor(caseOrder.DueAmount > 0 ? "#dc2626" : "#475569");
                            totalsTable.Cell().Text(t => { t.AlignRight(); t.Span($"Rs. {caseOrder.DueAmount:N2}").Bold().FontSize(8.5f).FontColor(caseOrder.DueAmount > 0 ? "#dc2626" : "#475569"); });
                        });
                    });

                    col.Item().PaddingTop(8).AlignCenter().Text("Thank you for choosing us! Get well soon.").FontSize(7.5f).Italic().FontColor("#64748b");
                });

                // 3. Footer
                page.Footer().Row(row =>
                {
                    row.RelativeItem().Text(t =>
                    {
                        t.DefaultTextStyle(x => x.FontSize(7.5f).FontColor("#94a3b8"));
                        t.Span("Page ");
                        t.CurrentPageNumber();
                        t.Span(" of ");
                        t.TotalPages();
                    });

                    row.RelativeItem().AlignRight().Text($"{labName} | Billing System").FontSize(7.5f).FontColor("#94a3b8");
                });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> GenerateThermalReceiptPdfAsync(Guid caseOrderId, int widthMm = 80)
    {
        var caseOrder = await _context.CaseOrders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(c => c.Patient)
            .Include(c => c.ReferringDoctor)
            .Include(c => c.Items).ThenInclude(i => i.Test)
            .Include(c => c.Transactions)
            .FirstOrDefaultAsync(c => c.Id == caseOrderId);

        if (caseOrder == null)
            throw new KeyNotFoundException($"Case order {caseOrderId} not found");

        var lab = await _context.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == caseOrder.TenantId);

        var labName = !string.IsNullOrWhiteSpace(lab?.LabName) ? lab.LabName : "CITY CARE DIAGNOSTICS & PATHOLOGY";
        var labPhone = !string.IsNullOrWhiteSpace(lab?.Phone) ? lab.Phone : "7706087066";
        var labAddressParts = new[] { lab?.Address, lab?.City }
            .Where(s => !string.IsNullOrWhiteSpace(s));
        var labAddress = labAddressParts.Any() ? string.Join(", ", labAddressParts) : "Civil Lines, Azamgarh";

        float actualWidth = widthMm <= 58 ? 58f : 80f;
        float baseHeight = actualWidth <= 58 ? 160f : 140f;
        float pageHeight = baseHeight + (caseOrder.Items.Count * 9f) + (caseOrder.Transactions.Count * 7f);
        if (pageHeight < 120f) pageHeight = 120f;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(actualWidth, pageHeight, Unit.Millimetre);
                page.MarginTop(3, Unit.Millimetre);
                page.MarginBottom(3, Unit.Millimetre);
                page.MarginLeft(2.5f, Unit.Millimetre);
                page.MarginRight(2.5f, Unit.Millimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(actualWidth <= 58 ? 6.5f : 7.5f).FontColor("#000000"));

                page.Content().Column(col =>
                {
                    // 1. Lab Header
                    col.Item().AlignCenter().Text(labName.ToUpperInvariant()).FontSize(actualWidth <= 58 ? 8.5f : 10f).Bold();
                    col.Item().AlignCenter().Text(labAddress).FontSize(actualWidth <= 58 ? 6f : 6.8f);
                    col.Item().AlignCenter().Text($"Ph: {labPhone}").FontSize(actualWidth <= 58 ? 6f : 6.8f);
                    if (!string.IsNullOrEmpty(lab?.Gstin))
                        col.Item().AlignCenter().Text($"GSTIN: {lab.Gstin}").FontSize(actualWidth <= 58 ? 6f : 6.8f).Bold();

                    col.Item().PaddingVertical(1).LineHorizontal(0.6f).LineColor("#000000");

                    // Title
                    col.Item().AlignCenter().Text(!string.IsNullOrWhiteSpace(lab?.Gstin) ? "TAX INVOICE / RECEIPT" : "CASH BILL / RECEIPT").FontSize(actualWidth <= 58 ? 7f : 8f).Bold();
                    col.Item().PaddingBottom(1).LineHorizontal(0.6f).LineColor("#000000");

                    // 2. Bill & Patient Meta
                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Text($"Bill: {caseOrder.CaseNumber}").Bold();
                        r.RelativeItem().AlignRight().Text($"{caseOrder.OrderDate:dd/MM/yy hh:mm tt}").FontSize(actualWidth <= 58 ? 5.5f : 6.5f);
                    });

                    col.Item().Text($"Patient: {caseOrder.Patient.FullName}").Bold();
                    col.Item().Text($"Age/Sex: {caseOrder.Patient.AgeYears} Y / {caseOrder.Patient.Gender} | Mob: {caseOrder.Patient.Phone ?? "N/A"}");
                    col.Item().Text($"UHID: {caseOrder.Patient.Uhid} | Dr: {caseOrder.ReferringDoctor?.DoctorName ?? "Self"}");

                    col.Item().PaddingVertical(1).LineHorizontal(0.6f).LineColor("#000000");

                    // 3. Test Items
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(3.2f);
                            cols.RelativeColumn(1.3f);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Text("Particular / Test").Bold();
                            h.Cell().AlignRight().Text("Amt (Rs)").Bold();
                        });

                        int idx = 1;
                        foreach (var itm in caseOrder.Items)
                        {
                            table.Cell().Text($"{idx++}. {itm.Test?.TestName ?? "Investigation"}");
                            table.Cell().AlignRight().Text($"{itm.NetAmount:F2}");
                        }
                    });

                    col.Item().PaddingVertical(1).LineHorizontal(0.6f).LineColor("#000000");

                    // 4. Financials
                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Gross Total:");
                        r.RelativeItem().AlignRight().Text($"Rs. {caseOrder.TotalAmount:F2}");
                    });

                    if (caseOrder.DiscountAmount > 0)
                    {
                        col.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Discount:");
                            r.RelativeItem().AlignRight().Text($"-Rs. {caseOrder.DiscountAmount:F2}");
                        });
                    }

                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Net Payable:").Bold();
                        r.RelativeItem().AlignRight().Text($"Rs. {caseOrder.NetAmount:F2}").Bold();
                    });

                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Paid Amount:").Bold();
                        r.RelativeItem().AlignRight().Text($"Rs. {caseOrder.PaidAmount:F2}").Bold();
                    });

                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Balance Due:").Bold();
                        r.RelativeItem().AlignRight().Text($"Rs. {caseOrder.DueAmount:F2}").Bold();
                    });

                    col.Item().PaddingVertical(1).LineHorizontal(0.6f).LineColor("#000000");

                    // 5. Footer & Barcode text
                    col.Item().AlignCenter().Text($"Barcode: {caseOrder.Barcode}").Bold();
                    col.Item().AlignCenter().Text("Thank You! Get Well Soon.").Italic();
                    col.Item().AlignCenter().Text("*** Computer Generated POS Slip ***").FontSize(actualWidth <= 58 ? 5f : 6f);
                });
            });
        });

        return document.GeneratePdf();
    }

    private static byte[]? LoadImageBytes(string? imageSource)
    {
        if (string.IsNullOrWhiteSpace(imageSource)) return null;

        try
        {
            // 1. Check if Base64 Data URL (e.g. data:image/png;base64,....)
            if (imageSource.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                var commaIdx = imageSource.IndexOf(',');
                if (commaIdx >= 0)
                {
                    var base64Part = imageSource.Substring(commaIdx + 1);
                    return Convert.FromBase64String(base64Part);
                }
            }

            // 2. Check if local wwwroot path (e.g. /uploads/image.png)
            if (imageSource.StartsWith("/") || imageSource.StartsWith("\\"))
            {
                var localPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", imageSource.TrimStart('/', '\\'));
                if (File.Exists(localPath))
                {
                    return File.ReadAllBytes(localPath);
                }
            }

            // 3. Check if direct file path
            if (File.Exists(imageSource))
            {
                return File.ReadAllBytes(imageSource);
            }

            // 4. Check if raw Base64 string without data prefix
            if (imageSource.Length > 100 && !imageSource.Contains(' ') && !imageSource.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                return Convert.FromBase64String(imageSource);
            }
        }
        catch
        {
            // Ignore format/loading errors gracefully to prevent report crash
        }

        return null;
    }
}
