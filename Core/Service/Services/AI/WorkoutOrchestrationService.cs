using IntelliFit.ServiceAbstraction.Services;
using ServiceAbstraction.Services;
using IntelliFit.Domain.Enums;
using IntelliFit.Domain.Models;
using DomainLayer.Contracts;
using Shared.DTOs.AI;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace IntelliFit.Service.Services.AI;

/// <summary>
/// Orchestrates all AI components to generate a complete workout plan.
/// Implements the full pipeline: Classification → Vision → RAG → LLM → Validation.
/// </summary>
public class WorkoutOrchestrationService : IWorkoutOrchestrationService
{
    private readonly IFitnessLevelService _fitnessLevelService;
    private readonly IVisionAnalysisService _visionAnalysisService;
    private readonly IRAGService _ragService;
    private readonly ILLMWorkoutService _llmWorkoutService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<WorkoutOrchestrationService> _logger;

    private const int MaxRegenerationAttempts = 3;

    public WorkoutOrchestrationService(
        IFitnessLevelService fitnessLevelService,
        IVisionAnalysisService visionAnalysisService,
        IRAGService ragService,
        ILLMWorkoutService llmWorkoutService,
        IUnitOfWork unitOfWork,
        ILogger<WorkoutOrchestrationService> logger)
    {
        _fitnessLevelService = fitnessLevelService;
        _visionAnalysisService = visionAnalysisService;
        _ragService = ragService;
        _llmWorkoutService = llmWorkoutService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<AIWorkoutGenerationResult> GenerateWorkoutPlanAsync(AIWorkoutGenerationRequest request)
    {
        var stopwatch = Stopwatch.StartNew();
        var result = new AIWorkoutGenerationResult();

        try
        {
            _logger.LogInformation("Starting workout generation for user {UserId}", request.UserId);

            // Step 1: Validate request
            var validationError = ValidateRequest(request);
            if (validationError != null)
            {
                return CreateErrorResult(validationError);
            }

            // Step 2: ML.NET Fitness Level Prediction
            var fitnessLevel = await GetFitnessLevelAsync(request);
            result.FitnessPrediction = new FitnessPredictionDto
            {
                Level = fitnessLevel.level,
                Confidence = fitnessLevel.confidence,
                AllScores = fitnessLevel.allScores
            };
            _logger.LogInformation("Fitness level: {Level} ({Confidence:P1})", fitnessLevel.level, fitnessLevel.confidence);

            // Step 3: Vision Analysis (optional)
            List<string> weakMuscles = new();
            if (!string.IsNullOrEmpty(request.BodyImageBase64))
            {
                var visionResult = await AnalyzeBodyImageAsync(request);
                if (visionResult != null && visionResult.IsReliable)
                {
                    result.VisionAnalysis = new VisionAnalysisDto
                    {
                        IsReliable = visionResult.IsReliable,
                        OverallConfidence = visionResult.OverallConfidence,
                        ChestStatus = visionResult.Chest?.Status,
                        ArmsStatus = visionResult.Arms?.Status,
                        ShouldersStatus = visionResult.Shoulders?.Status,
                        BodyComposition = visionResult.BodyComposition?.Status,
                        WeakMuscles = visionResult.WeakMuscles
                    };
                    weakMuscles = visionResult.WeakMuscles;
                }
            }
            
            // Step 3.5: Equipment Integration
            var equipmentList = await GetAvailableEquipmentListAsync();
            var equipmentContext = string.Join(", ", equipmentList);
            _logger.LogInformation("Available equipment: {Count} items found", equipmentList.Count);

            // Step 4: RAG Context Retrieval
            var ragResult = await _ragService.BuildWorkoutContextAsync(
                fitnessLevel.level,
                request.Goal,
                request.Injuries,
                weakMuscles);
            
            // Append equipment to RAG context for LLM
            var finalRagContext = ragResult.FormattedContext ?? "";
            if (!string.IsNullOrEmpty(equipmentContext))
            {
                finalRagContext += "\n\nAVAILABLE GYM EQUIPMENT:\n" + equipmentContext;
            }

            // Step 5-7: LLM Generation with validation loop
            var llmRequest = new LLMWorkoutRequest
            {
                FitnessLevel = fitnessLevel.level.ToString(),
                Goal = request.Goal,
                DaysPerWeek = request.DaysPerWeek,
                Injuries = request.Injuries ?? new(),
                WeakMuscles = weakMuscles,
                RAGContext = finalRagContext,
                Temperature = 0.7f
            };

            GeneratedWorkoutPlan? validPlan = null;
            int attempts = 0;

            for (attempts = 1; attempts <= MaxRegenerationAttempts; attempts++)
            {
                _logger.LogInformation("LLM generation attempt {Attempt}/{Max}", attempts, MaxRegenerationAttempts);

                if (attempts > 1)
                {
                    llmRequest.Temperature = 0.5f + (attempts * 0.15f);
                }

                var llmResult = await _llmWorkoutService.GenerateStructuredAsync(llmRequest);

                if (llmResult.Success && llmResult.Plan != null)
                {
                    // Basic validation
                    if (llmResult.Plan.Days.Count > 0)
                    {
                        validPlan = llmResult.Plan;
                        break;
                    }
                    else
                    {
                        result.Warnings.Add($"Attempt {attempts}: Plan had no days");
                    }
                }
                else
                {
                    result.Warnings.Add($"Attempt {attempts}: {llmResult.Error}");
                }
            }

            result.AttemptCount = Math.Min(attempts, MaxRegenerationAttempts);

            if (validPlan == null)
            {
                _logger.LogError("Failed to generate valid plan after {Attempts} attempts", result.AttemptCount);
                return CreateErrorResult($"Failed to generate valid workout plan after {MaxRegenerationAttempts} attempts");
            }

            // Map to result DTO
            result.GeneratedPlan = new GeneratedPlanDto
            {
                PlanName = validPlan.PlanName,
                DurationWeeks = validPlan.DurationWeeks,
                Days = validPlan.Days.Select(d => new GeneratedDayDto
                {
                    DayNumber = d.Day,
                    Focus = d.Focus,
                    Exercises = d.Exercises.Select(e => new GeneratedExerciseDto
                    {
                        Name = e.Name,
                        Sets = e.Sets,
                        Reps = e.Reps,
                        RestSeconds = e.RestSeconds,
                        Notes = e.Notes
                    }).ToList()
                }).ToList()
            };

            result.IsSuccessful = true;
            result.ProcessingTimeMs = (int)stopwatch.ElapsedMilliseconds;
            result.TokensSpent = 50; // Base cost

            // Step 8: Persist to database
            try
            {
                var workoutPlan = new WorkoutPlan
                {
                    UserId = request.UserId,
                    PlanName = validPlan.PlanName,
                    DifficultyLevel = fitnessLevel.level.ToString(),
                    DurationWeeks = validPlan.DurationWeeks,
                    PlanType = "AI-Generated",
                    Status = "Active", // Or "PendingReview" if you want coach approval
                    IsActive = true,
                    AiPrompt = llmRequest.RAGContext, // Store context as prompt for reference
                    TokensSpent = 50,
                    Exercises = JsonSerializer.Serialize(result.GeneratedPlan.Days), // Quick access JSON
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Use DbContext directly for WorkoutPlan since it doesn't inherit from BaseEntity
                var context = _unitOfWork.Context as DbContext;
                if (context != null)
                {
                    context.Set<WorkoutPlan>().Add(workoutPlan);
                    await _unitOfWork.SaveChangesAsync();

                    result.WorkoutPlanId = workoutPlan.PlanId;
                    _logger.LogInformation("Saved workout plan to database with ID {Id}", workoutPlan.PlanId);
                }
                else
                {
                    throw new InvalidOperationException("Unable to access database context");
                }

                // Create full structured exercises if matching exercises exist
                await SaveStructuredExercisesAsync(workoutPlan.PlanId, result.GeneratedPlan.Days);
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "Failed to persist workout plan to database");
                result.Warnings.Add("Saved locally but failed to persist to database: " + dbEx.Message);
            }

            _logger.LogInformation("Successfully generated workout plan '{PlanName}' in {Ms}ms",
                validPlan.PlanName, result.ProcessingTimeMs);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Workout generation failed for user {UserId}", request.UserId);
            return CreateErrorResult($"Generation failed: {ex.Message}");
        }
    }

    private async Task SaveStructuredExercisesAsync(int planId, List<GeneratedDayDto> days)
    {
        try
        {
            var exerciseRepo = _unitOfWork.Repository<Exercise>();
            var planExerciseRepo = _unitOfWork.Repository<WorkoutPlanExercise>();
            var allDbExercises = await exerciseRepo.GetAllAsync();

            foreach (var day in days)
            {
                int order = 1; // Reset order for each day
                foreach (var ex in day.Exercises)
                {
                    // Try to find matching exercise in DB by name
                    var dbEx = allDbExercises.FirstOrDefault(e => 
                        e.Name.Equals(ex.Name, StringComparison.OrdinalIgnoreCase));

                    if (dbEx != null)
                    {
                        var planEx = new WorkoutPlanExercise
                        {
                            WorkoutPlanId = planId,
                            ExerciseId = dbEx.ExerciseId,
                            DayNumber = day.DayNumber,
                            OrderInDay = order++,
                            Sets = ex.Sets,
                            Reps = ex.Reps,
                            RestSeconds = ex.RestSeconds,
                            Notes = ex.Notes,
                            CreatedAt = DateTime.UtcNow
                        };
                        await planExerciseRepo.AddAsync(planEx);
                    }
                }
            }
            await _unitOfWork.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to save structured exercises for plan {Id}", planId);
        }
    }

    public Task<GenerationStatus?> GetGenerationStatusAsync(int logId)
    {
        // For synchronous generation, status is always complete or not found
        return Task.FromResult<GenerationStatus?>(null);
    }

    public Task<bool> CancelGenerationAsync(int logId)
    {
        // Synchronous generation cannot be cancelled
        return Task.FromResult(false);
    }

    public Task<bool> ProvideFeedbackAsync(int logId, int rating, string? feedback)
    {
        // Would store in database
        _logger.LogInformation("Received feedback for log {LogId}: {Rating} stars", logId, rating);
        return Task.FromResult(true);
    }

    public Task<List<GenerationHistoryItem>> GetGenerationHistoryAsync(int userId, int page = 1, int pageSize = 10)
    {
        // Would query database
        return Task.FromResult(new List<GenerationHistoryItem>());
    }

    public async Task<PipelineHealthStatus> CheckPipelineHealthAsync()
    {
        var status = new PipelineHealthStatus
        {
            MLNetClassifier = await CheckMLHealthAsync(),
            VisionServer = await CheckVisionHealthAsync(),
            LLMServer = await CheckLLMHealthAsync(),
            EmbeddingServer = await CheckEmbeddingHealthAsync(),
            Database = new ComponentHealth { Name = "Database", IsHealthy = true, LastChecked = DateTime.UtcNow }
        };

        // Vision is optional - plan generation can work without body image analysis
        status.IsHealthy = status.MLNetClassifier.IsHealthy &&
                          status.LLMServer.IsHealthy &&
                          status.EmbeddingServer.IsHealthy;

        if (!status.VisionServer.IsHealthy)
        {
            status.Warnings.Add("Vision server unavailable - body image analysis disabled");
        }

        return status;
    }

    private string? ValidateRequest(AIWorkoutGenerationRequest request)
    {
        if (request.UserId <= 0) return "UserId is required";
        if (request.Age < 13 || request.Age > 100) return "Age must be between 13 and 100";
        if (request.WeightKg < 30 || request.WeightKg > 300) return "Weight must be between 30 and 300 kg";
        if (request.HeightCm < 100 || request.HeightCm > 250) return "Height must be between 100 and 250 cm";
        if (request.DaysPerWeek < 1 || request.DaysPerWeek > 7) return "Days per week must be between 1 and 7";
        return null;
    }

    private async Task<(FitnessLevel level, float confidence, Dictionary<string, float> allScores)> GetFitnessLevelAsync(
        AIWorkoutGenerationRequest request)
    {
        if (!string.IsNullOrEmpty(request.FitnessLevelOverride))
        {
            if (Enum.TryParse<FitnessLevel>(request.FitnessLevelOverride, true, out var overrideLevel))
            {
                return (overrideLevel, 1.0f, new Dictionary<string, float> { [overrideLevel.ToString()] = 1.0f });
            }
        }

        var prediction = await _fitnessLevelService.PredictAsync(new FitnessLevelPredictionRequest
        {
            UserId = request.UserId,
            Age = request.Age,
            WeightKg = request.WeightKg,
            HeightCm = request.HeightCm,
            BodyFatPercentage = request.BodyFatPercentage,
            ExperienceYears = request.ExperienceYears
        });

        var level = Enum.TryParse<FitnessLevel>(prediction.Level, true, out var parsedLevel)
            ? parsedLevel
            : FitnessLevel.Beginner;

        return (level, prediction.Confidence, prediction.AllScores);
    }

    private async Task<VisionAnalysisResult?> AnalyzeBodyImageAsync(AIWorkoutGenerationRequest request)
    {
        if (string.IsNullOrEmpty(request.BodyImageBase64)) return null;

        var visionRequest = new VisionAnalysisRequest
        {
            UserId = request.UserId,
            ImageBase64 = request.BodyImageBase64
        };

        return await _visionAnalysisService.AnalyzeBodyImageAsync(visionRequest);
    }

    private async Task<List<string>> GetAvailableEquipmentAsync()
    {
        try
        {
            var equipmentRepo = _unitOfWork.Repository<Equipment>();
            var equipment = await equipmentRepo.GetAllAsync();
            
            return equipment
                .Where(e => e.IsActive && e.Status == EquipmentStatus.Available)
                .Select(e => e.Name)
                .Distinct()
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch equipment for AI context");
            return new List<string>();
        }
    }

    private async Task<ComponentHealth> CheckMLHealthAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        var health = new ComponentHealth
        {
            Name = "ML.NET Classifier",
            IsHealthy = _fitnessLevelService.IsModelLoaded,
            LatencyMs = (int)stopwatch.ElapsedMilliseconds,
            LastChecked = DateTime.UtcNow,
            ErrorMessage = _fitnessLevelService.IsModelLoaded ? null : "Model not loaded"
        };
        return await Task.FromResult(health);
    }

    private async Task<List<string>> GetAvailableEquipmentListAsync()
    {
        try
        {
            var equipment = await _unitOfWork.Repository<Equipment>()
                .FindAsync(e => e.Status == EquipmentStatus.Available);
            return equipment.Select(e => e.Name).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve equipment list");
            return new List<string>();
        }
    }

    private async Task<ComponentHealth> CheckVisionHealthAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        bool healthy = await _visionAnalysisService.IsServiceHealthyAsync();
        return new ComponentHealth
        {
            Name = "Vision Server",
            IsHealthy = healthy,
            LatencyMs = (int)stopwatch.ElapsedMilliseconds,
            LastChecked = DateTime.UtcNow,
            ErrorMessage = healthy ? null : "Vision server unreachable"
        };
    }

    private async Task<ComponentHealth> CheckLLMHealthAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        bool healthy = await _llmWorkoutService.IsHealthyAsync();
        return new ComponentHealth
        {
            Name = "LLM Server",
            IsHealthy = healthy,
            LatencyMs = (int)stopwatch.ElapsedMilliseconds,
            LastChecked = DateTime.UtcNow,
            ErrorMessage = healthy ? null : "LLM server unreachable"
        };
    }

    private async Task<ComponentHealth> CheckEmbeddingHealthAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            var stats = await _ragService.GetStatsAsync();
            return new ComponentHealth
            {
                Name = "Embedding Server",
                IsHealthy = true,
                LatencyMs = (int)stopwatch.ElapsedMilliseconds,
                LastChecked = DateTime.UtcNow
            };
        }
        catch
        {
            return new ComponentHealth
            {
                Name = "Embedding Server",
                IsHealthy = false,
                LatencyMs = (int)stopwatch.ElapsedMilliseconds,
                LastChecked = DateTime.UtcNow,
                ErrorMessage = "Embedding server unreachable"
            };
        }
    }

    private AIWorkoutGenerationResult CreateErrorResult(string error)
    {
        return new AIWorkoutGenerationResult
        {
            IsSuccessful = false,
            ErrorMessage = error
        };
    }
}
