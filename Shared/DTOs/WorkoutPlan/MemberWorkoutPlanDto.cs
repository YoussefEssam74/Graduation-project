namespace Shared.DTOs.WorkoutPlan
{
    public class MemberWorkoutPlanDto
    {
        public int MemberPlanId { get; set; }
        public int MemberId { get; set; }
        public string MemberName { get; set; } = null!;
        public int PlanId { get; set; }
        public string PlanName { get; set; } = null!;
        public int? AssignedByCoachId { get; set; }
        public string? CoachName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int Status { get; set; }
        public string StatusText { get; set; } = null!;
        public int? CompletedWorkouts { get; set; }
        public int? TotalWorkouts { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // AI-Generated plan specific fields
        public string? PlanType { get; set; }  // Custom, AI_Generated, Coach_Created
        public string? Goal { get; set; }  // muscle_gain, weight_loss, etc.
        public string? SplitType { get; set; }  // Full Body, Upper/Lower, PPL
        public int? DaysPerWeek { get; set; }
        public int? DurationWeeks { get; set; }
        public string? DifficultyLevel { get; set; }
        public string? MlPlanJson { get; set; }
        public List<ScheduledDayDto> ScheduledDays { get; set; } = new();  // Full ML response for display
    }
}
