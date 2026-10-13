using Lab.Domain.Common;

namespace Lab.Domain.Entities;

public class AdCampaignLab : BaseEntity
{
    public Guid AdCampaignId { get; set; }
    public AdCampaign? AdCampaign { get; set; }

    public Guid TenantId { get; set; }
    public TenantLab? Tenant { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
