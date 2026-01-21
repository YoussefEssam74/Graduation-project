using System;
using System.Collections.Generic;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Represents a scheduled workout day - when a user plans to do a specific day of their workout plan.
    /// Links the workout plan day to actual calendar dates and equipment bookings.
    /// </summary>
    public class WorkoutScheduledDay
    {
        public int ScheduledDayId { get; set; }
        public int WorkoutPlanId { get; set; }
        public int DayNumber { get; set; }  // Day number from the plan (1, 2, 3, etc.)
        public int WeekNumber { get; set; } // Week number from the plan
        public DateTime ScheduledDate { get; set; }  // Actual calendar date
        public TimeSpan StartTime { get; set; }  // Start time for the workout
        public TimeSpan? EndTime { get; set; }  // Estimated end time
        public string Status { get; set; } = "Scheduled";  // Scheduled, InProgress, Completed, Skipped, Cancelled
        public DateTime? CompletedAt { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual WorkoutPlan WorkoutPlan { get; set; } = null!;
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();  // Equipment bookings for this day
    }
}
