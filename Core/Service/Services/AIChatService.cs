using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.AI;

namespace Service.Services
{
    public class AIChatService : IAIChatService
    {
        private readonly IUnitOfWork _unitOfWork;

        public AIChatService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<AIChatResponseDto> SendMessageAsync(AIChatRequestDto request)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(request.UserId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {request.UserId} not found");
            }

            // Create a session ID if not provided
            var sessionId = Guid.NewGuid();

            // Log the user's query
            var userChatLog = new AiChatLog
            {
                UserId = request.UserId,
                SessionId = sessionId,
                MessageType = "user",
                MessageContent = request.Query,
                TokensUsed = 0,
                ResponseTimeMs = 0,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<AiChatLog>().AddAsync(userChatLog);

            // Generate placeholder response (actual AI integration will replace this)
            var responseText = "This is a placeholder AI response. Integration with actual AI service is pending.";
            var tokensUsed = 150;
            var responseTimeMs = 1500;

            // Log the AI response
            var aiChatLog = new AiChatLog
            {
                UserId = request.UserId,
                SessionId = sessionId,
                MessageType = "assistant",
                MessageContent = responseText,
                TokensUsed = tokensUsed,
                ResponseTimeMs = responseTimeMs,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<AiChatLog>().AddAsync(aiChatLog);
            await _unitOfWork.SaveChangesAsync();

            return new AIChatResponseDto
            {
                Response = responseText,
                TokensUsed = tokensUsed,
                Timestamp = aiChatLog.CreatedAt
            };
        }

        /// <summary>
        /// Save a chat interaction (both user message and AI response)
        /// </summary>
        public async Task SaveChatInteractionAsync(int userId, string userMessage, string aiResponse, int tokensUsed, int responseTimeMs, Guid sessionId)
        {
            var now = DateTime.UtcNow;

            // Save user message
            var userLog = new AiChatLog
            {
                UserId = userId,
                SessionId = sessionId,
                MessageType = "user",
                MessageContent = userMessage,
                TokensUsed = 0,
                ResponseTimeMs = 0,
                CreatedAt = now
            };

            // Save AI response
            var aiLog = new AiChatLog
            {
                UserId = userId,
                SessionId = sessionId,
                MessageType = "assistant",
                MessageContent = aiResponse,
                TokensUsed = tokensUsed,
                ResponseTimeMs = responseTimeMs,
                CreatedAt = now.AddMilliseconds(responseTimeMs)
            };

            await _unitOfWork.Repository<AiChatLog>().AddAsync(userLog);
            await _unitOfWork.Repository<AiChatLog>().AddAsync(aiLog);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<IEnumerable<object>> GetChatHistoryAsync(int userId, int limit = 50)
        {
            var logs = await _unitOfWork.Repository<AiChatLog>().GetAllAsync();

            // Get user's chat logs ordered by creation time (newest first)
            // But keep message pairs together by ordering within each session
            return logs
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.CreatedAt)
                .Take(limit * 2) // Take double since each conversation has user + assistant messages
                .OrderBy(l => l.CreatedAt) // Re-order chronologically for proper display
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

        /// <summary>
        /// Get all chat sessions for a user with preview of the last message
        /// </summary>
        public async Task<IEnumerable<object>> GetChatSessionsAsync(int userId)
        {
            var logs = await _unitOfWork.Repository<AiChatLog>().GetAllAsync();

            return logs
                .Where(l => l.UserId == userId)
                .GroupBy(l => l.SessionId)
                .Select(g => new
                {
                    SessionId = g.Key,
                    MessageCount = g.Count(),
                    LastMessage = g.OrderByDescending(m => m.CreatedAt).First().MessageContent,
                    LastMessageTime = g.Max(m => m.CreatedAt),
                    FirstMessage = g.OrderBy(m => m.CreatedAt).First().MessageContent
                })
                .OrderByDescending(s => s.LastMessageTime)
                .ToList();
        }

        /// <summary>
        /// Get all messages for a specific session
        /// </summary>
        public async Task<IEnumerable<object>> GetSessionMessagesAsync(int userId, Guid sessionId)
        {
            var logs = await _unitOfWork.Repository<AiChatLog>().GetAllAsync();

            return logs
                .Where(l => l.UserId == userId && l.SessionId == sessionId)
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
    }
}
