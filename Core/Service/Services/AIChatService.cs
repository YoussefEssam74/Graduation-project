using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.AI;
using Shared.DTOs.WorkoutAI;

namespace Service.Services
{
    public class AIChatService : IAIChatService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAIService _aiService;
        private readonly IAIContextBuilderService _contextBuilder;
        private readonly IWorkoutAIService _workoutAIService;
        private readonly IExerciseRagService _exerciseRag;
        private readonly ILogger<AIChatService> _logger;

        // How many prior message-pairs to include as conversation history for each request
        private const int ConversationHistoryPairs = 10;

        // Gap 1: keywords that signal the user wants a brand-new workout plan generated
        private static readonly string[] _workoutGenTriggers =
        [
            "generate", "create", "make", "give me", "build", "new"
        ];
        private static readonly string[] _workoutPlanKeywords =
        [
            "workout plan", "training plan", "exercise plan", "new plan", "gym plan"
        ];

        public AIChatService(
            IUnitOfWork unitOfWork,
            IAIService aiService,
            IAIContextBuilderService contextBuilder,
            IWorkoutAIService workoutAIService,
            IExerciseRagService exerciseRag,
            ILogger<AIChatService> logger)
        {
            _unitOfWork = unitOfWork;
            _aiService = aiService;
            _contextBuilder = contextBuilder;
            _workoutAIService = workoutAIService;
            _exerciseRag = exerciseRag;
            _logger = logger;
        }

        public async Task<AIChatResponseDto> SendMessageAsync(AIChatRequestDto request)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(request.UserId);
            if (user == null)
                throw new KeyNotFoundException($"User with ID {request.UserId} not found.");

            // --- Session resolution ---
            int sessionId;
            if (request.SessionId.HasValue)
            {
                sessionId = request.SessionId.Value;
            }
            else
            {
                var recentLogs = await _unitOfWork.Repository<AiChatLog>()
                    .FindAsync(l => l.UserId == request.UserId);

                var latestLog = recentLogs
                    .OrderByDescending(l => l.CreatedAt)
                    .FirstOrDefault();

                var todayStart = DateTime.UtcNow.Date;
                if (latestLog != null && latestLog.CreatedAt >= todayStart)
                    sessionId = latestLog.SessionId;
                else
                    sessionId = Math.Abs((request.UserId.ToString() + DateTime.UtcNow.Ticks).GetHashCode());
            }

            // --- Build conversation history for this session ---
            var sessionLogs = (await _unitOfWork.Repository<AiChatLog>()
                .FindAsync(l => l.UserId == request.UserId && l.SessionId == sessionId))
                .OrderBy(l => l.CreatedAt)
                .ToList();

            var historyWindow = sessionLogs
                .TakeLast(ConversationHistoryPairs * 2)
                .Select(l => (role: l.MessageType == "user" ? "user" : "assistant",
                              content: l.MessageContent))
                .ToList();

            // --- Build user context (workout plan, nutrition, InBody, strength) ---
            string userContext;
            try
            {
                userContext = await _contextBuilder.BuildUserContextAsync(request.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Context build failed for user {UserId}, continuing without context", request.UserId);
                userContext = string.Empty;
            }

            // --- Call Groq with full context ---
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            // --- Gap 1: Intent routing → Qwen2.5 workout plan generation ---
            if (IsWorkoutGenerationIntent(request.Query))
            {
                var planSummary = await TryGenerateWorkoutPlanAsync(request.UserId, request.Query);
                if (planSummary != null)
                    userContext = planSummary + "\n\n" + userContext;
            }

            // --- Gaps 2+3: Exercise RAG – inject curated steps / DB exercise info ---
            try
            {
                var exerciseContext = await _exerciseRag.FindRelevantExerciseInfoAsync(request.Query);
                if (exerciseContext != null)
                    userContext = userContext + "\n\n" + exerciseContext;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Exercise RAG lookup failed, continuing without exercise context");
            }

            var responseText = await _aiService.ChatWithAIAsync(
                request.Query,
                request.UserId,
                userContext,
                historyWindow);

            stopwatch.Stop();
            var responseTimeMs = (int)stopwatch.ElapsedMilliseconds;

            var tokensUsed = (request.Query.Length + responseText.Length) / 4;

            // --- Persist both turns ---
            var now = DateTime.UtcNow;

            await _unitOfWork.Repository<AiChatLog>().AddAsync(new AiChatLog
            {
                UserId = request.UserId,
                SessionId = sessionId,
                MessageType = "user",
                MessageContent = request.Query,
                TokensUsed = 0,
                ResponseTimeMs = 0,
                AiModel = "groq-llama",
                CreatedAt = now
            });

            await _unitOfWork.Repository<AiChatLog>().AddAsync(new AiChatLog
            {
                UserId = request.UserId,
                SessionId = sessionId,
                MessageType = "assistant",
                MessageContent = responseText,
                TokensUsed = tokensUsed,
                ResponseTimeMs = responseTimeMs,
                AiModel = "groq-llama",
                CreatedAt = now.AddMilliseconds(1)
            });

            await _unitOfWork.SaveChangesAsync();

            return new AIChatResponseDto
            {
                Response = responseText,
                TokensUsed = tokensUsed,
                Timestamp = now.AddMilliseconds(1)
            };
        }

        // -----------------------------------------------------------------------
        // Gap 1 helpers
        // -----------------------------------------------------------------------

        private static bool IsWorkoutGenerationIntent(string query)
        {
            var lower = query.ToLowerInvariant();
            return _workoutGenTriggers.Any(t => lower.Contains(t))
                && _workoutPlanKeywords.Any(k => lower.Contains(k));
        }

        /// <summary>
        /// Attempts to generate a workout plan via Qwen2.5.
        /// Returns a short summary string to inject into the Groq context, or null on failure.
        /// </summary>
        private async Task<string?> TryGenerateWorkoutPlanAsync(int userId, string query)
        {
            try
            {
                var profiles = await _unitOfWork.Repository<IntelliFit.Domain.Models.MemberProfile>()
                    .FindAsync(p => p.UserId == userId);
                var profile = profiles.FirstOrDefault();

                var request = new GenerateAIWorkoutPlanRequest
                {
                    UserId = userId,
                    FitnessLevel = profile?.FitnessLevel ?? "Intermediate",
                    Goal = profile?.FitnessGoal ?? "Muscle",
                    DaysPerWeek = ExtractDaysPerWeek(query),
                    IncludeUserContext = true,
                    ForceRegenerate = false
                };

                _logger.LogInformation(
                    "Gap 1 – routing workout generation intent for user {UserId} to Qwen2.5", userId);

                var result = await _workoutAIService.GenerateWorkoutPlanAsync(request);

                if (!result.Success)
                {
                    _logger.LogWarning("Qwen2.5 plan generation failed: {Error}", result.ErrorMessage);
                    return null;
                }

                // Build a compact summary to pass to Groq so it can present the plan conversationally
                var sb = new System.Text.StringBuilder();
                sb.AppendLine("[Tool Result: generate_workout_plan — SUCCESS]");
                sb.AppendLine($"Plan ID: {result.PlanId}");
                sb.AppendLine($"Plan name: {result.PlanName}");
                if (result.PlanData?.Days != null)
                {
                    sb.AppendLine($"Days generated: {result.PlanData.Days.Count}");
                    foreach (var day in result.PlanData.Days)
                    {
                        sb.AppendLine($"  {day.DayName}: {day.Exercises?.Count ?? 0} exercises");
                    }
                }
                sb.AppendLine("The plan has been saved to the member's profile. Present it enthusiastically.");
                return sb.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gap 1 – workout generation routing failed for user {UserId}", userId);
                return null;
            }
        }

        private static int ExtractDaysPerWeek(string query)
        {
            // Look for digit + "day" in query e.g. "4 days", "3-day"
            for (int d = 6; d >= 2; d--)
            {
                if (query.Contains($"{d} day", StringComparison.OrdinalIgnoreCase) ||
                    query.Contains($"{d}-day", StringComparison.OrdinalIgnoreCase))
                    return d;
            }
            return 4; // default
        }

        public async Task SaveChatInteractionAsync(int userId, string userMessage, string aiResponse, int tokensUsed, int responseTimeMs, int sessionId)
        {
            var now = DateTime.UtcNow;

            await _unitOfWork.Repository<AiChatLog>().AddAsync(new AiChatLog
            {
                UserId = userId,
                SessionId = sessionId,
                MessageType = "user",
                MessageContent = userMessage,
                TokensUsed = 0,
                ResponseTimeMs = 0,
                AiModel = "groq-llama",
                CreatedAt = now
            });

            await _unitOfWork.Repository<AiChatLog>().AddAsync(new AiChatLog
            {
                UserId = userId,
                SessionId = sessionId,
                MessageType = "assistant",
                MessageContent = aiResponse,
                TokensUsed = tokensUsed,
                ResponseTimeMs = responseTimeMs,
                AiModel = "groq-llama",
                CreatedAt = now.AddMilliseconds(1)
            });

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<IEnumerable<object>> GetChatHistoryAsync(int userId, int limit = 50)
        {
            var logs = await _unitOfWork.Repository<AiChatLog>()
                .FindAsync(l => l.UserId == userId);

            return logs
                .OrderByDescending(l => l.CreatedAt)
                .Take(limit * 2)
                .OrderBy(l => l.CreatedAt)
                .Select(l => new
                {
                    Role = l.MessageType,
                    Message = l.MessageContent,
                    TokensUsed = l.TokensUsed,
                    Timestamp = l.CreatedAt,
                    SessionId = l.SessionId
                })
                .ToList();
        }

        public async Task<IEnumerable<object>> GetChatSessionsAsync(int userId)
        {
            var logs = await _unitOfWork.Repository<AiChatLog>()
                .FindAsync(l => l.UserId == userId);

            var userLogs = logs.ToList();
            if (!userLogs.Any())
                return new List<object>();

            var sessionData = userLogs
                .GroupBy(l => l.SessionId)
                .Select(g =>
                {
                    var ordered = g.OrderBy(m => m.CreatedAt).ToList();
                    var firstUserMsg = ordered.FirstOrDefault(m => m.MessageType == "user");
                    var title = firstUserMsg?.MessageContent ?? "Chat Session";
                    if (title.Length > 50) title = title[..50] + "...";

                    return new
                    {
                        sessionId = g.Key,
                        userId,
                        title,
                        messageCount = g.Count(m => m.MessageType == "user"),
                        lastMessageAt = g.Max(m => m.CreatedAt),
                        createdAt = g.Min(m => m.CreatedAt)
                    };
                })
                .OrderByDescending(s => s.lastMessageAt)
                .ToList();

            return sessionData.Cast<object>().ToList();
        }

        public async Task<IEnumerable<object>> GetSessionMessagesAsync(int userId, int sessionId)
        {
            var logs = await _unitOfWork.Repository<AiChatLog>()
                .FindAsync(l => l.UserId == userId && l.SessionId == sessionId);

            var sessionLogs = logs.OrderBy(l => l.CreatedAt).ToList();
            if (!sessionLogs.Any())
                return new List<object>();

            var messages = new List<object>();
            for (int i = 0; i < sessionLogs.Count; i++)
            {
                var cur = sessionLogs[i];
                if (cur.MessageType == "user" && i + 1 < sessionLogs.Count)
                {
                    var next = sessionLogs[i + 1];
                    if (next.MessageType == "assistant")
                    {
                        messages.Add(new
                        {
                            chatLogId = cur.ChatId,
                            userId = cur.UserId,
                            userMessage = cur.MessageContent,
                            aiResponse = next.MessageContent,
                            tokensUsed = next.TokensUsed,
                            responseTimeMs = next.ResponseTimeMs ?? 0,
                            sessionId = cur.SessionId,
                            createdAt = cur.CreatedAt
                        });
                        i++;
                    }
                }
            }

            return messages;
        }
    }
}
