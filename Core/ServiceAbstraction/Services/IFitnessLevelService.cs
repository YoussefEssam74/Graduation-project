namespace IntelliFit.ServiceAbstraction.Services;

/// <summary>
/// Service for predicting user fitness level using ML.NET model.
/// </summary>
public interface IFitnessLevelService
{
    /// <summary>
    /// Predicts the fitness level for a user based on their profile data.
    /// </summary>
    /// <param name="request">User profile data for prediction</param>
    /// <returns>Prediction result with level and confidence scores</returns>
    Task<FitnessLevelPredictionResult> PredictAsync(FitnessLevelPredictionRequest request);

    /// <summary>
    /// Checks if the ML model is loaded and ready for predictions.
    /// </summary>
    bool IsModelLoaded { get; }
}

/// <summary>
/// Request data for fitness level prediction.
/// </summary>
public class FitnessLevelPredictionRequest
{
    public int UserId { get; set; }
    public float Age { get; set; }
    public float WeightKg { get; set; }
    public float HeightCm { get; set; }
    public float BodyFatPercentage { get; set; }
    public float ExperienceYears { get; set; }
}

/// <summary>
/// Result of fitness level prediction.
/// </summary>
public class FitnessLevelPredictionResult
{
    /// <summary>Predicted fitness level: Beginner, Intermediate, or Advanced</summary>
    public string Level { get; set; } = "Beginner";

    /// <summary>Confidence score for the prediction (0.0 - 1.0)</summary>
    public float Confidence { get; set; }

    /// <summary>Individual probability scores for each level</summary>
    public Dictionary<string, float> AllScores { get; set; } = new();

    /// <summary>Indicates if prediction was successful</summary>
    public bool Success { get; set; } = true;

    /// <summary>Error message if prediction failed</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Creates a default fallback result when prediction fails.
    /// </summary>
    public static FitnessLevelPredictionResult CreateFallback(string? errorMessage = null)
    {
        return new FitnessLevelPredictionResult
        {
            Level = "Beginner",
            Confidence = 0f, // Use 0 to indicate no valid prediction (Success=false)
            AllScores = new Dictionary<string, float>
            {
                ["Beginner"] = 0f,
                ["Intermediate"] = 0f,
                ["Advanced"] = 0f
            },
            Success = false,
            ErrorMessage = errorMessage ?? "Prediction failed, using default"
        };
    }
}
