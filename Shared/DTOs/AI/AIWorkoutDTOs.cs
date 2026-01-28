using IntelliFit.Domain.Enums;

namespace Shared.DTOs.AI;

/// <summary>
/// Request for AI-powered workout plan generation with all required inputs.
/// </summary>
public class AIWorkoutGenerationRequest
{
    public int UserId { get; set; }
    
    // Profile data for ML.NET fitness classification
    public float Age { get; set; }
    public float WeightKg { get; set; }
    public float HeightCm { get; set; }
    public float BodyFatPercentage { get; set; } = 20f;
    public float ExperienceYears { get; set; } = 0f;
    
    // Workout preferences
    public string Goal { get; set; } = "muscle gain";
    public int DaysPerWeek { get; set; } = 3;
    public List<string> Injuries { get; set; } = new();
    public string? EquipmentAccess { get; set; }
    
    // Optional body image for vision analysis (base64 encoded)
    public string? BodyImageBase64 { get; set; }
    
    // Optional: Override ML-predicted fitness level
    public string? FitnessLevelOverride { get; set; }
}

/// <summary>
/// Complete result of AI workout generation pipeline.
/// </summary>
public class AIWorkoutGenerationResult
{
    public bool IsSuccessful { get; set; }
    public string? ErrorMessage { get; set; }
    public int? WorkoutPlanId { get; set; }
    
    // Pipeline results
    public FitnessPredictionDto? FitnessPrediction { get; set; }
    public VisionAnalysisDto? VisionAnalysis { get; set; }
    public List<string> RetrievedContext { get; set; } = new();
    public GeneratedPlanDto? GeneratedPlan { get; set; }
    
    // Metadata
    public int AttemptCount { get; set; }
    public int ProcessingTimeMs { get; set; }
    public int TokensSpent { get; set; }
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// ML.NET fitness level prediction result.
/// </summary>
public class FitnessPredictionDto
{
    public FitnessLevel Level { get; set; }
    public float Confidence { get; set; }
    public Dictionary<string, float> AllScores { get; set; } = new();
}

/// <summary>
/// Vision analysis result from CLIP model.
/// </summary>
public class VisionAnalysisDto
{
    public bool IsReliable { get; set; }
    public float OverallConfidence { get; set; }
    public string? ChestStatus { get; set; }
    public string? ArmsStatus { get; set; }
    public string? ShouldersStatus { get; set; }
    public string? BodyComposition { get; set; }
    public List<string> WeakMuscles { get; set; } = new();
}

/// <summary>
/// Generated workout plan from LLM.
/// </summary>
public class GeneratedPlanDto
{
    public string PlanName { get; set; } = string.Empty;
    public int DurationWeeks { get; set; }
    public List<GeneratedDayDto> Days { get; set; } = new();
}

/// <summary>
/// Single day in generated plan.
/// </summary>
public class GeneratedDayDto
{
    public int DayNumber { get; set; }
    public string Focus { get; set; } = string.Empty;
    public List<GeneratedExerciseDto> Exercises { get; set; } = new();
}

/// <summary>
/// Single exercise in generated plan.
/// </summary>
public class GeneratedExerciseDto
{
    public string Name { get; set; } = string.Empty;
    public int Sets { get; set; }
    public int Reps { get; set; }
    public int RestSeconds { get; set; }
    public string? Notes { get; set; }
}
