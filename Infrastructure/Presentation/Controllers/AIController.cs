using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction;
using IntelliFit.ServiceAbstraction;
using Shared.DTOs;
using Shared.DTOs.AI;

namespace Presentation.Controllers
{
    // [Authorize] // Temporarily disabled for testing
    [ApiController]
    [Route("api/ai")]
    public class AIController(IServiceManager _serviceManager, ILogger<AIController> _logger) : ApiControllerBase
    {
        #region Chat
        [HttpPost("chat")]
        public async Task<IActionResult> SendMessage([FromBody] AIChatRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _serviceManager.AIChatService.SendMessageAsync(request);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetChatHistory(int userId, [FromQuery] int limit = 50)
        {
            var history = await _serviceManager.AIChatService.GetChatHistoryAsync(userId, limit);
            return Ok(history);
        }
        #endregion

        #region Generate Plans
        /// <summary>
        /// Generate an AI-powered workout plan using Google Gemini
        /// POST: api/ai/generate-workout-plan
        /// Cost: 50 tokens
        /// </summary>
        [HttpPost("generate-workout-plan")]
        public async Task<IActionResult> GenerateWorkoutPlan([FromBody] GenerateWorkoutPlanRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Invalid request data", errors = ModelState });
                }

                _logger.LogInformation("Generating workout plan for user {UserId}", request.UserId);

                var result = await _serviceManager.AIService.GenerateWorkoutPlanAsync(request);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                return Ok(new
                {
                    success = true,
                    message = "Workout plan generated successfully",
                    data = new
                    {
                        planName = result.PlanName,
                        schedule = result.Schedule,
                        exercises = result.Exercises,
                        tokensSpent = result.TokensSpent,
                        note = "This AI-generated plan is pending coach approval"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating workout plan");
                return StatusCode(500, new { success = false, message = "An error occurred while generating the workout plan" });
            }
        }

        /// <summary>
        /// Generate an AI-powered nutrition plan using Google Gemini
        /// POST: api/ai/generate-nutrition-plan
        /// Cost: 50 tokens
        /// </summary>
        [HttpPost("generate-nutrition-plan")]
        public async Task<IActionResult> GenerateNutritionPlan([FromBody] GenerateNutritionPlanRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Invalid request data", errors = ModelState });
                }

                _logger.LogInformation("Generating nutrition plan for user {UserId}", request.UserId);

                var result = await _serviceManager.AIService.GenerateNutritionPlanAsync(request);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                return Ok(new
                {
                    success = true,
                    message = "Nutrition plan generated successfully",
                    data = new
                    {
                        planName = result.PlanName,
                        dailyCalories = result.DailyCalories,
                        meals = result.Meals,
                        tokensSpent = result.TokensSpent,
                        note = "This AI-generated plan is pending coach approval"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating nutrition plan");
                return StatusCode(500, new { success = false, message = "An error occurred while generating the nutrition plan" });
            }
        }
        #endregion

        #region Gemini Chat
        /// <summary>
        /// Chat with AI fitness coach using Google Gemini
        /// POST: api/ai/gemini-chat
        /// Cost: 1 token per message
        /// </summary>
        [HttpPost("gemini-chat")]
        public async Task<IActionResult> GeminiChat([FromBody] GeminiChatRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Message))
                {
                    return BadRequest(new { success = false, message = "Message cannot be empty" });
                }

                _logger.LogInformation("Gemini AI chat request from user {UserId}", request.UserId);

                var response = await _serviceManager.AIService.ChatWithAIAsync(request.Message, request.UserId);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        response,
                        tokensSpent = 1
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Gemini AI chat");
                return StatusCode(500, new { success = false, message = "An error occurred during the chat" });
            }
        }
        #endregion

        #region Test
        /// <summary>
        /// Test endpoint to verify AI service is working
        /// GET: api/ai/test
        /// </summary>
        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test()
        {
            return Ok(new
            {
                success = true,
                message = "AI Service is running with Google Gemini",
                availableEndpoints = new[]
                {
                    "POST /api/ai/chat - Legacy AI chat",
                    "POST /api/ai/generate-workout-plan - Generate AI workout plan (50 tokens)",
                    "POST /api/ai/generate-nutrition-plan - Generate AI nutrition plan (50 tokens)",
                    "POST /api/ai/gemini-chat - Chat with Gemini AI coach (1 token per message)"
                }
            });
        }
        #endregion
    }

    /// <summary>
    /// DTO for Gemini AI chat request
    /// </summary>
    public class GeminiChatRequest
    {
        public int UserId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
