using Shared.DTOs.NutritionAI;

namespace ServiceAbstraction.Services;

/// <summary>
/// Interface for the Nutrition AI HTTP client that calls the Hugging Face Space.
/// </summary>
public interface INutritionAIServiceClient
{
    Task<NutritionAIResponse?> GenerateNutritionPlanAsync(NutritionAIRequest request);
    Task<bool> IsHealthyAsync();
}
