namespace DomainLayer.Models;

public class SubscriptionPlan
{
    public int PlanID { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal MonthlyFee { get; set; }
    public int TokensIncluded { get; set; }
    public bool HasAIFeatures { get; set; }
    public bool IsActive { get; set; }
}
