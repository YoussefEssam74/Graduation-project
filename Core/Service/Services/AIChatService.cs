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

            // Log the query
            var chatLog = new AiChatLog
            {
                UserId = request.UserId,
                MessageType = request.ContentTypes?.FirstOrDefault() ?? "general",
                MessageContent = request.Query,
                TokensUsed = 150,
                ResponseTimeMs = 1500,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<AiChatLog>().AddAsync(chatLog);
            await _unitOfWork.SaveChangesAsync();

            return new AIChatResponseDto
            {
                Response = "This is a placeholder AI response. Integration with actual AI service is pending.",
                TokensUsed = chatLog.TokensUsed,
                Timestamp = chatLog.CreatedAt
            };
        }

        public async Task<IEnumerable<object>> GetChatHistoryAsync(int userId, int limit = 50)
        {
            var logs = await _unitOfWork.Repository<AiChatLog>().GetAllAsync();

            return logs
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.CreatedAt)
                .Take(limit)
                .Select(l => new
                {
                    Message = l.MessageContent,
                    TokensUsed = l.TokensUsed,
                    Timestamp = l.CreatedAt,
                    MessageType = l.MessageType,
                    SessionId = l.SessionId
                })
                .ToList();
        }
    }
}
