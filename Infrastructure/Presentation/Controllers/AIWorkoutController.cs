using IntelliFit.ServiceAbstraction.Services;
using Shared.DTOs.AI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace IntelliFit.Presentation.Controllers;

/// <summary>
/// API controller for AI-powered workout generation.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AIWorkoutController : ControllerBase
{
    private readonly IWorkoutOrchestrationService _orchestrationService;
    private readonly IFitnessLevelService _fitnessLevelService;

    public AIWorkoutController(
        IWorkoutOrchestrationService orchestrationService,
        IFitnessLevelService fitnessLevelService)
    {
        _orchestrationService = orchestrationService;
        _fitnessLevelService = fitnessLevelService;
    }

    /// <summary>
    /// Generates a complete AI-powered workout plan.
    /// </summary>
    [HttpPost("generate")]
    [Authorize]
    public async Task<ActionResult<AIWorkoutGenerationResult>> GenerateWorkoutPlan(
        [FromBody] GenerateWorkoutPlanApiRequest request)
    {
        // Get user ID from claims
        // Get user ID from claims - check NameIdentifier (standard), then UserId (custom), then sub (JWT)
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("UserId")?.Value 
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized("User ID not found in token");
        }

        var orchestrationRequest = new AIWorkoutGenerationRequest
        {
            UserId = userId,
            Age = request.Age,
            WeightKg = request.WeightKg,
            HeightCm = request.HeightCm,
            BodyFatPercentage = request.BodyFatPercentage,
            ExperienceYears = request.ExperienceYears,
            Goal = request.Goal,
            DaysPerWeek = request.DaysPerWeek,
            Injuries = request.Injuries ?? new List<string>(),
            EquipmentAccess = request.EquipmentAccess,
            BodyImageBase64 = request.BodyImageBase64,
            FitnessLevelOverride = request.FitnessLevelOverride
        };

        var result = await _orchestrationService.GenerateWorkoutPlanAsync(orchestrationRequest);

        if (!result.IsSuccessful)
        {
            return BadRequest(new { error = result.ErrorMessage ?? "Workout generation failed" });
        }

        return Ok(result);
    }

    /// <summary>
    /// Predicts fitness level from user profile data.
    /// </summary>
    [HttpPost("predict-fitness-level")]
    [Authorize]
    public async Task<ActionResult<FitnessLevelPredictionResult>> PredictFitnessLevel(
        [FromBody] PredictFitnessLevelApiRequest request)
    {
        if (!int.TryParse(User.FindFirst("UserId")?.Value ?? User.FindFirst("sub")?.Value, out int userId))
        {
            return Unauthorized("User ID not found in token");
        }

        var predictionRequest = new FitnessLevelPredictionRequest
        {
            UserId = userId,
            Age = request.Age,
            WeightKg = request.WeightKg,
            HeightCm = request.HeightCm,
            BodyFatPercentage = request.BodyFatPercentage,
            ExperienceYears = request.ExperienceYears
        };

        var result = await _fitnessLevelService.PredictAsync(predictionRequest);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }
        
        return Ok(result);
    }

    /// <summary>
    /// Checks health status of all AI components.
    /// </summary>
    [HttpGet("health")]
    public async Task<ActionResult<PipelineHealthStatus>> GetHealth()
    {
        var status = await _orchestrationService.CheckPipelineHealthAsync();
        
        if (status.IsHealthy)
        {
            return Ok(status);
        }
        
        return StatusCode(503, status);
    }
}


/// <summary>
/// API request for generating a workout plan.
/// </summary>
public class GenerateWorkoutPlanApiRequest
{
    [Required]
    [Range(1, 120)]
    public float Age { get; set; }
    
    [Required]
    [Range(1, 500)]
    public float WeightKg { get; set; }
    
    [Required]
    [Range(30, 300)]
    public float HeightCm { get; set; }
    
    [Range(0, 100)]
    public float BodyFatPercentage { get; set; } = 20f;
    
    [Range(0, 50)]
    public float ExperienceYears { get; set; } = 0f;
    
    [Required]
    [StringLength(100)]
    public string Goal { get; set; } = "muscle gain";
    
    [Required]
    [Range(1, 7)]
    public int DaysPerWeek { get; set; } = 3;
    
    public List<string>? Injuries { get; set; }
    
    [StringLength(200)]
    public string? EquipmentAccess { get; set; }
    
    [MaxLength(10_000_000)] // ~7.5MB max decoded image (base64 is ~33% larger than binary)
    public string? BodyImageBase64 { get; set; }
    
    [StringLength(50)]
    public string? FitnessLevelOverride { get; set; }
}

/// <summary>
/// API request for fitness level prediction.
/// </summary>
public class PredictFitnessLevelApiRequest
{
    [Required]
    [Range(1, 120)]
    public float Age { get; set; }
    
    [Required]
    [Range(1, 500)]
    public float WeightKg { get; set; }
    
    [Required]
    [Range(30, 300)]
    public float HeightCm { get; set; }
    
    [Range(0, 100)]
    public float BodyFatPercentage { get; set; } = 20f;
    
    [Range(0, 50)]
    public float ExperienceYears { get; set; } = 0f;
}
