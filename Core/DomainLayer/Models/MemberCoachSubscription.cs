using DomainLayer.Enums;

namespace DomainLayer.Models;

public class MemberCoachSubscription
{
    public int SubscriptionID { get; set; }
    public int UserID { get; set; }
    public int CoachID { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public SubscriptionStatus Status { get; set; }
    public decimal Fee { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual Coach Coach { get; set; } = null!;
}
