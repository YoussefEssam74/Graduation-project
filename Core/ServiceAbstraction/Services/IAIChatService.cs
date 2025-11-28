using Shared.DTOs.AI;

namespace ServiceAbstraction.Services
{
    public interface IAIChatService
    {
        Task<AIChatResponseDto> SendMessageAsync(AIChatRequestDto request);
        Task<IEnumerable<object>> GetChatHistoryAsync(int userId, int limit = 50);
    }
}
