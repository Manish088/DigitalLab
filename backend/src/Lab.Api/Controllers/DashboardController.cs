using Lab.Application.Common.Interfaces;
using Lab.Application.DTOs;
using Lab.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public DashboardController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var today = DateTime.UtcNow.Date;
        var startOfMonth = new DateTime(today.Year, today.Month, 1);

        var totalPatients = await _context.Patients.CountAsync();
        var todayCases = await _context.CaseOrders.CountAsync(c => c.OrderDate >= today);
        var pendingTests = await _context.CaseOrders.CountAsync(c => c.Status == CaseStatus.Registered || c.Status == CaseStatus.SampleCollected || c.Status == CaseStatus.InProgress);
        var completedReports = await _context.CaseOrders.CountAsync(c => c.Status == CaseStatus.Completed);
        var approvedReports = await _context.CaseOrders.CountAsync(c => c.Status == CaseStatus.Approved);

        var todayCollection = await _context.PaymentTransactions
            .Where(t => t.TransactionDate >= today)
            .SumAsync(t => (decimal?)t.Amount) ?? 0;

        var monthlyRevenue = await _context.PaymentTransactions
            .Where(t => t.TransactionDate >= startOfMonth)
            .SumAsync(t => (decimal?)t.Amount) ?? 0;

        var totalPendingDues = await _context.CaseOrders
            .Where(c => c.PaymentStatus != PaymentStatus.Paid)
            .SumAsync(c => (decimal?)c.DueAmount) ?? 0;

        var totalDoctors = await _context.Doctors.CountAsync(d => d.IsActive);
        var totalAgents = await _context.CollectionAgents.CountAsync(a => a.IsActive);

        // 7 Days Revenue Trend
        var revenueTrend = new List<DailyRevenueDto>();
        for (int i = 6; i >= 0; i--)
        {
            var day = today.AddDays(-i);
            var nextDay = day.AddDays(1);
            var dayRevenue = await _context.PaymentTransactions
                .Where(t => t.TransactionDate >= day && t.TransactionDate < nextDay)
                .SumAsync(t => (decimal?)t.Amount) ?? 0;

            var dayCases = await _context.CaseOrders
                .CountAsync(c => c.OrderDate >= day && c.OrderDate < nextDay);

            revenueTrend.Add(new DailyRevenueDto(day.ToString("dd MMM"), dayRevenue, dayCases));
        }

        // Recent 5 Cases
        var recentCases = await _context.CaseOrders
            .Include(c => c.Patient)
            .OrderByDescending(c => c.OrderDate)
            .Take(5)
            .Select(c => new RecentCaseItemDto(
                c.Id,
                c.CaseNumber,
                c.Barcode,
                c.Patient.FullName,
                c.Patient.Phone ?? "N/A",
                c.NetAmount,
                c.DueAmount,
                c.Status.ToString(),
                c.PaymentStatus.ToString(),
                c.OrderDate
            ))
            .ToListAsync();

        return Ok(new DashboardStatsDto(
            totalPatients,
            todayCases,
            pendingTests,
            completedReports,
            approvedReports,
            todayCollection,
            monthlyRevenue,
            totalPendingDues,
            totalDoctors,
            totalAgents,
            revenueTrend,
            recentCases
        ));
    }
}
