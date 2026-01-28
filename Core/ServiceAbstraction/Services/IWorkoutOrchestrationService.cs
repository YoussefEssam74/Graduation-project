using IntelliFit.Domain.Enums;
using Shared.DTOs.AI;

namespace IntelliFit.ServiceAbstraction.Services;

/// <summary>
/// Orchestration service that coordinates the complete AI workout generation pipeline
/// Handles the full flow: Profile → Classification → Vision → RAG → LLM → Validation → Persistence
/// </summary>
public interface IWorkoutOrchestrationService
{
    /// <summary>
    /// Generate a complete AI-powered workout plan
    /// This is the main entry point that orchestrates all components
    /// </summary>
    Task<AIWorkoutGenerationResult> GenerateWorkoutPlanAsync(AIWorkoutGenerationRequest request);
    
    /// <summary>
    /// Get generation status (for async/background generation)
    /// </summary>
    Task<GenerationStatus?> GetGenerationStatusAsync(int logId);
    
    /// <summary>
    /// Cancel an in-progress generation
    /// </summary>
    Task<bool> CancelGenerationAsync(int logId);
    
    /// <summary>
    /// Provide feedback on a generated plan
    /// </summary>
    Task<bool> ProvideFeedbackAsync(int logId, int rating, string? feedback);
    
    /// <summary>
    /// Get the user's generation history
    /// </summary>
    Task<List<GenerationHistoryItem>> GetGenerationHistoryAsync(int userId, int page = 1, int pageSize = 10);
    
    /// <summary>
    /// Check overall pipeline health
    /// </summary>
    Task<PipelineHealthStatus> CheckPipelineHealthAsync();
}

/// <summary>
/// Status of an ongoing generation
/// </summary>
public class GenerationStatus
{
    public int LogId { get; set; }
    public string Status { get; set; } = null!; // Pending, ClassifyingFitness, AnalyzingImage, RetrievingContext, Generating, Validating, Completed, Failed
    public int ProgressPercentage { get; set; }
    public string CurrentStep { get; set; } = null!;
    public DateTime StartedAt { get; set; }
    public int ElapsedMs { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Historical generation item
/// </summary>
public class GenerationHistoryItem
{
    public int LogId { get; set; }
    public int? WorkoutPlanId { get; set; }
    public string? PlanName { get; set; }
    public bool IsSuccessful { get; set; }
    public FitnessLevel PredictedLevel { get; set; }
    public int AttemptCount { get; set; }
    public int ProcessingTimeMs { get; set; }
    public int? UserRating { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Health status of the AI pipeline components
/// </summary>
public class PipelineHealthStatus
{
    public bool IsHealthy { get; set; }
    public ComponentHealth MLNetClassifier { get; set; } = new();
    public ComponentHealth VisionServer { get; set; } = new();
    public ComponentHealth EmbeddingServer { get; set; } = new();
    public ComponentHealth LLMServer { get; set; } = new();
    public ComponentHealth Database { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// Health of an individual component
/// </summary>
public class ComponentHealth
{
    public string Name { get; set; } = null!;
    public bool IsHealthy { get; set; }
    public int LatencyMs { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime LastChecked { get; set; }
}
