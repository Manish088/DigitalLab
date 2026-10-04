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
public class CasesController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IBarcodeService _barcodeService;
    private readonly ICurrentUserService _currentUserService;

    public CasesController(
        IApplicationDbContext context,
        IBarcodeService barcodeService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _barcodeService = barcodeService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetCases(
        [FromQuery] string? search,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] Guid? doctorId,
        [FromQuery] CaseStatus? status,
        [FromQuery] PaymentStatus? paymentStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.CaseOrders
            .Include(c => c.Patient)
            .Include(c => c.ReferringDoctor)
            .Include(c => c.Items).ThenInclude(i => i.Test)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => c.CaseNumber.ToLower().Contains(s) ||
                                     c.Barcode.ToLower().Contains(s) ||
                                     c.Patient.FullName.ToLower().Contains(s) ||
                                     (c.Patient.Phone != null && c.Patient.Phone.Contains(s)));
        }

        if (fromDate.HasValue)
            query = query.Where(c => c.OrderDate >= fromDate.Value.Date);

        if (toDate.HasValue)
            query = query.Where(c => c.OrderDate <= toDate.Value.Date.AddDays(1).AddTicks(-1));

        if (doctorId.HasValue)
            query = query.Where(c => c.ReferringDoctorId == doctorId.Value);

        if (status.HasValue)
            query = query.Where(c => c.Status == status.Value);

        if (paymentStatus.HasValue)
            query = query.Where(c => c.PaymentStatus == paymentStatus.Value);

        var totalCount = await query.CountAsync();

        var list = await query
            .OrderByDescending(c => c.OrderDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new
            {
                c.Id,
                c.CaseNumber,
                c.Barcode,
                c.PatientId,
                PatientName = c.Patient.FullName,
                PatientAgeGender = $"{c.Patient.AgeYears} Y / {c.Patient.Gender}",
                PatientPhone = c.Patient.Phone,
                DoctorName = c.ReferringDoctor != null ? c.ReferringDoctor.DoctorName : "Direct",
                c.OrderDate,
                Status = c.Status.ToString(),
                c.TotalAmount,
                c.DiscountAmount,
                c.NetAmount,
                c.PaidAmount,
                c.DueAmount,
                PaymentStatus = c.PaymentStatus.ToString(),
                c.PublicAccessToken,
                TestsCount = c.Items.Count,
                TestsSummary = string.Join(", ", c.Items.Select(i => i.Test.TestName)),
                TestNames = c.Items.Select(i => i.Test.TestName).ToList()
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            items = list
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CaseOrderDto>> GetCase(Guid id)
    {
        var c = await _context.CaseOrders
            .Include(x => x.Patient)
            .Include(x => x.ReferringDoctor)
            .Include(x => x.CollectionAgent)
            .Include(x => x.Items)
                .ThenInclude(i => i.Test)
                    .ThenInclude(t => t.Category)
            .Include(x => x.Items)
                .ThenInclude(i => i.Results)
            .Include(x => x.Transactions)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (c == null) return NotFound();

        var dto = new CaseOrderDto(
            c.Id,
            c.TenantId,
            c.CaseNumber,
            c.Barcode,
            c.PatientId,
            new PatientDto(c.Patient.Id, c.Patient.Uhid, c.Patient.FullName, c.Patient.Gender, c.Patient.AgeYears, c.Patient.AgeMonths, c.Patient.AgeDays, c.Patient.Phone, c.Patient.Email, c.Patient.Address, c.Patient.BloodGroup),
            c.ReferringDoctorId,
            c.ReferringDoctor?.DoctorName,
            c.CollectionAgentId,
            c.CollectionAgent?.AgentName,
            c.OrderDate,
            c.SampleCollectedDate,
            c.ReportingDate,
            c.Priority,
            c.Status,
            c.TotalAmount,
            c.DiscountAmount,
            c.DiscountPercent,
            c.DiscountReason,
            c.TaxAmount,
            c.NetAmount,
            c.PaidAmount,
            c.DueAmount,
            c.PaymentStatus,
            c.PublicAccessToken,
            c.ApprovedByName,
            c.ApprovedAt,
            c.Items.Select(i => new CaseOrderItemDto(
                i.Id,
                i.TestId,
                i.Test.TestCode,
                i.Test.TestName,
                i.Test.Category?.CategoryName,
                i.Test.SampleType,
                i.Test.ContainerVialType,
                i.ItemPrice,
                i.NetAmount,
                i.Status,
                i.PathologistRemarks,
                i.InterpretationNote,
                i.Results.OrderBy(r => r.DisplayOrder).Select(r => new TestResultValueDto(
                    r.Id,
                    r.ParameterId,
                    r.ParameterName,
                    r.ResultValue,
                    r.Unit,
                    r.NormalRangeText,
                    r.NumericValue,
                    r.Flag,
                    r.IsAbnormal,
                    r.IsCriticalPanic,
                    r.Remarks,
                    r.DisplayOrder
                )).ToList()
            )).ToList(),
            c.Transactions.OrderByDescending(t => t.TransactionDate).Select(t => new PaymentTransactionDto(
                t.Id,
                t.TransactionNumber,
                t.TransactionDate,
                t.Amount,
                t.PaymentMethod,
                t.ReferenceNumber,
                t.ReceivedByName,
                t.Remarks
            )).ToList()
        );

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<CaseOrderDto>> CreateCase([FromBody] CreateCaseOrderDto dto)
    {
        try
        {
            Guid patientId;

            // 1. Resolve Patient
            if (dto.PatientId.HasValue && dto.PatientId != Guid.Empty)
            {
                patientId = dto.PatientId.Value;
                if (dto.NewPatient != null)
                {
                    var existingPatient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == patientId);
                    if (existingPatient != null)
                    {
                        if (!string.IsNullOrWhiteSpace(dto.NewPatient.FullName))
                            existingPatient.FullName = dto.NewPatient.FullName.Trim();
                        existingPatient.Gender = dto.NewPatient.Gender;
                        existingPatient.AgeYears = dto.NewPatient.AgeYears;
                        existingPatient.AgeMonths = dto.NewPatient.AgeMonths;
                        existingPatient.AgeDays = dto.NewPatient.AgeDays;
                        if (!string.IsNullOrWhiteSpace(dto.NewPatient.Phone))
                            existingPatient.Phone = dto.NewPatient.Phone.Trim();
                        if (!string.IsNullOrWhiteSpace(dto.NewPatient.Address))
                            existingPatient.Address = dto.NewPatient.Address.Trim();
                        if (!string.IsNullOrWhiteSpace(dto.NewPatient.BloodGroup))
                            existingPatient.BloodGroup = dto.NewPatient.BloodGroup.Trim();

                        await _context.SaveChangesAsync();
                    }
                }
            }
            else if (dto.NewPatient != null)
            {
                var pCount = await _context.Patients.IgnoreQueryFilters().CountAsync() + 1;
                var uhid = $"PAT-{DateTime.UtcNow:yyyy}-{pCount:D4}";
                while (await _context.Patients.IgnoreQueryFilters().AnyAsync(p => p.Uhid == uhid))
                {
                    pCount++;
                    uhid = $"PAT-{DateTime.UtcNow:yyyy}-{pCount:D4}";
                }

                var newPatient = new Patient
                {
                    Uhid = uhid,
                    FullName = dto.NewPatient.FullName?.Trim() ?? "Unknown",
                    Gender = dto.NewPatient.Gender,
                    AgeYears = dto.NewPatient.AgeYears,
                    AgeMonths = dto.NewPatient.AgeMonths,
                    AgeDays = dto.NewPatient.AgeDays,
                    Phone = dto.NewPatient.Phone?.Trim(),
                    Email = dto.NewPatient.Email?.Trim(),
                    Address = dto.NewPatient.Address?.Trim(),
                    BloodGroup = dto.NewPatient.BloodGroup
                };
                await _context.Patients.AddAsync(newPatient);
                await _context.SaveChangesAsync();
                patientId = newPatient.Id;
            }
            else
            {
                return BadRequest(new { message = "Patient information is required." });
            }

            // 2. Fetch Selected Tests
            if (dto.SelectedTestIds == null || dto.SelectedTestIds.Count == 0)
                return BadRequest(new { message = "At least one test must be selected." });

            var tests = await _context.Tests
                .Include(t => t.Parameters).ThenInclude(p => p.NormalRanges)
                .Where(t => dto.SelectedTestIds.Contains(t.Id))
                .ToListAsync();

            if (tests.Count == 0)
                return BadRequest(new { message = "Selected tests could not be found." });

            var totalAmount = Math.Round(tests.Sum(t => t.Price), 2);
            var discountPercent = Math.Round(dto.DiscountPercent, 2);
            var discountAmount = dto.DiscountAmount > 0
                ? Math.Round(dto.DiscountAmount, 2)
                : (discountPercent > 0 ? Math.Round(totalAmount * discountPercent / 100m, 2) : 0m);

            if (discountAmount > totalAmount) discountAmount = totalAmount;

            var netAmount = Math.Max(0m, Math.Round(totalAmount - discountAmount, 2));
            var paidAmount = Math.Min(Math.Round(dto.PaidAmount, 2), netAmount);
            var dueAmount = Math.Max(0m, Math.Round(netAmount - paidAmount, 2));

            var paymentStatus = dueAmount <= 0
                ? PaymentStatus.Paid
                : (paidAmount > 0 ? PaymentStatus.Partial : PaymentStatus.Unpaid);

            // Case Number & Barcode
            var caseCount = await _context.CaseOrders.IgnoreQueryFilters().CountAsync() + 101;
            var caseNumber = $"LS-{DateTime.UtcNow:yyyy}-{caseCount:D5}";
            var barcode = $"{DateTime.UtcNow:yy}{caseCount:D5}";
            while (await _context.CaseOrders.IgnoreQueryFilters().AnyAsync(c => c.CaseNumber == caseNumber || c.Barcode == barcode))
            {
                caseCount++;
                caseNumber = $"LS-{DateTime.UtcNow:yyyy}-{caseCount:D5}";
                barcode = $"{DateTime.UtcNow:yy}{caseCount:D5}";
            }

            // Doctor Commission calculation
            decimal doctorCommission = 0;
            var validDoctorId = (dto.ReferringDoctorId.HasValue && dto.ReferringDoctorId.Value != Guid.Empty) ? dto.ReferringDoctorId : null;
            if (validDoctorId.HasValue)
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == validDoctorId.Value);
                if (doctor != null && doctor.DefaultCommissionValue > 0)
                {
                    doctorCommission = doctor.CommissionType == CommissionType.Percentage
                        ? Math.Round(netAmount * doctor.DefaultCommissionValue / 100m, 2)
                        : Math.Round(doctor.DefaultCommissionValue, 2);
                }
            }

            // Collection Agent Commission calculation
            decimal agentCommission = 0;
            var validAgentId = (dto.CollectionAgentId.HasValue && dto.CollectionAgentId.Value != Guid.Empty) ? dto.CollectionAgentId : null;
            if (validAgentId.HasValue)
            {
                var agent = await _context.CollectionAgents.FirstOrDefaultAsync(a => a.Id == validAgentId.Value);
                if (agent != null && agent.CommissionPercent > 0)
                {
                    agentCommission = Math.Round(netAmount * agent.CommissionPercent / 100m, 2);
                }
            }

            var caseOrder = new CaseOrder
            {
                CaseNumber = caseNumber,
                Barcode = barcode,
                PatientId = patientId,
                ReferringDoctorId = validDoctorId,
                CollectionAgentId = validAgentId,
                OrderDate = DateTime.UtcNow,
                Priority = dto.Priority,
                Status = CaseStatus.Registered,
                TotalAmount = totalAmount,
                DiscountPercent = discountPercent,
                DiscountAmount = discountAmount,
                DiscountReason = dto.DiscountReason,
                NetAmount = netAmount,
                PaidAmount = paidAmount,
                DueAmount = dueAmount,
                PaymentStatus = paymentStatus,
                DoctorCommissionAmount = doctorCommission,
                AgentCommissionAmount = agentCommission,
                ClinicalNotes = dto.Notes
            };

            await _context.CaseOrders.AddAsync(caseOrder);
            await _context.SaveChangesAsync();

            // 3. Create Case Order Items & Initialize Parameter Result Placeholders
            var patientObj = await _context.Patients.IgnoreQueryFilters().FirstAsync(p => p.Id == patientId);

            foreach (var test in tests)
            {
                var itemDiscount = totalAmount > 0 ? Math.Round(discountAmount * (test.Price / totalAmount), 2) : 0m;
                var itemNet = Math.Max(0m, Math.Round(test.Price - itemDiscount, 2));

                var orderItem = new CaseOrderItem
                {
                    CaseOrderId = caseOrder.Id,
                    TestId = test.Id,
                    ItemPrice = Math.Round(test.Price, 2),
                    DiscountAmount = itemDiscount,
                    NetAmount = itemNet,
                    Status = ItemResultStatus.Pending
                };
                await _context.CaseOrderItems.AddAsync(orderItem);
                await _context.SaveChangesAsync();

                // Populate parameters for this test
                foreach (var param in test.Parameters.OrderBy(p => p.DisplayOrder))
                {
                    // Auto match normal range for patient gender and age
                    var matchedRange = param.NormalRanges.FirstOrDefault(r =>
                        (r.ApplicableGender == Gender.Both || r.ApplicableGender == patientObj.Gender) &&
                        patientObj.AgeYears * 365 >= r.MinAgeDays &&
                        patientObj.AgeYears * 365 <= r.MaxAgeDays);

                    var rangeText = matchedRange?.TextualRange ??
                                    (matchedRange?.MinNormalValue.HasValue == true && matchedRange?.MaxNormalValue.HasValue == true
                                        ? $"{matchedRange.MinNormalValue} - {matchedRange.MaxNormalValue} {param.Unit}"
                                        : null);

                    var resVal = new TestResultValue
                    {
                        CaseOrderItemId = orderItem.Id,
                        ParameterId = param.Id,
                        ParameterName = param.ParameterName,
                        Unit = param.Unit,
                        NormalRangeText = rangeText,
                        ResultValue = param.DefaultValue,
                        DisplayOrder = param.DisplayOrder
                    };
                    await _context.TestResultValues.AddAsync(resVal);
                }
            }

            // 4. Record Initial Payment Transaction if Paid > 0
            if (paidAmount > 0)
            {
                var txCount = await _context.PaymentTransactions.IgnoreQueryFilters().CountAsync() + 1;
                var txNum = $"TXN-{DateTime.UtcNow:yyyyMM}-{txCount:D4}";
                while (await _context.PaymentTransactions.IgnoreQueryFilters().AnyAsync(p => p.TransactionNumber == txNum))
                {
                    txCount++;
                    txNum = $"TXN-{DateTime.UtcNow:yyyyMM}-{txCount:D4}";
                }

                var tx = new PaymentTransaction
                {
                    CaseOrderId = caseOrder.Id,
                    TransactionNumber = txNum,
                    TransactionDate = DateTime.UtcNow,
                    Amount = paidAmount,
                    PaymentMethod = dto.PaymentMethod,
                    ReferenceNumber = dto.TransactionRef,
                    ReceivedByName = _currentUserService.FullName ?? "Reception Desk",
                    Remarks = "Advance / Initial Payment at Case Registration"
                };
                await _context.PaymentTransactions.AddAsync(tx);
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCase), new { id = caseOrder.Id }, await GetCaseDtoById(caseOrder.Id));
        }
        catch (Exception ex)
        {
            var detailedMsg = ex.InnerException != null ? $"{ex.Message} --> {ex.InnerException.Message}" : ex.Message;
            Console.WriteLine($"[CaseOrder Error] {detailedMsg}\n{ex.StackTrace}");
            return StatusCode(500, new { message = detailedMsg });
        }
    }

    [HttpPost("{id}/settle-due")]
    public async Task<IActionResult> SettleDue(Guid id, [FromBody] SettleDuePaymentDto dto)
    {
        var caseOrder = await _context.CaseOrders.FirstOrDefaultAsync(c => c.Id == id);
        if (caseOrder == null) return NotFound();

        if (dto.Amount <= 0)
            return BadRequest(new { message = "Amount must be greater than zero." });

        if (dto.Amount > caseOrder.DueAmount)
            return BadRequest(new { message = $"Amount cannot exceed pending due of ₹{caseOrder.DueAmount:N2}." });

        caseOrder.PaidAmount += dto.Amount;
        caseOrder.DueAmount -= dto.Amount;
        caseOrder.PaymentStatus = caseOrder.DueAmount <= 0 ? PaymentStatus.Paid : PaymentStatus.Partial;

        var txCount = await _context.PaymentTransactions.CountAsync() + 1;
        var tx = new PaymentTransaction
        {
            CaseOrderId = caseOrder.Id,
            TransactionNumber = $"TXN-{DateTime.UtcNow:yyyyMM}-{txCount:D4}",
            TransactionDate = DateTime.UtcNow,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            ReferenceNumber = dto.ReferenceNumber,
            ReceivedByName = _currentUserService.FullName ?? "Cashier",
            Remarks = dto.Remarks ?? "Due Settlement Payment"
        };
        await _context.PaymentTransactions.AddAsync(tx);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Due payment recorded successfully.", caseOrder.PaidAmount, caseOrder.DueAmount, PaymentStatus = caseOrder.PaymentStatus.ToString() });
    }

    [HttpPost("{id}/add-tests")]
    public async Task<IActionResult> AddTestsToCase(Guid id, [FromBody] AddTestsToCaseDto dto)
    {
        try
        {
            var caseOrder = await _context.CaseOrders
                .Include(c => c.Patient)
                .Include(c => c.Items).ThenInclude(i => i.Test)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (caseOrder == null) return NotFound(new { message = "Case order not found." });

            if (caseOrder.Status == CaseStatus.Approved)
                return BadRequest(new { message = "Cannot add tests to an already approved and verified case report." });

            if (dto.TestIds == null || dto.TestIds.Count == 0)
                return BadRequest(new { message = "Please select at least one test to add." });

            var existingTestIds = caseOrder.Items.Select(i => i.TestId).ToHashSet();
            var newTestIds = dto.TestIds.Where(tid => !existingTestIds.Contains(tid)).Distinct().ToList();

            if (newTestIds.Count == 0)
                return BadRequest(new { message = "All selected tests are already added to this case order." });

            var testsToAdd = await _context.Tests
                .Include(t => t.Parameters).ThenInclude(p => p.NormalRanges)
                .Where(t => newTestIds.Contains(t.Id))
                .ToListAsync();

            if (testsToAdd.Count == 0)
                return BadRequest(new { message = "Selected tests could not be found." });

            var patientObj = caseOrder.Patient;
            decimal additionalGross = 0;

            foreach (var test in testsToAdd)
            {
                var itemDiscount = 0m;
                var itemNet = Math.Max(0m, Math.Round(test.Price - itemDiscount, 2));

                var orderItem = new CaseOrderItem
                {
                    CaseOrderId = caseOrder.Id,
                    TestId = test.Id,
                    ItemPrice = Math.Round(test.Price, 2),
                    DiscountAmount = itemDiscount,
                    NetAmount = itemNet,
                    Status = ItemResultStatus.Pending
                };
                await _context.CaseOrderItems.AddAsync(orderItem);
                await _context.SaveChangesAsync();

                additionalGross += test.Price;

                foreach (var param in test.Parameters.OrderBy(p => p.DisplayOrder))
                {
                    var matchedRange = param.NormalRanges.FirstOrDefault(r =>
                        (r.ApplicableGender == Gender.Both || r.ApplicableGender == patientObj.Gender) &&
                        patientObj.AgeYears * 365 >= r.MinAgeDays &&
                        patientObj.AgeYears * 365 <= r.MaxAgeDays);

                    var rangeText = matchedRange?.TextualRange ??
                                    (matchedRange?.MinNormalValue.HasValue == true && matchedRange?.MaxNormalValue.HasValue == true
                                        ? $"{matchedRange.MinNormalValue} - {matchedRange.MaxNormalValue} {param.Unit}"
                                        : null);

                    var resVal = new TestResultValue
                    {
                        CaseOrderItemId = orderItem.Id,
                        ParameterId = param.Id,
                        ParameterName = param.ParameterName,
                        Unit = param.Unit,
                        NormalRangeText = rangeText,
                        ResultValue = param.DefaultValue,
                        DisplayOrder = param.DisplayOrder
                    };
                    await _context.TestResultValues.AddAsync(resVal);
                }
            }

            // Update Financials
            caseOrder.TotalAmount += Math.Round(additionalGross, 2);
            if (dto.AdditionalDiscountAmount > 0)
            {
                caseOrder.DiscountAmount += Math.Round(dto.AdditionalDiscountAmount, 2);
            }
            caseOrder.NetAmount = Math.Max(0m, Math.Round(caseOrder.TotalAmount - caseOrder.DiscountAmount, 2));

            if (dto.AdditionalPaidAmount > 0)
            {
                var cleanPaid = Math.Round(dto.AdditionalPaidAmount, 2);
                caseOrder.PaidAmount += cleanPaid;

                var txCount = await _context.PaymentTransactions.IgnoreQueryFilters().CountAsync() + 1;
                var txNum = $"TXN-{DateTime.UtcNow:yyyyMM}-{txCount:D4}";
                while (await _context.PaymentTransactions.IgnoreQueryFilters().AnyAsync(p => p.TransactionNumber == txNum))
                {
                    txCount++;
                    txNum = $"TXN-{DateTime.UtcNow:yyyyMM}-{txCount:D4}";
                }

                var tx = new PaymentTransaction
                {
                    CaseOrderId = caseOrder.Id,
                    TransactionNumber = txNum,
                    TransactionDate = DateTime.UtcNow,
                    Amount = cleanPaid,
                    PaymentMethod = dto.PaymentMethod,
                    ReferenceNumber = dto.TransactionRef,
                    ReceivedByName = _currentUserService.FullName ?? "Reception Desk",
                    Remarks = $"Payment for added tests: {string.Join(", ", testsToAdd.Select(t => t.TestName))}"
                };
                await _context.PaymentTransactions.AddAsync(tx);
            }

            caseOrder.DueAmount = Math.Max(0m, Math.Round(caseOrder.NetAmount - caseOrder.PaidAmount, 2));
            caseOrder.PaymentStatus = caseOrder.DueAmount <= 0 ? PaymentStatus.Paid : (caseOrder.PaidAmount > 0 ? PaymentStatus.Partial : PaymentStatus.Unpaid);

            // Revert Completed status back to InProgress if new tests are added
            if (caseOrder.Status == CaseStatus.Completed)
            {
                caseOrder.Status = CaseStatus.InProgress;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"{testsToAdd.Count} test(s) added successfully to case {caseOrder.CaseNumber}.",
                caseOrderId = caseOrder.Id,
                caseOrder.TotalAmount,
                caseOrder.DiscountAmount,
                caseOrder.NetAmount,
                caseOrder.PaidAmount,
                caseOrder.DueAmount,
                PaymentStatus = caseOrder.PaymentStatus.ToString(),
                Status = caseOrder.Status.ToString()
            });
        }
        catch (Exception ex)
        {
            var detailedMsg = ex.InnerException != null ? $"{ex.Message} --> {ex.InnerException.Message}" : ex.Message;
            return StatusCode(500, new { message = detailedMsg });
        }
    }

    [HttpDelete("{id}/items/{itemId}")]
    public async Task<IActionResult> RemoveTestFromCase(Guid id, Guid itemId)
    {
        try
        {
            var caseOrder = await _context.CaseOrders
                .Include(c => c.Items).ThenInclude(i => i.Test)
                .Include(c => c.Items).ThenInclude(i => i.Results)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (caseOrder == null) return NotFound(new { message = "Case order not found." });

            if (caseOrder.Status == CaseStatus.Approved)
                return BadRequest(new { message = "Cannot modify or remove tests from an already approved case report." });

            if (caseOrder.Items.Count <= 1)
                return BadRequest(new { message = "A case must have at least one test. You cannot remove all tests from a case." });

            var itemToRemove = caseOrder.Items.FirstOrDefault(i => i.Id == itemId);
            if (itemToRemove == null) return NotFound(new { message = "Test item not found in this case." });

            var removedPrice = itemToRemove.ItemPrice;

            // Remove results & item
            _context.TestResultValues.RemoveRange(itemToRemove.Results);
            _context.CaseOrderItems.Remove(itemToRemove);

            // Recalculate financials
            caseOrder.TotalAmount = Math.Max(0m, Math.Round(caseOrder.TotalAmount - removedPrice, 2));
            if (caseOrder.DiscountAmount > caseOrder.TotalAmount)
                caseOrder.DiscountAmount = caseOrder.TotalAmount;
            caseOrder.NetAmount = Math.Max(0m, Math.Round(caseOrder.TotalAmount - caseOrder.DiscountAmount, 2));
            caseOrder.DueAmount = Math.Max(0m, Math.Round(caseOrder.NetAmount - caseOrder.PaidAmount, 2));
            caseOrder.PaymentStatus = caseOrder.DueAmount <= 0 ? PaymentStatus.Paid : (caseOrder.PaidAmount > 0 ? PaymentStatus.Partial : PaymentStatus.Unpaid);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Test {itemToRemove.Test?.TestName ?? "Investigation"} removed from case.",
                caseOrder.TotalAmount,
                caseOrder.NetAmount,
                caseOrder.PaidAmount,
                caseOrder.DueAmount,
                PaymentStatus = caseOrder.PaymentStatus.ToString()
            });
        }
        catch (Exception ex)
        {
            var detailedMsg = ex.InnerException != null ? $"{ex.Message} --> {ex.InnerException.Message}" : ex.Message;
            return StatusCode(500, new { message = detailedMsg });
        }
    }

    [AllowAnonymous]
    [HttpGet("{id}/barcode-svg")]
    public async Task<IActionResult> GetBarcodeSvg(Guid id)
    {
        var caseOrder = await _context.CaseOrders.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == id);
        if (caseOrder == null) return NotFound();

        var svg = _barcodeService.GenerateCode39Svg(caseOrder.Barcode);
        return Content(svg, "image/svg+xml");
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] CaseStatus status)
    {
        var caseOrder = await _context.CaseOrders.FirstOrDefaultAsync(c => c.Id == id);
        if (caseOrder == null) return NotFound();

        caseOrder.Status = status;
        if (status == CaseStatus.SampleCollected && !caseOrder.SampleCollectedDate.HasValue)
            caseOrder.SampleCollectedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Case status updated.", status = status.ToString() });
    }

    private async Task<CaseOrderDto> GetCaseDtoById(Guid id)
    {
        var res = await GetCase(id);
        return (CaseOrderDto)((OkObjectResult)res.Result!).Value!;
    }
}
