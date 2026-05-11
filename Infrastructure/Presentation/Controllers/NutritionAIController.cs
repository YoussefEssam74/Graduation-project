using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction.Services;
using Shared.DTOs.NutritionAI;

namespace IntelliFit.Presentation.Controllers;

/// <summary>
/// Nutrition AI Controller — proxies to the HF Space via NutritionAIServiceClient.
///
/// HF Space predict() returns:
///   { daily_calories, plan: { days: [...], foods_to_avoid: [...] }, generation_ms }
///
/// This controller flattens it so the frontend receives:
///   { success, daily_calories, days: [...], foods_to_avoid: [...], generation_ms }
/// </summary>
[ApiController]
[Route("api/nutrition-ai")]
[Authorize]
public class NutritionAIController : ControllerBase
{
    private readonly INutritionAIServiceClient _nutritionAI;
    private readonly ILogger<NutritionAIController> _logger;

    public NutritionAIController(
        INutritionAIServiceClient nutritionAI,
        ILogger<NutritionAIController> logger)
    {
        _nutritionAI = nutritionAI;
        _logger = logger;
    }

    /// <summary>
    /// Generate a personalized AI nutrition plan via the HF Space.
    /// Accepts the NutritionMLRequest JSON shape from the Next.js frontend.
    /// </summary>
    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] NutritionAIRequest request)
    {
        _logger.LogInformation(
            "Nutrition AI: goal={Goal}, activity={Activity}, gender={Gender}, member={Member}",
            request.Goal, request.ActivityLevel, request.Gender, request.MemberId);

        var result = await _nutritionAI.GenerateNutritionPlanAsync(request);

        if (result == null)
        {
            _logger.LogError("Nutrition AI service returned null");
            return StatusCode(502, new { success = false, error = "Nutrition AI service returned null" });
        }

        if (result.Error != null)
        {
            _logger.LogWarning("Nutrition AI error: {Error}", result.Error);
            return StatusCode(502, new { success = false, error = result.Error });
        }

        // ── Flatten the nested plan structure ──────────────────────────────────
        // HF Space: { daily_calories, plan: { days:[...], foods_to_avoid:[...] } }
        // Frontend expects: { success, daily_calories, days:[...], foods_to_avoid:[...] }
        var days = new List<JsonElement>();
        var foodsToAvoid = new List<string>();

        if (result.Plan.HasValue)
        {
            var planEl = result.Plan.Value;

            if (planEl.TryGetProperty("days", out var daysEl) &&
                daysEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var day in daysEl.EnumerateArray())
                    days.Add(day.Clone());
            }

            if (planEl.TryGetProperty("foods_to_avoid", out var avoidEl) &&
                avoidEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in avoidEl.EnumerateArray())
                    if (item.GetString() is { } s) foodsToAvoid.Add(s);
            }
        }

        _logger.LogInformation(
            "Nutrition plan generated: {Days} days, {Kcal} kcal, {Ms}ms",
            days.Count, result.DailyCalories, result.GenerationMs);

        return Ok(new
        {
            success = true,
            daily_calories = result.DailyCalories,
            days,
            foods_to_avoid = foodsToAvoid,
            generation_ms = result.GenerationMs,
            generated_at = result.GeneratedAt ?? DateTime.UtcNow.ToString("o"),
        });
    }

    /// <summary>Health check for the Nutrition HF Space.</summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<IActionResult> Health()
    {
        var healthy = await _nutritionAI.IsHealthyAsync();
        return Ok(new { status = healthy ? "healthy" : "unavailable" });
    }
}
