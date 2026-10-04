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
public class PatientsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public PatientsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<PatientDto>>> GetPatients([FromQuery] string? search)
    {
        var query = _context.Patients.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            var digitsOnly = new string(search.Where(char.IsDigit).ToArray());

            if (!string.IsNullOrEmpty(digitsOnly) && digitsOnly.Length >= 3)
            {
                query = query.Where(p => p.FullName.ToLower().Contains(s) ||
                                         p.Uhid.ToLower().Contains(s) ||
                                         (p.Phone != null && (p.Phone.Contains(s) || 
                                                              p.Phone.Replace(" ", "").Replace("-", "").Replace("+91", "").Contains(digitsOnly))));
            }
            else
            {
                query = query.Where(p => p.FullName.ToLower().Contains(s) ||
                                         p.Uhid.ToLower().Contains(s) ||
                                         (p.Phone != null && p.Phone.Contains(s)));
            }
        }

        var list = await query
            .OrderByDescending(p => p.CreatedAt)
            .Take(50)
            .Select(p => new PatientDto(
                p.Id,
                p.Uhid,
                p.FullName,
                p.Gender,
                p.AgeYears,
                p.AgeMonths,
                p.AgeDays,
                p.Phone,
                p.Email,
                p.Address,
                p.BloodGroup
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PatientDto>> GetPatient(Guid id)
    {
        var p = await _context.Patients.FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();

        return Ok(new PatientDto(
            p.Id,
            p.Uhid,
            p.FullName,
            p.Gender,
            p.AgeYears,
            p.AgeMonths,
            p.AgeDays,
            p.Phone,
            p.Email,
            p.Address,
            p.BloodGroup
        ));
    }

    [HttpPost]
    public async Task<ActionResult<PatientDto>> CreatePatient([FromBody] CreatePatientDto dto)
    {
        var count = await _context.Patients.CountAsync() + 1;
        var uhid = $"PAT-{DateTime.UtcNow:yyyy}-{count:D4}";

        var patient = new Patient
        {
            Uhid = uhid,
            FullName = dto.FullName,
            Gender = dto.Gender,
            AgeYears = dto.AgeYears,
            AgeMonths = dto.AgeMonths,
            AgeDays = dto.AgeDays,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            BloodGroup = dto.BloodGroup
        };

        await _context.Patients.AddAsync(patient);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPatient), new { id = patient.Id }, new PatientDto(
            patient.Id,
            patient.Uhid,
            patient.FullName,
            patient.Gender,
            patient.AgeYears,
            patient.AgeMonths,
            patient.AgeDays,
            patient.Phone,
            patient.Email,
            patient.Address,
            patient.BloodGroup
        ));
    }
}
