using Shared.DTOs;

namespace IntelliFit.ServiceAbstraction;

/// <summary>
/// Service for AI-powered workout and nutrition plan generation using Groq Llama-3.3-70b
/// </summary>
public interface IAIService
{
    /// <summary>
    /// Generate a personalized workout plan using AI based on user preferences
    /// </summary>
    Task<WorkoutPlanGenerationResult> GenerateWorkoutPlanAsync(GenerateWorkoutPlanRequest request);

    /// <summary>
    /// Generate a personalized nutrition plan using AI based on user preferences
    /// </summary>
    Task<NutritionPlanGenerationResult> GenerateNutritionPlanAsync(GenerateNutritionPlanRequest request);

    /// <summary>
    /// Chat with AI fitness coach.
    /// Optionally supply a pre-built <paramref name="userContext"/> (from IAIContextBuilderService)
    /// and previous <paramref name="conversationHistory"/> so the model has full session memory.
    /// </summary>
    /// <param name="userMessage">The user's current message.</param>
    /// <param name="userId">ID of the calling user (used for logging).</param>
    /// <param name="userContext">Optional structured context block (workout plan, nutrition, InBody, strength).</param>
    /// <param name="conversationHistory">Prior turns in the session formatted as "Role: Content" lines.</param>
    Task<string> ChatWithAIAsync(
        string userMessage,
        int userId,
        string? userContext = null,
        IEnumerable<(string role, string content)>? conversationHistory = null);
}
