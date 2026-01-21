using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction;
using IntelliFit.ServiceAbstraction;
using Shared.DTOs;
using Shared.DTOs.AI;
using IntelliFit.Shared.DTOs.Payment;
using System.Diagnostics;

namespace Presentation.Controllers
{
    // [Authorize] // Temporarily disabled for testing
    [ApiController]
    [Route("api/ai")]
    public class AIController(IServiceManager _serviceManager, ILogger<AIController> _logger, IConfiguration _configuration) : ApiControllerBase
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

                // Check user has sufficient tokens (50 tokens required)
                var currentBalance = await _serviceManager.TokenTransactionService.GetUserTokenBalanceAsync(request.UserId);
                if (currentBalance < 50)
                {
                    return BadRequest(new { success = false, message = $"Insufficient token balance. You need 50 tokens but have {currentBalance}." });
                }

                var result = await _serviceManager.AIService.GenerateWorkoutPlanAsync(request);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                // Deduct 50 tokens from user balance
                try
                {
                    await _serviceManager.TokenTransactionService.CreateTransactionAsync(
                        userId: request.UserId,
                        dto: new CreateTokenTransactionDto
                        {
                            Amount = -50,
                            TransactionType = "Deduction",
                            Description = "AI Generated Workout Plan",
                            ReferenceType = "WorkoutPlan"
                        }
                    );
                }
                catch (Exception tokenEx)
                {
                    _logger.LogError(tokenEx, "Failed to deduct tokens for user {UserId}", request.UserId);
                    return StatusCode(500, new { success = false, message = "Failed to process token transaction" });
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
                        newBalance = currentBalance - 50,
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

                // Check user has sufficient tokens (50 tokens required)
                var currentBalance = await _serviceManager.TokenTransactionService.GetUserTokenBalanceAsync(request.UserId);
                if (currentBalance < 50)
                {
                    return BadRequest(new { success = false, message = $"Insufficient token balance. You need 50 tokens but have {currentBalance}." });
                }

                var result = await _serviceManager.AIService.GenerateNutritionPlanAsync(request);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                // Deduct 50 tokens from user balance
                try
                {
                    await _serviceManager.TokenTransactionService.CreateTransactionAsync(
                        userId: request.UserId,
                        dto: new CreateTokenTransactionDto
                        {
                            Amount = -50,
                            TransactionType = "Deduction",
                            Description = "AI Generated Nutrition Plan",
                            ReferenceType = "NutritionPlan"
                        }
                    );
                }
                catch (Exception tokenEx)
                {
                    _logger.LogError(tokenEx, "Failed to deduct tokens for user {UserId}", request.UserId);
                    return StatusCode(500, new { success = false, message = "Failed to process token transaction" });
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
                        newBalance = currentBalance - 50,
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
        /// Chat with AI fitness coach using Groq (llama-3.3-70b-versatile)
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

                _logger.LogInformation("AI chat request from user {UserId}", request.UserId);

                // Check user has sufficient tokens
                var currentBalance = await _serviceManager.TokenTransactionService.GetUserTokenBalanceAsync(request.UserId);
                if (currentBalance < 1)
                {
                    return BadRequest(new { success = false, message = "Insufficient token balance. You need at least 1 token to chat with AI." });
                }

                // Track response time
                var stopwatch = Stopwatch.StartNew();
                var response = await _serviceManager.AIService.ChatWithAIAsync(request.Message, request.UserId);
                stopwatch.Stop();

                // Deduct 1 token from user balance
                try
                {
                    await _serviceManager.TokenTransactionService.CreateTransactionAsync(
                        userId: request.UserId,
                        dto: new CreateTokenTransactionDto
                        {
                            Amount = -1,
                            TransactionType = "Deduction",
                            Description = "AI Chat - Gemini conversation",
                            ReferenceType = "AIChat"
                        }
                    );
                }
                catch (Exception tokenEx)
                {
                    _logger.LogError(tokenEx, "Failed to deduct tokens for user {UserId}", request.UserId);
                    return StatusCode(500, new { success = false, message = "Failed to process token transaction" });
                }

                // Use provided sessionId or generate new one based on user ID and timestamp
                int sessionId;
                if (request.SessionId.HasValue && request.SessionId.Value > 0)
                {
                    sessionId = request.SessionId.Value;
                }
                else
                {
                    // Generate unique session ID: userId + timestamp hash
                    sessionId = Math.Abs((request.UserId.ToString() + DateTime.UtcNow.Ticks).GetHashCode());
                }

                // Save the chat interaction to the database
                try
                {
                    _logger.LogInformation("Attempting to save chat interaction for user {UserId}, session {SessionId}", request.UserId, sessionId);

                    await _serviceManager.AIChatService.SaveChatInteractionAsync(
                        userId: request.UserId,
                        userMessage: request.Message,
                        aiResponse: response,
                        tokensUsed: 1,
                        responseTimeMs: (int)stopwatch.ElapsedMilliseconds,
                        sessionId: sessionId
                    );

                    _logger.LogInformation("Successfully saved chat interaction for user {UserId}, session {SessionId}", request.UserId, sessionId);
                }
                catch (Exception saveEx)
                {
                    // Log the full exception details
                    _logger.LogError(saveEx, "CRITICAL: Failed to save chat interaction for user {UserId}. Error: {ErrorMessage}. StackTrace: {StackTrace}",
                        request.UserId, saveEx.Message, saveEx.StackTrace);

                    // Don't fail the request but include warning in response
                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            response,
                            tokensSpent = 1,
                            responseTimeMs = stopwatch.ElapsedMilliseconds,
                            newBalance = currentBalance - 1,
                            sessionId = sessionId,
                            warning = "Chat was not saved due to a database error. Please contact support."
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        response,
                        tokensSpent = 1,
                        responseTimeMs = stopwatch.ElapsedMilliseconds,
                        newBalance = currentBalance - 1,
                        sessionId = sessionId
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AI chat for user {UserId}", request.UserId);
                return StatusCode(500, new { success = false, message = "An error occurred during the chat" });
            }
        }
        #endregion

        /// <summary>
        /// Get all chat sessions for a user
        /// GET: api/ai/sessions/{userId}
        /// </summary>
        [HttpGet("sessions/{userId}")]
        public async Task<IActionResult> GetChatSessions(int userId)
        {
            try
            {
                var sessions = await _serviceManager.AIChatService.GetChatSessionsAsync(userId);
                return Ok(new { success = true, sessions });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat sessions for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Failed to get chat sessions" });
            }
        }

        /// <summary>
        /// Get all messages for a specific session
        /// GET: api/ai/sessions/{userId}/{sessionId}
        /// </summary>
        [HttpGet("sessions/{userId}/{sessionId}")]
        public async Task<IActionResult> GetSessionMessages(int userId, int sessionId)
        {
            try
            {
                var messages = await _serviceManager.AIChatService.GetSessionMessagesAsync(userId, sessionId);
                return Ok(new { success = true, messages });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting session messages for user {UserId}, session {SessionId}", userId, sessionId);
                return StatusCode(500, new { success = false, message = "Failed to get session messages" });
            }
        }

        #region ML-Powered Workout Generator
        /// <summary>
        /// Generate a workout plan using ML service (uses 7,959 real exercises from CSV dataset)
        /// POST: api/ai/ml-workout
        /// Cost: 30 tokens
        /// </summary>
        [HttpPost("ml-workout")]
        public async Task<IActionResult> GenerateMLWorkout([FromBody] MLWorkoutGenerationRequest request)
        {
            const int ML_WORKOUT_TOKEN_COST = 30;

            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Invalid request data", errors = ModelState });
                }

                _logger.LogInformation("Generating ML workout plan for user {UserId}", request.UserId);

                // Check user has sufficient tokens (30 tokens required)
                var currentBalance = await _serviceManager.TokenTransactionService.GetUserTokenBalanceAsync(request.UserId);
                if (currentBalance < ML_WORKOUT_TOKEN_COST)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"Insufficient token balance. You need {ML_WORKOUT_TOKEN_COST} tokens but have {currentBalance}."
                    });
                }

                // Call the ML service
                var mlServiceUrl = _configuration["MLService:WorkoutGeneratorUrl"] ?? "http://localhost:5010";
                using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };

                var mlRequest = new
                {
                    user_id = request.UserId,
                    profile = new
                    {
                        fitness_level = request.Profile.FitnessLevel,
                        goal = request.Profile.Goal,
                        days_per_week = request.Profile.DaysPerWeek,
                        injuries = request.Profile.Injuries ?? new List<string>(),
                        allergies = request.Profile.Allergies ?? new List<string>(),
                        preferred_equipment = request.Profile.PreferredEquipment ?? new List<string>()
                    },
                    plan_duration_weeks = request.PlanDurationWeeks
                };

                var jsonContent = System.Text.Json.JsonSerializer.Serialize(mlRequest);
                var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

                _logger.LogInformation("Calling ML service at {Url}", $"{mlServiceUrl}/generate");
                var response = await httpClient.PostAsync($"{mlServiceUrl}/generate", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("ML service returned {StatusCode}: {Body}", response.StatusCode, responseBody);
                    return BadRequest(new
                    {
                        success = false,
                        message = "Failed to generate workout plan from ML service",
                        error = responseBody
                    });
                }

                var mlResponse = System.Text.Json.JsonSerializer.Deserialize<MLWorkoutGenerationResponse>(
                    responseBody,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (mlResponse == null || mlResponse.Status != "success")
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "ML service returned invalid response"
                    });
                }

                // Deduct tokens from user balance
                try
                {
                    await _serviceManager.TokenTransactionService.CreateTransactionAsync(
                        userId: request.UserId,
                        dto: new CreateTokenTransactionDto
                        {
                            Amount = -ML_WORKOUT_TOKEN_COST,
                            TransactionType = "Deduction",
                            Description = "ML-Generated Workout Plan",
                            ReferenceType = "MLWorkoutPlan"
                        }
                    );
                }
                catch (Exception tokenEx)
                {
                    _logger.LogError(tokenEx, "Failed to deduct tokens for user {UserId}", request.UserId);
                    return StatusCode(500, new { success = false, message = "Failed to process token transaction" });
                }

                // Save the workout plan to database
                int? savedPlanId = null;
                try
                {
                    var createPlanDto = new Shared.DTOs.WorkoutPlan.CreateAIWorkoutPlanDto
                    {
                        UserId = request.UserId,
                        PlanName = $"AI Workout Plan - {request.Profile.Goal.Replace("_", " ").ToUpperInvariant()}",
                        Description = $"ML-generated {mlResponse.Plan.SplitType} workout plan for {request.Profile.Goal.Replace("_", " ")} goal",
                        DifficultyLevel = request.Profile.FitnessLevel,
                        DurationWeeks = request.PlanDurationWeeks,
                        DaysPerWeek = request.Profile.DaysPerWeek,
                        Goal = request.Profile.Goal,
                        SplitType = mlResponse.Plan.SplitType,
                        MlPlanJson = responseBody, // Store full ML response as JSON
                        TokensSpent = ML_WORKOUT_TOKEN_COST
                    };

                    var savedPlan = await _serviceManager.WorkoutPlanService.CreateAIWorkoutPlanAsync(createPlanDto);
                    savedPlanId = savedPlan?.PlanId;
                    _logger.LogInformation("Saved ML workout plan with ID {PlanId} for user {UserId}", savedPlanId, request.UserId);
                }
                catch (Exception saveEx)
                {
                    _logger.LogError(saveEx, "Failed to save ML workout plan to database for user {UserId}", request.UserId);
                    // Don't fail the request - plan generation was successful, just log the save error
                }

                return Ok(new
                {
                    success = true,
                    message = "ML workout plan generated successfully",
                    data = new
                    {
                        planId = savedPlanId,
                        plan = mlResponse.Plan,
                        exercisesAvailable = mlResponse.ExercisesAvailable,
                        safetySummary = mlResponse.SafetySummary,
                        tokensSpent = ML_WORKOUT_TOKEN_COST,
                        newBalance = currentBalance - ML_WORKOUT_TOKEN_COST
                    }
                });
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to connect to ML service");
                return StatusCode(503, new
                {
                    success = false,
                    message = "ML workout service is currently unavailable. Please try again later."
                });
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "ML service request timed out");
                return StatusCode(504, new
                {
                    success = false,
                    message = "Workout generation timed out. Please try again."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating ML workout plan");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while generating the workout plan"
                });
            }
        }

        /// <summary>
        /// Check ML service health status
        /// GET: api/ai/ml-health
        /// </summary>
        [HttpGet("ml-health")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckMLHealth()
        {
            try
            {
                var mlServiceUrl = _configuration["MLService:WorkoutGeneratorUrl"] ?? "http://localhost:5010";
                using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };

                var response = await httpClient.GetAsync($"{mlServiceUrl}/health");
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var healthData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(responseBody);
                    return Ok(new
                    {
                        success = true,
                        status = "healthy",
                        mlService = healthData
                    });
                }

                return Ok(new
                {
                    success = false,
                    status = "unhealthy",
                    message = "ML service is not responding correctly"
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "ML service health check failed");
                return Ok(new
                {
                    success = false,
                    status = "unavailable",
                    message = "ML service is not running"
                });
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
                    "POST /api/ai/gemini-chat - Chat with Gemini AI coach (1 token per message)",
                    "POST /api/ai/ml-workout - Generate ML-powered workout plan (30 tokens)",
                    "GET /api/ai/ml-health - Check ML service health",
                    "GET /api/ai/sessions/{userId} - Get all chat sessions for user",
                    "GET /api/ai/sessions/{userId}/{sessionId} - Get messages for specific session",
                    "POST /api/ai/test-save - Test saving chat interaction"
                }
            });
        }

        /// <summary>
        /// Test endpoint to verify chat saving functionality
        /// POST: api/ai/test-save
        /// </summary>
        [HttpPost("test-save")]
        [AllowAnonymous]
        public async Task<IActionResult> TestSave([FromBody] TestSaveRequest request)
        {
            try
            {
                var sessionId = Math.Abs((request.UserId.ToString() + DateTime.UtcNow.Ticks).GetHashCode());
                _logger.LogInformation("Testing save for user {UserId}", request.UserId);

                await _serviceManager.AIChatService.SaveChatInteractionAsync(
                    userId: request.UserId,
                    userMessage: "Test user message",
                    aiResponse: "Test AI response",
                    tokensUsed: 1,
                    responseTimeMs: 100,
                    sessionId: sessionId
                );

                // Try to retrieve what we just saved
                var sessions = await _serviceManager.AIChatService.GetChatSessionsAsync(request.UserId);
                var sessionsList = sessions.ToList();

                return Ok(new
                {
                    success = true,
                    message = "Save test completed",
                    savedSessionId = sessionId,
                    retrievedSessionsCount = sessionsList.Count,
                    sessions = sessionsList
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Test save failed for user {UserId}", request.UserId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Test save failed",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
        #endregion
    }

    public class TestSaveRequest
    {
        public int UserId { get; set; }
    }

    /// <summary>
    /// DTO for Gemini AI chat request
    /// </summary>
    public class GeminiChatRequest
    {
        public int UserId { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? SessionId { get; set; }
    }
}
