using Lab.Application.Common.Interfaces;
using Lab.Application.DTOs;
using Lab.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[Authorize(Roles = "SuperAdmin")]
[ApiController]
[Route("api/[controller]")]
public class AdCampaignsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public AdCampaignsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<AdCampaignDto>>> GetCampaigns()
    {
        var now = DateTime.UtcNow;
        var campaigns = await _context.AdCampaigns
            .Include(c => c.TargetLabs)
                .ThenInclude(tl => tl.Tenant)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var dtos = campaigns.Select(c =>
        {
            var isExpired = c.EndDate < now;
            var labIds = c.TargetLabs.Select(tl => tl.TenantId).ToList();
            var labNames = c.TargetLabs
                .Where(tl => tl.Tenant != null)
                .Select(tl => tl.Tenant!.LabName)
                .ToList();

            return new AdCampaignDto(
                c.Id,
                c.CampaignTitle,
                c.SponsorName,
                c.SponsorContact,
                c.BannerImageUrl,
                (int)c.TargetType,
                c.TargetCity,
                c.TargetState,
                c.StartDate,
                c.EndDate,
                c.DurationDays,
                c.IsActive && !isExpired,
                c.DealAmount,
                c.PaymentStatus,
                c.TargetUrl,
                c.QrCodeUrl,
                c.WhatsAppNote,
                c.TotalImpressionsCount,
                labIds,
                labNames,
                isExpired
            );
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("lab-status")]
    public async Task<ActionResult<List<LabAdStatusDto>>> GetLabAdStatuses()
    {
        var now = DateTime.UtcNow;
        var labs = await _context.Tenants
            .AsNoTracking()
            .OrderBy(t => t.LabName)
            .ToListAsync();

        var activeCampaigns = await _context.AdCampaigns
            .Include(c => c.TargetLabs)
            .Where(c => c.IsActive && c.StartDate <= now && c.EndDate >= now)
            .ToListAsync();

        var result = new List<LabAdStatusDto>();

        foreach (var lab in labs)
        {
            // Find active campaign assigned to this lab (either directly or via city-wide targeting)
            var activeDirect = activeCampaigns
                .FirstOrDefault(c => c.TargetLabs.Any(tl => tl.TenantId == lab.Id));

            var activeCity = activeDirect == null && !string.IsNullOrWhiteSpace(lab.City)
                ? activeCampaigns.FirstOrDefault(c => c.TargetType == AdTargetType.CityWise &&
                    string.Equals(c.TargetCity, lab.City, StringComparison.OrdinalIgnoreCase))
                : null;

            var activeCamp = activeDirect ?? activeCity;
            var isBooked = activeCamp != null && !lab.IsAdFree;

            result.Add(new LabAdStatusDto(
                lab.Id,
                lab.LabName,
                lab.LabCode,
                lab.City,
                lab.State,
                lab.IsAdFree,
                isBooked,
                activeCamp?.Id,
                activeCamp?.CampaignTitle,
                activeCamp?.SponsorName,
                activeCamp?.EndDate
            ));
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateAdCampaignRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.CampaignTitle) || string.IsNullOrWhiteSpace(req.SponsorName))
            return BadRequest(new { message = "Campaign Title and Sponsor Name are required." });

        if (string.IsNullOrWhiteSpace(req.BannerImageUrl))
            return BadRequest(new { message = "Ad banner image is required." });

        if (req.DurationDays <= 0)
            return BadRequest(new { message = "Campaign duration must be at least 1 day." });

        var startDate = req.StartDate == default ? DateTime.UtcNow : req.StartDate;
        var endDate = startDate.AddDays(req.DurationDays);
        var now = DateTime.UtcNow;

        // STRICT EXCLUSIVITY LOCK: Check if any chosen lab is already booked during this timeframe
        if (req.TargetType == (int)AdTargetType.LabWise && req.TargetLabIds != null && req.TargetLabIds.Any())
        {
            // Check for booked or ad-free labs
            var labs = await _context.Tenants
                .Where(t => req.TargetLabIds.Contains(t.Id))
                .ToListAsync();

            var conflictingActiveCampaigns = await _context.AdCampaigns
                .Include(c => c.TargetLabs)
                .Where(c => c.IsActive && c.EndDate >= now && c.StartDate <= endDate)
                .ToListAsync();

            foreach (var lab in labs)
            {
                if (lab.IsAdFree)
                {
                    return BadRequest(new { message = $"Laboratory '{lab.LabName}' is marked as 'Ad-Free Premium'. It cannot be included in ad campaigns." });
                }

                var conflict = conflictingActiveCampaigns.FirstOrDefault(c =>
                    c.TargetLabs.Any(tl => tl.TenantId == lab.Id) ||
                    (c.TargetType == AdTargetType.CityWise && string.Equals(c.TargetCity, lab.City, StringComparison.OrdinalIgnoreCase)));

                if (conflict != null)
                {
                    return BadRequest(new { message = $"Laboratory '{lab.LabName}' is already booked for '{conflict.CampaignTitle}' (Sponsor: {conflict.SponsorName}) until {conflict.EndDate:dd MMM yyyy}. A lab can only have 1 active ad at a time." });
                }
            }
        }

        var campaign = new AdCampaign
        {
            CampaignTitle = req.CampaignTitle,
            SponsorName = req.SponsorName,
            SponsorContact = req.SponsorContact,
            BannerImageUrl = req.BannerImageUrl,
            TargetType = (AdTargetType)req.TargetType,
            TargetCity = req.TargetCity,
            TargetState = req.TargetState,
            StartDate = startDate,
            EndDate = endDate,
            DurationDays = req.DurationDays,
            IsActive = true,
            DealAmount = req.DealAmount,
            PaymentStatus = req.PaymentStatus ?? "Pending",
            TargetUrl = req.TargetUrl,
            QrCodeUrl = req.QrCodeUrl,
            WhatsAppNote = req.WhatsAppNote,
            TotalImpressionsCount = 0
        };

        if (req.TargetType == (int)AdTargetType.LabWise && req.TargetLabIds != null)
        {
            foreach (var labId in req.TargetLabIds)
            {
                campaign.TargetLabs.Add(new AdCampaignLab
                {
                    AdCampaign = campaign,
                    TenantId = labId,
                    AssignedAt = DateTime.UtcNow
                });
            }
        }

        _context.AdCampaigns.Add(campaign);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Ad campaign '{campaign.CampaignTitle}' created successfully for {req.DurationDays} days.", id = campaign.Id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCampaign(Guid id, [FromBody] UpdateAdCampaignRequest req)
    {
        var campaign = await _context.AdCampaigns.FirstOrDefaultAsync(c => c.Id == id);
        if (campaign == null) return NotFound(new { message = "Campaign not found." });

        if (!string.IsNullOrWhiteSpace(req.CampaignTitle))
            campaign.CampaignTitle = req.CampaignTitle.Trim();

        if (!string.IsNullOrWhiteSpace(req.SponsorName))
            campaign.SponsorName = req.SponsorName.Trim();

        if (req.SponsorContact != null)
            campaign.SponsorContact = req.SponsorContact.Trim();

        if (!string.IsNullOrWhiteSpace(req.BannerImageUrl))
            campaign.BannerImageUrl = req.BannerImageUrl.Trim();

        if (req.DealAmount.HasValue)
            campaign.DealAmount = req.DealAmount.Value;

        if (!string.IsNullOrWhiteSpace(req.PaymentStatus))
            campaign.PaymentStatus = req.PaymentStatus.Trim();

        if (req.WhatsAppNote != null)
            campaign.WhatsAppNote = req.WhatsAppNote.Trim();

        // Extend Duration / EndDate
        if (req.ExtendDays.HasValue && req.ExtendDays.Value > 0)
        {
            var baseDate = campaign.EndDate > DateTime.UtcNow ? campaign.EndDate : DateTime.UtcNow;
            campaign.EndDate = baseDate.AddDays(req.ExtendDays.Value);
            campaign.DurationDays += req.ExtendDays.Value;
            campaign.IsActive = true; // Auto re-activate if it was expired
        }
        else if (req.NewEndDate.HasValue && req.NewEndDate.Value > campaign.StartDate)
        {
            campaign.EndDate = req.NewEndDate.Value;
            campaign.DurationDays = (int)Math.Ceiling((campaign.EndDate - campaign.StartDate).TotalDays);
            if (campaign.EndDate > DateTime.UtcNow)
                campaign.IsActive = true;
        }

        await _context.SaveChangesAsync();

        return Ok(new { 
            message = $"Ad campaign updated successfully! Valid till {campaign.EndDate:dd MMM yyyy}.", 
            id = campaign.Id,
            newEndDate = campaign.EndDate,
            bannerImageUrl = campaign.BannerImageUrl
        });
    }

    [HttpPut("{id}/toggle-status")]
    public async Task<IActionResult> ToggleCampaignStatus(Guid id)
    {
        var campaign = await _context.AdCampaigns.FirstOrDefaultAsync(c => c.Id == id);
        if (campaign == null) return NotFound(new { message = "Campaign not found." });

        campaign.IsActive = !campaign.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Campaign is now {(campaign.IsActive ? "Active" : "Inactive")}.", isActive = campaign.IsActive });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCampaign(Guid id)
    {
        var campaign = await _context.AdCampaigns.FirstOrDefaultAsync(c => c.Id == id);
        if (campaign == null) return NotFound(new { message = "Campaign not found." });

        _context.AdCampaigns.Remove(campaign);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Campaign deleted successfully." });
    }

    [HttpPut("toggle-ad-free/{tenantId}")]
    public async Task<IActionResult> ToggleAdFreeLab(Guid tenantId)
    {
        var lab = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (lab == null) return NotFound(new { message = "Laboratory not found." });

        lab.IsAdFree = !lab.IsAdFree;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Lab '{lab.LabName}' is now {(lab.IsAdFree ? "Ad-Free (No Ads)" : "Standard (Ads Allowed)")}.", isAdFree = lab.IsAdFree });
    }

    [HttpPost("upload-banner")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadBanner([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".png", ".jpg", ".jpeg", ".webp" };
        if (!allowed.Contains(ext))
            return BadRequest(new { message = "Only PNG, JPG, JPEG, WEBP image formats are supported." });

        var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "sponsors");
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }

        var fileName = $"sponsor_{DateTime.UtcNow.Ticks}{ext}";
        var filePath = Path.Combine(folder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/uploads/sponsors/{fileName}";
        return Ok(new { url = relativeUrl, message = "Banner uploaded successfully." });
    }
}
