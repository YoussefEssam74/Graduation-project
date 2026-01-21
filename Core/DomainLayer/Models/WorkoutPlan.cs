using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    public class WorkoutPlan
    {
        public int PlanId { get; set; }
        public int UserId { get; set; }
        public string PlanName { get; set; } = null!;
        public string? Description { get; set; }
        public string PlanType { get; set; } = "Custom"; // Custom, AI_Generated, Coach_Created, Template
        public string? DifficultyLevel { get; set; }
        public int? DurationWeeks { get; set; }
        public int? DaysPerWeek { get; set; }  // Number of training days per week
        public string? Goal { get; set; }  // muscle_gain, weight_loss, strength, etc.
        public string? SplitType { get; set; }  // Full Body, Upper/Lower, PPL, etc.
        public string? Schedule { get; set; }
        public string? Exercises { get; set; }
        public string? MlPlanJson { get; set; }  // Full ML-generated plan stored as JSON
        public int? GeneratedByCoachId { get; set; }
        public string? AiPrompt { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, PendingApproval, Active, Completed, Cancelled
        public string? ApprovalNotes { get; set; }
        public int? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int TokensSpent { get; set; } = 0;
        public bool IsActive { get; set; } = false;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public TimeSpan? PreferredWorkoutTime { get; set; }  // Preferred time of day for workouts
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
        public virtual CoachProfile? Coach { get; set; }
        public virtual CoachProfile? ApprovedByCoach { get; set; }
        public virtual ICollection<WorkoutLog> WorkoutLogs { get; set; } = new List<WorkoutLog>();
        public virtual ICollection<AiProgramGeneration> AiGenerations { get; set; } = new List<AiProgramGeneration>();
        public virtual ICollection<WorkoutPlanExercise> WorkoutPlanExercises { get; set; } = new List<WorkoutPlanExercise>();
        public virtual ICollection<WorkoutScheduledDay> ScheduledDays { get; set; } = new List<WorkoutScheduledDay>();
    }
}
