namespace IntelliFit.ServiceAbstraction.Services;

/// <summary>
/// Service for LLM-based workout plan generation.
/// </summary>
public interface ILLMWorkoutService
{
    /// <summary>
    /// Generates a workout plan from a natural language prompt.
    /// </summary>
    Task<LLMGenerationResult> GenerateAsync(string prompt, float temperature = 0.7f);

    /// <summary>
    /// Generates a workout plan from structured parameters.
    /// </summary>
    Task<LLMGenerationResult> GenerateStructuredAsync(LLMWorkoutRequest request);

    /// <summary>
    /// Checks if the LLM service is available.
    /// </summary>
    Task<bool> IsHealthyAsync();
}

/// <summary>
/// Structured request for workout generation.
/// </summary>
public class LLMWorkoutRequest
{
    public string FitnessLevel { get; set; } = "Beginner";
    public string Goal { get; set; } = "muscle gain";
    public int DaysPerWeek { get; set; } = 3;
    public List<string> Injuries { get; set; } = new();
    public List<string> WeakMuscles { get; set; } = new();
    public string RAGContext { get; set; } = string.Empty;
    public int MaxLength { get; set; } = 1024;
    public float Temperature { get; set; } = 0.7f;
}

/// <summary>
/// Result of LLM workout generation.
/// </summary>
public class LLMGenerationResult
{
    public bool Success { get; set; }
    public GeneratedWorkoutPlan? Plan { get; set; }
    public string? RawText { get; set; }
    public string? Error { get; set; }

    public static LLMGenerationResult CreateError(string error)
    {
        return new LLMGenerationResult
        {
            Success = false,
            Error = error
        };
    }
}

/// <summary>
/// Generated workout plan structure.
/// </summary>
public class GeneratedWorkoutPlan
{
    public string PlanName { get; set; } = string.Empty;
    public int DurationWeeks { get; set; } = 4;
    public List<GeneratedWorkoutDay> Days { get; set; } = new();
}

public class GeneratedWorkoutDay
{
    public int Day { get; set; }
    public string Focus { get; set; } = string.Empty;
    public List<GeneratedExercise> Exercises { get; set; } = new();
}

public class GeneratedExercise
{
    public string Name { get; set; } = string.Empty;
    public int Sets { get; set; }
    public int Reps { get; set; }
    public int RestSeconds { get; set; } = 60;
    public string Notes { get; set; } = string.Empty;
}
