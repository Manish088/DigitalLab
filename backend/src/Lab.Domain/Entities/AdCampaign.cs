using Lab.Domain.Common;

namespace Lab.Domain.Entities;

public enum AdTargetType
{
    CityWise = 1,
    LabWise = 2,
    All = 3
}

public class AdCampaign : BaseEntity
{
    public string CampaignTitle { get; set; } = string.Empty;
    public string SponsorName { get; set; } = string.Empty;
    public string? SponsorContact { get; set; }
    public string BannerImageUrl { get; set; } = string.Empty;
    public AdTargetType TargetType { get; set; } = AdTargetType.CityWise;
    public string? TargetCity { get; set; }
    public string? TargetState { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DurationDays { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal? DealAmount { get; set; }
    public string PaymentStatus { get; set; } = "Pending"; // "Paid", "Pending"
    public string? TargetUrl { get; set; }
    public string? QrCodeUrl { get; set; }
    public string? WhatsAppNote { get; set; }
    public long TotalImpressionsCount { get; set; } = 0;

    public ICollection<AdCampaignLab> TargetLabs { get; set; } = new List<AdCampaignLab>();
}
