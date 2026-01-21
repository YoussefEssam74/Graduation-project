namespace Shared.DTOs.WorkoutPlan
{
    /// <summary>
    /// DTO for creating an AI-generated workout plan
    /// </summary>
    public class CreateAIWorkoutPlanDto
    {
        public int UserId { get; set; }
        public string PlanName { get; set; } = null!;
        public string? Description { get; set; }
        public string? DifficultyLevel { get; set; }
        public int? DurationWeeks { get; set; }
        public int? DaysPerWeek { get; set; }
        public string? Goal { get; set; }
        public string? SplitType { get; set; }
        public string? MlPlanJson { get; set; }
        public int TokensSpent { get; set; }
    }
}
