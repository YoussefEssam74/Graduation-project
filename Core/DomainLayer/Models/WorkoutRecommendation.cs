using DomainLayer.Enums;

namespace DomainLayer.Models;

public class WorkoutRecommendation
{
    public int RecommendationID { get; set; }
    public int UserID { get; set; }
    public int AI_ID { get; set; }
    public int? ReviewedByCoachID { get; set; }
    public string RecommendationName { get; set; } = string.Empty;
    public DifficultyLevel DifficultyLevel { get; set; }
    public int DurationWeeks { get; set; }
    public int WorkoutsPerWeek { get; set; }
    public DateTime GeneratedAt { get; set; }
    public ApprovalStatus ApprovalStatus { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComments { get; set; }
    public DateTime? UserResponseAt { get; set; }
    public bool IsAccepted { get; set; }
    public PlanSource PlanSource { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual AI_Agent AIAgent { get; set; } = null!;
    public virtual Coach? ReviewedByCoach { get; set; }
    public virtual ICollection<RecommendedExercise> RecommendedExercises { get; set; } = new List<RecommendedExercise>();
}
