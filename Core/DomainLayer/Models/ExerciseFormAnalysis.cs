namespace DomainLayer.Models;

public class ExerciseFormAnalysis
{
    public int AnalysisID { get; set; }
    public int SessionID { get; set; }
    public int AI_ID { get; set; }
    public string ExerciseName { get; set; } = string.Empty;
    public int RepCount { get; set; }
    public float FormScore { get; set; }
    public string? FormFeedback { get; set; }
    public float InjuryRiskScore { get; set; }
    public string? PoseDataJson { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public virtual WorkoutSession Session { get; set; } = null!;
    public virtual AI_Agent AIAgent { get; set; } = null!;
}
