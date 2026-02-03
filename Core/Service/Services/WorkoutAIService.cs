using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.WorkoutAI;

namespace Service.Services;

/// <summary>
/// Service for AI-powered workout plan generation using Flan-T5 ML model
/// Includes caching, user context enrichment, and database persistence
/// </summary>
public class WorkoutAIService : IWorkoutAIService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMLServiceClient _mlClient;
    private readonly IDistributedCache _cache;
    private readonly ILogger<WorkoutAIService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    private const string CACHE_PREFIX = "workout_plan:";
    private const int CACHE_DURATION_HOURS = 24;

    public WorkoutAIService(
        IUnitOfWork unitOfWork,
        IMLServiceClient mlClient,
        IDistributedCache cache,
        ILogger<WorkoutAIService> logger)
    {
        _unitOfWork = unitOfWork;
        _mlClient = mlClient;
        _cache = cache;
        _logger = logger;

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    /// <summary>
    /// Generate a personalized AI workout plan
    /// </summary>
    public async Task<AIWorkoutPlanResult> GenerateWorkoutPlanAsync(GenerateAIWorkoutPlanRequest request)
    {
        try
        {
            _logger.LogInformation(
                "Generating AI workout plan for user {UserId}: {Goal}, {Level}, {Days} days/week",
                request.UserId, request.Goal, request.FitnessLevel, request.DaysPerWeek);

            // 1. Build cache key
            var cacheKey = BuildCacheKey(request);

            // 2. Check cache (unless force regenerate)
            if (!request.ForceRegenerate)
            {
                var cachedPlan = await GetFromCacheAsync(cacheKey);
                if (cachedPlan != null)
                {
                    _logger.LogInformation("Returning cached plan for user {UserId}", request.UserId);
                    cachedPlan.FromCache = true;
                    return cachedPlan;
                }
            }

            // 3. Build ML request with user context
            var mlRequest = await BuildMLRequestAsync(request);

            // 4. Call ML service
            var mlResponse = await _mlClient.GenerateWorkoutPlanAsync(mlRequest);

            if (mlResponse == null || !mlResponse.IsValidJson)
            {
                return new AIWorkoutPlanResult
                {
                    Success = false,
                    ErrorMessage = mlResponse?.Error ?? "Failed to generate workout plan"
                };
            }

            // 5. Parse and structure the plan data
            var planData = ParsePlanData(mlResponse.Plan);

            // 6. Save to database
            var savedPlan = await SaveWorkoutPlanAsync(request, mlRequest, mlResponse, planData);

            // 7. Build result
            var result = new AIWorkoutPlanResult
            {
                Success = true,
                PlanId = savedPlan.PlanId,
                PlanName = savedPlan.PlanName,
                PlanData = planData,
                ModelVersion = mlResponse.ModelVersion,
                GenerationLatencyMs = mlResponse.GenerationLatencyMs,
                FromCache = false,
                GeneratedAt = DateTime.UtcNow
            };

            // 8. Cache the result
            await CachePlanAsync(cacheKey, result);

            _logger.LogInformation(
                "Generated AI workout plan {PlanId} for user {UserId} in {Latency}ms",
                savedPlan.PlanId, request.UserId, mlResponse.GenerationLatencyMs);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI workout plan for user {UserId}", request.UserId);
            return new AIWorkoutPlanResult
            {
                Success = false,
                ErrorMessage = $"Failed to generate workout plan: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Get user's strength profile
    /// </summary>
    public async Task<UserStrengthProfileDto?> GetUserStrengthProfileAsync(int userId)
    {
        try
        {
            var profiles = await _unitOfWork.Repository<UserStrengthProfile>()
                .FindAsync(p => p.UserId == userId);

            if (!profiles.Any())
                return null;

            var exercises = await _unitOfWork.Repository<Exercise>().GetAllAsync();
            var exerciseDict = exercises.ToDictionary(e => e.ExerciseId, e => e.Name);

            return new UserStrengthProfileDto
            {
                UserId = userId,
                LastUpdated = profiles.Max(p => p.UpdatedAt),
                Exercises = profiles.Select(p => new ExerciseStrengthDto
                {
                    ExerciseId = p.ExerciseId,
                    ExerciseName = exerciseDict.TryGetValue(p.ExerciseId, out var name) ? name : "Unknown",
                    Estimated1RM = p.Estimated1RM,
                    ConfidenceScore = p.ConfidenceScore,
                    AvgWorkingWeight = p.AvgWorkingWeight,
                    MaxWeightLifted = p.MaxWeightLifted,
                    FeedbackCount = p.FeedbackCount,
                    StrengthTrend = p.StrengthTrend,
                    LastWorkoutDate = p.LastWorkoutDate
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting strength profile for user {UserId}", userId);
            return null;
        }
    }

    /// <summary>
    /// Get user's latest muscle development scan
    /// </summary>
    public async Task<MuscleScanResultDto?> GetLatestMuscleScanAsync(int userId)
    {
        try
        {
            var scans = await _unitOfWork.Repository<MuscleDevelopmentScan>()
                .FindAsync(s => s.UserId == userId);

            var latestScan = scans.OrderByDescending(s => s.ScanDate).FirstOrDefault();

            if (latestScan == null)
                return null;

            Dictionary<string, decimal>? muscleScores = null;
            if (!string.IsNullOrEmpty(latestScan.MuscleScores))
            {
                muscleScores = JsonSerializer.Deserialize<Dictionary<string, decimal>>(
                    latestScan.MuscleScores, _jsonOptions);
            }

            return new MuscleScanResultDto
            {
                ScanId = latestScan.Id,
                UserId = latestScan.UserId,
                ImageUrl = latestScan.ImageUrl,
                ImageType = latestScan.ImageType,
                MuscleScores = muscleScores,
                UnderdevelopedMuscles = latestScan.UnderdevelopedMuscles?.ToList(),
                WellDevelopedMuscles = latestScan.WellDevelopedMuscles?.ToList(),
                BodyFatEstimate = latestScan.BodyFatEstimate,
                MuscleDefinitionScore = latestScan.MuscleDefinitionScore,
                PostureNotes = latestScan.PostureNotes,
                AsymmetryDetected = latestScan.AsymmetryDetected,
                ConfidenceScore = latestScan.ConfidenceScore,
                ScanDate = latestScan.ScanDate
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting latest muscle scan for user {UserId}", userId);
            return null;
        }
    }

    /// <summary>
    /// Check if ML service is healthy
    /// </summary>
    public async Task<bool> IsMLServiceHealthyAsync()
    {
        var health = await _mlClient.CheckHealthAsync();
        return health?.Status == "healthy";
    }

    #region Private Methods

    /// <summary>
    /// Build ML request with enriched user context
    /// </summary>
    private async Task<MLWorkoutRequest> BuildMLRequestAsync(GenerateAIWorkoutPlanRequest request)
    {
        var mlRequest = new MLWorkoutRequest
        {
            UserId = request.UserId,
            FitnessLevel = request.FitnessLevel,
            Goal = request.Goal,
            DaysPerWeek = request.DaysPerWeek,
            Equipment = request.Equipment,
            Injuries = request.Injuries
        };

        if (request.IncludeUserContext)
        {
            mlRequest.UserContext = await BuildUserContextAsync(request.UserId);
        }

        return mlRequest;
    }

    /// <summary>
    /// Build user context from database (InBody, strength profile, muscle scan)
    /// </summary>
    private async Task<MLUserContext?> BuildUserContextAsync(int userId)
    {
        var context = new MLUserContext();
        var hasData = false;

        // Get latest InBody measurement
        var inBodyMeasurements = await _unitOfWork.Repository<InBodyMeasurement>()
            .FindAsync(m => m.UserId == userId);
        var latestInBody = inBodyMeasurements.OrderByDescending(m => m.CreatedAt).FirstOrDefault();

        if (latestInBody != null)
        {
            context.InBodyData = new MLInBodyData
            {
                MuscleMassKg = latestInBody.MuscleMass,
                BodyFatPercent = latestInBody.BodyFatPercentage,
                SkeletalMuscleMass = latestInBody.MuscleMass // Use muscle mass as skeletal muscle mass
            };
            hasData = true;
        }

        // Get latest muscle scan
        var muscleScans = await _unitOfWork.Repository<MuscleDevelopmentScan>()
            .FindAsync(s => s.UserId == userId);
        var latestScan = muscleScans.OrderByDescending(s => s.ScanDate).FirstOrDefault();

        if (latestScan != null)
        {
            context.MuscleScan = new MLMuscleScanData
            {
                WeakAreas = latestScan.UnderdevelopedMuscles?.ToList(),
                StrongAreas = latestScan.WellDevelopedMuscles?.ToList()
            };
            hasData = true;
        }

        // Get strength profile
        var strengthProfiles = await _unitOfWork.Repository<UserStrengthProfile>()
            .FindAsync(p => p.UserId == userId);

        if (strengthProfiles.Any())
        {
            var exercises = await _unitOfWork.Repository<Exercise>().GetAllAsync();
            var exerciseDict = exercises.ToDictionary(e => e.ExerciseId, e => e.Name);

            context.StrengthProfile = strengthProfiles
                .Where(p => p.ConfidenceScore >= 0.5m) // Only include confident estimates
                .OrderByDescending(p => p.ConfidenceScore)
                .Take(10) // Limit to top 10 exercises
                .Select(p => new MLStrengthProfileEntry
                {
                    ExerciseName = exerciseDict.TryGetValue(p.ExerciseId, out var name) ? name : "Unknown",
                    OneRmKg = p.Estimated1RM,
                    ConfidenceScore = p.ConfidenceScore
                })
                .ToList();
            hasData = true;
        }

        // Get recent feedback summary
        var feedbacks = await _unitOfWork.Repository<WorkoutFeedback>()
            .FindAsync(f => f.UserId == userId);
        var recentFeedbacks = feedbacks
            .OrderByDescending(f => f.CreatedAt)
            .Take(5)
            .ToList();

        if (recentFeedbacks.Any())
        {
            var avgRating = recentFeedbacks
                .Where(f => f.Rating.HasValue)
                .Select(f => f.Rating!.Value)
                .DefaultIfEmpty(0)
                .Average();

            // Aggregate weight adjustments from exercise feedback
            var weightAdjustments = new Dictionary<string, string>();
            foreach (var feedback in recentFeedbacks)
            {
                if (string.IsNullOrEmpty(feedback.ExerciseFeedback))
                    continue;

                try
                {
                    var exerciseFeedbacks = JsonSerializer.Deserialize<List<ExerciseFeedbackJson>>(
                        feedback.ExerciseFeedback, _jsonOptions);

                    if (exerciseFeedbacks != null)
                    {
                        foreach (var ef in exerciseFeedbacks.Where(e => e.WeightFeeling != "Perfect"))
                        {
                            var key = ef.ExerciseName ?? "exercises";
                            if (!weightAdjustments.ContainsKey(key))
                            {
                                weightAdjustments[key] = ef.WeightFeeling ?? "unknown";
                            }
                        }
                    }
                }
                catch { /* Ignore parsing errors */ }
            }

            context.FeedbackSummary = new MLFeedbackSummary
            {
                AvgRating = (decimal)avgRating,
                WeightAdjustments = weightAdjustments.Any() ? weightAdjustments : null
            };
            hasData = true;
        }

        return hasData ? context : null;
    }

    /// <summary>
    /// Parse ML response plan data into structured format
    /// </summary>
    private AIGeneratedPlanData? ParsePlanData(Dictionary<string, object>? plan)
    {
        if (plan == null)
            return null;

        try
        {
            var json = JsonSerializer.Serialize(plan, _jsonOptions);
            return JsonSerializer.Deserialize<AIGeneratedPlanData>(json, _jsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse plan data, returning raw structure");
            return new AIGeneratedPlanData
            {
                Schedule = "Custom",
                Days = new List<AIWorkoutDay>()
            };
        }
    }

    /// <summary>
    /// Save generated workout plan to database
    /// </summary>
    private async Task<WorkoutPlan> SaveWorkoutPlanAsync(
        GenerateAIWorkoutPlanRequest request,
        MLWorkoutRequest mlRequest,
        MLWorkoutResponse mlResponse,
        AIGeneratedPlanData? planData)
    {
        var workoutPlan = new WorkoutPlan
        {
            UserId = request.UserId,
            PlanName = $"AI {request.Goal} Plan - {request.FitnessLevel}",
            Description = $"AI-generated {request.DaysPerWeek}-day {request.Goal.ToLower()} workout plan for {request.FitnessLevel.ToLower()} level",
            PlanType = "AI-Generated",
            FitnessLevel = request.FitnessLevel,
            Goal = request.Goal,
            DaysPerWeek = request.DaysPerWeek,
            DifficultyLevel = MapFitnessLevelToDifficulty(request.FitnessLevel),
            Status = "Active",
            IsActive = true,

            // AI-specific fields
            PlanData = JsonSerializer.Serialize(planData, _jsonOptions),
            RequestParameters = JsonSerializer.Serialize(mlRequest, _jsonOptions),
            RequestParametersHash = ComputeHash(mlRequest),
            UserContextSnapshot = mlRequest.UserContext != null
                ? JsonSerializer.Serialize(mlRequest.UserContext, _jsonOptions)
                : null,
            ModelVersion = mlResponse.ModelVersion,
            GenerationLatencyMs = mlResponse.GenerationLatencyMs,

            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<WorkoutPlan>().AddAsync(workoutPlan);
        await _unitOfWork.SaveChangesAsync();

        return workoutPlan;
    }

    /// <summary>
    /// Build cache key from request parameters
    /// </summary>
    private string BuildCacheKey(GenerateAIWorkoutPlanRequest request)
    {
        var keyData = new
        {
            request.UserId,
            request.FitnessLevel,
            request.Goal,
            request.DaysPerWeek,
            Equipment = string.Join(",", request.Equipment.OrderBy(e => e)),
            Injuries = string.Join(",", request.Injuries.OrderBy(i => i))
        };

        return $"{CACHE_PREFIX}{ComputeHash(keyData)}";
    }

    /// <summary>
    /// Get cached plan
    /// </summary>
    private async Task<AIWorkoutPlanResult?> GetFromCacheAsync(string cacheKey)
    {
        try
        {
            var cached = await _cache.GetStringAsync(cacheKey);
            if (string.IsNullOrEmpty(cached))
                return null;

            return JsonSerializer.Deserialize<AIWorkoutPlanResult>(cached, _jsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get cached plan");
            return null;
        }
    }

    /// <summary>
    /// Cache generated plan
    /// </summary>
    private async Task CachePlanAsync(string cacheKey, AIWorkoutPlanResult result)
    {
        try
        {
            var json = JsonSerializer.Serialize(result, _jsonOptions);
            await _cache.SetStringAsync(cacheKey, json, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(CACHE_DURATION_HOURS)
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache plan");
        }
    }

    /// <summary>
    /// Compute MD5 hash for cache key
    /// </summary>
    private static string ComputeHash(object data)
    {
        var json = JsonSerializer.Serialize(data);
        var bytes = MD5.HashData(Encoding.UTF8.GetBytes(json));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Map fitness level string to difficulty number
    /// </summary>
    private static string MapFitnessLevelToDifficulty(string fitnessLevel)
    {
        return fitnessLevel.ToLower() switch
        {
            "beginner" => "1",
            "intermediate" => "2",
            "advanced" => "3",
            _ => "2"
        };
    }

    #endregion

    /// <summary>
    /// Helper class for parsing exercise feedback JSON
    /// </summary>
    private class ExerciseFeedbackJson
    {
        public int? ExerciseId { get; set; }
        public string? ExerciseName { get; set; }
        public decimal? WeightUsed { get; set; }
        public string? WeightFeeling { get; set; }
        public int? SetsCompleted { get; set; }
        public int? SetsPlanned { get; set; }
        public string? FormDifficulty { get; set; }
    }
}
