namespace DomainLayer.Models;

public class AI_Agent
{
    public int AI_ID { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    // Navigation Properties
    public virtual ICollection<AIQueryLog> QueryLogs { get; set; } = new List<AIQueryLog>();
    public virtual ICollection<ExerciseFormAnalysis> FormAnalyses { get; set; } = new List<ExerciseFormAnalysis>();
    public virtual ICollection<WorkoutRecommendation> Recommendations { get; set; } = new List<WorkoutRecommendation>();
    public virtual ICollection<NutritionPlan> NutritionPlans { get; set; } = new List<NutritionPlan>();
}
