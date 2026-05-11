using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction.Services;
using Shared.DTOs.Achievement;

namespace Service.Services
{
    public class AchievementsService : IAchievementsService
    {
        private readonly IUnitOfWork _unitOfWork;

        public AchievementsService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<AchievementDto>> GetAllAchievementsAsync()
        {
            var achievements = await _unitOfWork.Repository<Achievement>().GetAllAsync();
            return achievements
                .Where(a => a.IsActive)
                .OrderBy(a => a.DisplayOrder)
                .Select(MapToDto);
        }

        public async Task<IEnumerable<UserAchievementDto>> GetUserAchievementsAsync(int userId)
        {
            var userAchievements = await _unitOfWork.Repository<UserAchievement>().GetAllAsync();
            var achievements = await _unitOfWork.Repository<Achievement>().GetAllAsync();

            var achievementMap = achievements.ToDictionary(a => a.AchievementId);

            return userAchievements
                .Where(ua => ua.UserId == userId)
                .OrderByDescending(ua => ua.EarnedAt)
                .Select(ua => MapToUserDto(ua, achievementMap.GetValueOrDefault(ua.AchievementId)));
        }

        public async Task<UserAchievementDto?> AwardAchievementAsync(int userId, string achievementCode)
        {
            var achievements = await _unitOfWork.Repository<Achievement>().GetAllAsync();
            var achievement = achievements.FirstOrDefault(a => a.Code == achievementCode && a.IsActive);
            if (achievement == null) return null;

            var userAchievements = await _unitOfWork.Repository<UserAchievement>().GetAllAsync();
            var existing = userAchievements.FirstOrDefault(ua => ua.UserId == userId && ua.AchievementId == achievement.AchievementId);

            if (existing != null)
            {
                if (existing.IsEarned) return MapToUserDto(existing, achievement);
                existing.IsEarned = true;
                existing.EarnedAt = DateTime.UtcNow;
                existing.CurrentProgress = achievement.ThresholdValue ?? 1;
            }
            else
            {
                existing = new UserAchievement
                {
                    UserId = userId,
                    AchievementId = achievement.AchievementId,
                    IsEarned = true,
                    EarnedAt = DateTime.UtcNow,
                    CurrentProgress = achievement.ThresholdValue ?? 1
                };
                await _unitOfWork.Repository<UserAchievement>().AddAsync(existing);
            }

            // Grant token reward if any
            if (achievement.TokenReward > 0)
            {
                var users = await _unitOfWork.Repository<User>().GetAllAsync();
                var user = users.FirstOrDefault(u => u.UserId == userId);
                if (user != null)
                {
                    user.TokenBalance += achievement.TokenReward;
                }
            }

            await _unitOfWork.SaveChangesAsync();
            return MapToUserDto(existing, achievement);
        }

        public async Task<IEnumerable<UserAchievementDto>> CheckAndAwardAchievementsAsync(int userId)
        {
            var awarded = new List<UserAchievementDto>();

            var workoutLogs = await _unitOfWork.Repository<WorkoutLog>().GetAllAsync();
            var userWorkouts = workoutLogs.Count(wl => wl.UserId == userId);

            // Map threshold checks to achievement codes
            var thresholds = new[]
            {
                ("FIRST_WORKOUT", 1),
                ("5_WORKOUTS", 5),
                ("10_WORKOUTS", 10),
                ("25_WORKOUTS", 25),
                ("50_WORKOUTS", 50),
                ("100_WORKOUTS", 100),
            };

            foreach (var (code, threshold) in thresholds)
            {
                if (userWorkouts >= threshold)
                {
                    var result = await AwardAchievementAsync(userId, code);
                    if (result != null && result.IsEarned)
                        awarded.Add(result);
                }
            }

            return awarded;
        }

        private static AchievementDto MapToDto(Achievement a) => new()
        {
            AchievementId = a.AchievementId,
            Code = a.Code,
            Name = a.Name,
            Description = a.Description,
            Category = a.Category,
            IconUrl = a.IconUrl,
            TokenReward = a.TokenReward,
            XpReward = a.XpReward,
            ThresholdValue = a.ThresholdValue,
            IsSecret = a.IsSecret,
            Rarity = a.Rarity,
            DisplayOrder = a.DisplayOrder,
            IsActive = a.IsActive
        };

        private static UserAchievementDto MapToUserDto(UserAchievement ua, Achievement? a) => new()
        {
            UserAchievementId = ua.UserAchievementId,
            UserId = ua.UserId,
            AchievementId = ua.AchievementId,
            CurrentProgress = ua.CurrentProgress,
            IsEarned = ua.IsEarned,
            EarnedAt = ua.EarnedAt,
            RewardClaimed = ua.RewardClaimed,
            Achievement = a != null ? MapToDto(a) : new AchievementDto()
        };
    }
}
