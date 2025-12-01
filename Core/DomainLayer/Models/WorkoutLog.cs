using System;

namespace IntelliFit.Domain.Models
{
    public class WorkoutLog
    {
        public int LogId { get; set; }
        public int UserId { get; set; }
        public int? PlanId { get; set; }
        public DateTime WorkoutDate { get; set; } = DateTime.UtcNow.Date;
        public int? DurationMinutes { get; set; }
        public int? CaloriesBurned { get; set; }
        public string? ExercisesCompleted { get; set; }
        public string? Notes { get; set; }
        public int? FeelingRating { get; set; }
        public bool Completed { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User User { get; set; } = null!;
        public virtual WorkoutPlan? Plan { get; set; }
    }
}
