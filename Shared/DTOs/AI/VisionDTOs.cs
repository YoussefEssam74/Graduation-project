namespace Shared.DTOs.AI;

/// <summary>
/// Request for vision-based body analysis.
/// </summary>
public class VisionAnalysisRequest
{
    public int UserId { get; set; }
    public string? ImageBase64 { get; set; }
    public byte[]? ImageBytes { get; set; }
}

/// <summary>
/// Result of vision-based body analysis.
/// </summary>
public class VisionAnalysisResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public bool IsReliable { get; set; }
    public float OverallConfidence { get; set; }
    
    // Muscle group analysis
    public MuscleGroupAnalysis? Chest { get; set; }
    public MuscleGroupAnalysis? Arms { get; set; }
    public MuscleGroupAnalysis? Shoulders { get; set; }
    public MuscleGroupAnalysis? BodyComposition { get; set; }
    
    public List<string> WeakMuscles { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
}

/// <summary>
/// Analysis result for a single muscle group.
/// </summary>
public class MuscleGroupAnalysis
{
    /// <summary>Status: well_developed, average, or underdeveloped</summary>
    public string Status { get; set; } = "average";
    
    /// <summary>Confidence score (0.0 - 1.0)</summary>
    public float Confidence { get; set; }
    
    /// <summary>Scores for all possible statuses</summary>
    public Dictionary<string, float> AllScores { get; set; } = new();
}
