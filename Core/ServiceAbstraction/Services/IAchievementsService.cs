using Shared.DTOs.Achievement;

namespace IntelliFit.ServiceAbstraction.Services
{
    public interface IAchievementsService
    {
        Task<IEnumerable<AchievementDto>> GetAllAchievementsAsync();
        Task<IEnumerable<UserAchievementDto>> GetUserAchievementsAsync(int userId);
        Task<UserAchievementDto?> AwardAchievementAsync(int userId, string achievementCode);
        Task<IEnumerable<UserAchievementDto>> CheckAndAwardAchievementsAsync(int userId);
    }
}
