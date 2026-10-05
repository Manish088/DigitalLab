using Lab.Application.Common.Interfaces;
using Lab.Application.DTOs;
using Lab.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public DoctorsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<DoctorReferralDto>>> GetDoctors([FromQuery] string? search)
    {
        var query = _context.Doctors
            .Include(d => d.CaseOrders)
            .Include(d => d.Payouts)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(d => d.DoctorName.ToLower().Contains(s) ||
                                     d.DoctorCode.ToLower().Contains(s) ||
                                     (d.ClinicHospitalName != null && d.ClinicHospitalName.ToLower().Contains(s)));
        }

        var list = await query
            .OrderBy(d => d.DoctorName)
            .Select(d => new DoctorReferralDto(
                d.Id,
                d.DoctorCode,
                d.DoctorName,
                d.Degree,
                d.Specialization,
                d.RegistrationNumber,
                d.ClinicHospitalName,
                d.Phone,
                d.Email,
                d.Address,
                d.CommissionType,
                d.DefaultCommissionValue,
                d.IsActive,
                d.CaseOrders.Count,
                d.CaseOrders.Sum(c => c.NetAmount),
                d.CaseOrders.Sum(c => c.DoctorCommissionAmount),
                d.Payouts.Sum(p => p.PaidAmount),
                d.CaseOrders.Sum(c => c.DoctorCommissionAmount) - d.Payouts.Sum(p => p.PaidAmount)
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<DoctorReferralDto>> CreateDoctor([FromBody] CreateDoctorReferralDto dto)
    {
        var doc = new DoctorReferral
        {
            DoctorCode = dto.DoctorCode,
            DoctorName = dto.DoctorName,
            Degree = dto.Degree,
            Specialization = dto.Specialization,
            RegistrationNumber = dto.RegistrationNumber,
            ClinicHospitalName = dto.ClinicHospitalName,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            CommissionType = dto.CommissionType,
            DefaultCommissionValue = dto.DefaultCommissionValue,
            IsActive = true
        };

        await _context.Doctors.AddAsync(doc);
        await _context.SaveChangesAsync();

        return Ok(new DoctorReferralDto(
            doc.Id, doc.DoctorCode, doc.DoctorName, doc.Degree, doc.Specialization, doc.RegistrationNumber,
            doc.ClinicHospitalName, doc.Phone, doc.Email, doc.Address, doc.CommissionType, doc.DefaultCommissionValue,
            doc.IsActive, 0, 0, 0, 0, 0
        ));
    }

    [HttpGet("payouts")]
    public async Task<ActionResult<List<DoctorPayoutRecordDto>>> GetPayouts([FromQuery] Guid? doctorId)
    {
        var query = _context.DoctorCommissionPayouts
            .Include(p => p.Doctor)
                .ThenInclude(d => d.CaseOrders)
            .Include(p => p.Doctor)
                .ThenInclude(d => d.Payouts)
            .AsQueryable();

        if (doctorId.HasValue && doctorId.Value != Guid.Empty)
        {
            query = query.Where(p => p.DoctorId == doctorId.Value);
        }

        var list = await query
            .OrderByDescending(p => p.PayoutDate)
            .Select(p => new DoctorPayoutRecordDto(
                p.Id,
                p.DoctorId,
                p.Doctor.DoctorName,
                p.Doctor.DoctorCode,
                p.Doctor.Degree,
                p.Doctor.Specialization,
                p.Doctor.ClinicHospitalName,
                p.Doctor.Phone,
                p.PayoutNumber,
                p.PayoutDate,
                p.PeriodStartDate,
                p.PeriodEndDate,
                p.Doctor.CaseOrders.Count,
                p.Doctor.CaseOrders.Sum(c => c.NetAmount),
                p.Doctor.CaseOrders.Sum(c => c.DoctorCommissionAmount),
                p.PaidAmount,
                p.Doctor.CaseOrders.Sum(c => c.DoctorCommissionAmount) - p.Doctor.Payouts.Sum(x => x.PaidAmount),
                p.PaymentMethod,
                p.TransactionReference,
                p.Remarks
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost("payout")]
    public async Task<IActionResult> RecordPayout([FromBody] DoctorPayoutRequest dto)
    {
        var doctor = await _context.Doctors
            .Include(d => d.CaseOrders)
            .Include(d => d.Payouts)
            .FirstOrDefaultAsync(d => d.Id == dto.DoctorId);
        if (doctor == null) return NotFound("Doctor not found");

        var payoutCount = await _context.DoctorCommissionPayouts.CountAsync() + 1;
        var totalCases = doctor.CaseOrders.Count;
        var totalBilling = doctor.CaseOrders.Sum(c => c.NetAmount);
        var totalCommission = doctor.CaseOrders.Sum(c => c.DoctorCommissionAmount);
        var totalPaidBefore = doctor.Payouts.Sum(p => p.PaidAmount);

        var payout = new DoctorCommissionPayout
        {
            DoctorId = dto.DoctorId,
            PayoutNumber = $"VCHR-DOC-{DateTime.UtcNow:yyyyMM}-{payoutCount:D4}",
            PayoutDate = DateTime.UtcNow,
            PeriodStartDate = dto.PeriodStartDate == default ? DateTime.UtcNow.AddMonths(-1) : dto.PeriodStartDate,
            PeriodEndDate = dto.PeriodEndDate == default ? DateTime.UtcNow : dto.PeriodEndDate,
            TotalCasesCount = totalCases,
            TotalBillingVolume = totalBilling,
            CommissionAmount = totalCommission,
            PaidAmount = dto.PaidAmount,
            PaymentMethod = dto.PaymentMethod,
            TransactionReference = dto.TransactionReference,
            Remarks = dto.Remarks
        };

        await _context.DoctorCommissionPayouts.AddAsync(payout);
        await _context.SaveChangesAsync();

        var remainingDue = totalCommission - (totalPaidBefore + dto.PaidAmount);

        var resultDto = new DoctorPayoutRecordDto(
            payout.Id,
            doctor.Id,
            doctor.DoctorName,
            doctor.DoctorCode,
            doctor.Degree,
            doctor.Specialization,
            doctor.ClinicHospitalName,
            doctor.Phone,
            payout.PayoutNumber,
            payout.PayoutDate,
            payout.PeriodStartDate,
            payout.PeriodEndDate,
            totalCases,
            totalBilling,
            totalCommission,
            payout.PaidAmount,
            remainingDue,
            payout.PaymentMethod,
            payout.TransactionReference,
            payout.Remarks
        );

        return Ok(resultDto);
    }
}

