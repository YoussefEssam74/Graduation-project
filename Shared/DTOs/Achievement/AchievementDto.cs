namespace Shared.DTOs.Achievement
{
    public class AchievementDto
    {
        public int AchievementId { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string? IconUrl { get; set; }
        public int TokenReward { get; set; }
        public int XpReward { get; set; }
        public int? ThresholdValue { get; set; }
        public bool IsSecret { get; set; }
        public string Rarity { get; set; } = "common";
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }

    public class UserAchievementDto
    {
        public int UserAchievementId { get; set; }
        public int UserId { get; set; }
        public int AchievementId { get; set; }
        public int CurrentProgress { get; set; }
        public bool IsEarned { get; set; }
        public DateTime? EarnedAt { get; set; }
        public bool RewardClaimed { get; set; }
        public AchievementDto Achievement { get; set; } = null!;
    }
}
