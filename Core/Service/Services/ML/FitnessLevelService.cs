using IntelliFit.ServiceAbstraction.Services;
using GraduationProject.ML.Models;
using GraduationProject.ML.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace IntelliFit.Service.Services.ML;

/// <summary>
/// Service for predicting user fitness level using ML.NET model.
/// </summary>
public class FitnessLevelService : IFitnessLevelService
{
    private readonly FitnessLevelPredictor? _predictor;
    private readonly ILogger<FitnessLevelService> _logger;
    private readonly bool _modelLoaded;

    public FitnessLevelService(
        IOptions<MLModelOptions> options,
        ILogger<FitnessLevelService> logger)
    {
        _logger = logger;
        
        try
        {
            string modelPath = options.Value.FitnessLevelModelPath ?? 
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "MLModels", "fitness_level_model.zip");
            
            if (File.Exists(modelPath))
            {
                _predictor = new FitnessLevelPredictor(modelPath);
                _modelLoaded = true;
                _logger.LogInformation("ML.NET fitness level model loaded from {Path}", modelPath);
            }
            else
            {
                _logger.LogWarning("ML.NET model not found at {Path}, using rule-based fallback", modelPath);
                _modelLoaded = false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load ML.NET model, using rule-based fallback");
            _modelLoaded = false;
        }
    }

    public bool IsModelLoaded => _modelLoaded;

    public Task<FitnessLevelPredictionResult> PredictAsync(FitnessLevelPredictionRequest request)
    {
        try
        {
            if (_predictor != null && _modelLoaded)
            {
                return PredictWithMLAsync(request);
            }
            else
            {
                return Task.FromResult(PredictWithRules(request));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Prediction failed for user {UserId}", request.UserId);
            return Task.FromResult(FitnessLevelPredictionResult.CreateFallback($"Prediction error: {ex.Message}"));
        }
    }

    private Task<FitnessLevelPredictionResult> PredictWithMLAsync(FitnessLevelPredictionRequest request)
    {
        var input = new FitnessLevelModelInput
        {
            Age = request.Age,
            WeightKg = request.WeightKg,
            HeightCm = request.HeightCm,
            BodyFatPercentage = request.BodyFatPercentage,
            ExperienceYears = request.ExperienceYears
        };

        var prediction = _predictor!.Predict(input);

        var result = new FitnessLevelPredictionResult
        {
            Level = prediction.PredictedFitnessLevel,
            Confidence = prediction.Confidence,
            AllScores = prediction.GetAllScores(),
            Success = true
        };

        _logger.LogInformation("ML prediction for user {UserId}: {Level} ({Confidence:P1})",
            request.UserId, result.Level, result.Confidence);

        return Task.FromResult(result);
    }

    private FitnessLevelPredictionResult PredictWithRules(FitnessLevelPredictionRequest request)
    {
        // Input validation - fail fast for invalid values
        if (request.WeightKg <= 0)
        {
            _logger.LogWarning("Invalid weight {Weight} for user {UserId}", request.WeightKg, request.UserId);
            return FitnessLevelPredictionResult.CreateFallback("Invalid weight value");
        }
        
        if (request.Age <= 0)
        {
            _logger.LogWarning("Invalid age {Age} for user {UserId}", request.Age, request.UserId);
            return FitnessLevelPredictionResult.CreateFallback("Invalid age value");
        }
        
        if (request.BodyFatPercentage < 0)
        {
            _logger.LogWarning("Invalid body fat percentage {BodyFat} for user {UserId}", request.BodyFatPercentage, request.UserId);
            return FitnessLevelPredictionResult.CreateFallback("Invalid body fat percentage value");
        }
        
        if (request.ExperienceYears < 0)
        {
            _logger.LogWarning("Invalid experience years {Experience} for user {UserId}", request.ExperienceYears, request.UserId);
            return FitnessLevelPredictionResult.CreateFallback("Invalid experience years value");
        }
        
        if (request.HeightCm <= 0)
        {
            _logger.LogWarning("Invalid height {Height} for user {UserId}", request.HeightCm, request.UserId);
            return FitnessLevelPredictionResult.CreateFallback("Invalid height value");
        }
        
        // Rule-based fallback when ML model is unavailable
        float score = 0;

        // Experience is the strongest indicator
        if (request.ExperienceYears >= 5) score += 40;
        else if (request.ExperienceYears >= 2) score += 25;
        else if (request.ExperienceYears >= 1) score += 15;

        // Age factor (moderate impact)
        if (request.Age >= 18 && request.Age <= 35) score += 15;
        else if (request.Age >= 36 && request.Age <= 50) score += 10;
        else score += 5;

        // Body fat percentage
        if (request.BodyFatPercentage < 15) score += 20;
        else if (request.BodyFatPercentage < 22) score += 12;
        else if (request.BodyFatPercentage < 28) score += 5;

        // BMI factor
        float heightM = request.HeightCm / 100f;
        float bmi = request.WeightKg / (heightM * heightM);
        if (bmi >= 18.5 && bmi < 25) score += 15;
        else if (bmi >= 25 && bmi < 30) score += 8;

        // Determine level based on score
        string level;
        if (score >= 60) level = "Advanced";
        else if (score >= 35) level = "Intermediate";
        else level = "Beginner";

        float confidence = Math.Min(score / 90f, 0.85f);

        _logger.LogInformation("Rule-based prediction for user {UserId}: {Level} (score: {Score})",
            request.UserId, level, score);

        return new FitnessLevelPredictionResult
        {
            Level = level,
            Confidence = confidence,
            AllScores = new Dictionary<string, float>
            {
                ["Beginner"] = level == "Beginner" ? confidence : (1 - confidence) / 2,
                ["Intermediate"] = level == "Intermediate" ? confidence : (1 - confidence) / 2,
                ["Advanced"] = level == "Advanced" ? confidence : (1 - confidence) / 2
            },
            Success = true,
            ErrorMessage = "Used rule-based prediction (ML model not available)"
        };
    }
}

/// <summary>
/// Configuration options for ML models.
/// </summary>
public class MLModelOptions
{
    public const string SectionName = "MLModels";
    
    public string? FitnessLevelModelPath { get; set; }
}
