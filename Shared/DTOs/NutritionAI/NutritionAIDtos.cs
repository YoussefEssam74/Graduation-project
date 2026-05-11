using System.Text.Json.Serialization;

namespace Shared.DTOs.NutritionAI;

// ── Request ──────────────────────────────────────────────────────────────────

/// <summary>
/// Request to generate an AI nutrition plan (matches serve_nutrition.py NutritionRequest).
/// </summary>
public class NutritionAIRequest
{
    [JsonPropertyName("member_id")]
    public string? MemberId { get; set; }

    [JsonPropertyName("gender")]
    public string Gender { get; set; } = "male";

    [JsonPropertyName("age")]
    public int Age { get; set; } = 25;

    [JsonPropertyName("weight_kg")]
    public float WeightKg { get; set; } = 75;

    [JsonPropertyName("height_cm")]
    public float HeightCm { get; set; } = 175;

    /// <summary>weight_loss | muscle_gain | maintenance | body_recomposition</summary>
    [JsonPropertyName("goal")]
    public string Goal { get; set; } = "maintenance";

    /// <summary>sedentary | light | moderate | active | very_active</summary>
    [JsonPropertyName("activity_level")]
    public string ActivityLevel { get; set; } = "moderate";

    [JsonPropertyName("health_conditions")]
    public List<string> HealthConditions { get; set; } = new();

    [JsonPropertyName("allergies")]
    public List<string> Allergies { get; set; } = new();

    /// <summary>egyptian | international</summary>
    [JsonPropertyName("cuisine_preference")]
    public string CuisinePreference { get; set; } = "egyptian";

    [JsonPropertyName("inbody")]
    public NutritionInBodyData? Inbody { get; set; }
}

public class NutritionInBodyData
{
    [JsonPropertyName("body_fat_percentage")]
    public float? BodyFatPercentage { get; set; }

    [JsonPropertyName("muscle_mass_kg")]
    public float? MusclesMassKg { get; set; }

    [JsonPropertyName("visceral_fat_level")]
    public int? VisceralFatLevel { get; set; }

    [JsonPropertyName("bmr_kcal")]
    public float? BmrKcal { get; set; }

    [JsonPropertyName("body_water_percentage")]
    public float? BodyWaterPercentage { get; set; }

    [JsonPropertyName("metabolic_age")]
    public int? MetabolicAge { get; set; }
}

// ── Response ─────────────────────────────────────────────────────────────────

/// <summary>
/// Response from the nutrition HF Space (matches serve_nutrition.py NutritionResponse).
/// </summary>
public class NutritionAIResponse
{
    [JsonPropertyName("member_id")]
    public string? MemberId { get; set; }

    [JsonPropertyName("generated_at")]
    public string? GeneratedAt { get; set; }

    [JsonPropertyName("daily_calories")]
    public int DailyCalories { get; set; }

    /// <summary>The raw 3-day plan object from the model.</summary>
    [JsonPropertyName("plan")]
    public System.Text.Json.JsonElement? Plan { get; set; }

    [JsonPropertyName("generation_ms")]
    public int GenerationMs { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }

    [JsonIgnore]
    public bool IsSuccess => Error == null && Plan.HasValue;
}

// ── API Layer DTOs ────────────────────────────────────────────────────────────

/// <summary>Controller-level request from Flutter/Next.js frontend.</summary>
public class GenerateAINutritionPlanRequest
{
    public int MemberId { get; set; }
    public string Gender { get; set; } = "male";
    public int Age { get; set; }
    public float WeightKg { get; set; }
    public float HeightCm { get; set; }

    /// <summary>weight_loss | muscle_gain | maintenance | body_recomposition</summary>
    public string Goal { get; set; } = "maintenance";

    /// <summary>sedentary | light | moderate | active | very_active</summary>
    public string ActivityLevel { get; set; } = "moderate";

    public List<string> HealthConditions { get; set; } = new();
    public List<string> Allergies { get; set; } = new();

    /// <summary>egyptian | international</summary>
    public string CuisinePreference { get; set; } = "egyptian";

    /// <summary>Optional InBody data from the latest member measurement.</summary>
    public NutritionInBodyData? Inbody { get; set; }
}

/// <summary>Controller-level response returned to the frontend.</summary>
public class AINutritionPlanResult
{
    public bool Success { get; set; }
    public int DailyCalories { get; set; }
    public object? Plan { get; set; }
    public int GenerationMs { get; set; }
    public string? GeneratedAt { get; set; }
    public string? Error { get; set; }
}
