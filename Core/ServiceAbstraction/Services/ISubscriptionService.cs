using Shared.DTOs.Subscription;

namespace ServiceAbstraction.Services
{
    public interface ISubscriptionService
    {
        Task<IEnumerable<SubscriptionPlanDto>> GetAllPlansAsync();
        Task<SubscriptionPlanDto?> GetPlanByIdAsync(int planId);
        Task<IEnumerable<SubscriptionPlanDto>> GetActivePlansAsync();
        Task CreateUserSubscriptionAsync(CreateSubscriptionDto createDto);
        Task<bool> HasActiveSubscriptionAsync(int userId);
        Task<UserSubscriptionDetailsDto?> GetUserSubscriptionDetailsAsync(int userId);
        Task ChangePlanAsync(ChangePlanDto changePlanDto);
        Task FreezeSubscriptionAsync(int subscriptionId, int freezeDays, DateTime startDate);
        Task UnfreezeSubscriptionAsync(int subscriptionId);
        Task<IEnumerable<UserSubscriptionDetailsDto>> GetFrozenSubscriptionsAsync();
        Task<SubscriptionPlanDto> CreatePlanAsync(CreateSubscriptionPlanDto dto);
        Task<SubscriptionPlanDto> UpdatePlanAsync(int planId, UpdateSubscriptionPlanDto dto);
        Task<bool> DeletePlanAsync(int planId);
        Task<(bool canGenerate, string message, int cost)> CheckQuotaAndTokenBalanceAsync(int userId, string programType);
        Task<(bool success, string message)> DeductTokensForGenerationAsync(int userId, string programType, int cost);
    }
}
