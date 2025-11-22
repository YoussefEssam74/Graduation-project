using DomainLayer.Enums;

namespace DomainLayer.Models;

public class NutritionPlan
{
    public int PlanID { get; set; }
    public int UserID { get; set; }
    public int AI_ID { get; set; }
    public int? ReviewedByCoachID { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public int DailyCalories { get; set; }
    public float ProteinGrams { get; set; }
    public float CarbsGrams { get; set; }
    public float FatsGrams { get; set; }
    public DateTime GeneratedAt { get; set; }
    public ApprovalStatus ApprovalStatus { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComments { get; set; }
    public bool IsActive { get; set; }
    public PlanSource PlanSource { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual AI_Agent AIAgent { get; set; } = null!;
    public virtual Coach? ReviewedByCoach { get; set; }
    public virtual ICollection<Meal> Meals { get; set; } = new List<Meal>();
}
