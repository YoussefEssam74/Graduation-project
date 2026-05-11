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
    }
}
