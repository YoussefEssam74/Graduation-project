using System;
using System.Collections.Generic;

namespace Shared.DTOs.WorkoutPlan
{
    /// <summary>
    /// DTO for scheduling a workout plan (assigning dates to workout days)
    /// </summary>
    public class ScheduleWorkoutPlanDto
    {
        public int UserId { get; set; }
        public int PlanId { get; set; }
        public DateTime StartDate { get; set; }
        public TimeSpan PreferredWorkoutTime { get; set; }  // e.g., "09:00" for 9 AM
        public List<DayOfWeek> WorkoutDays { get; set; } = new();  // Days of the week to work out
        public bool AutoBookEquipment { get; set; } = true;  // Whether to auto-book equipment
    }

    /// <summary>
    /// Response DTO for scheduled workout plan
    /// </summary>
    public class ScheduledWorkoutPlanResponse
    {
        public int PlanId { get; set; }
        public string PlanName { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalScheduledDays { get; set; }
        public int EquipmentBookingsCreated { get; set; }
        public List<ScheduledDayDto> ScheduledDays { get; set; } = new();
    }

    /// <summary>
    /// DTO for a single scheduled workout day
    /// </summary>
    public class ScheduledDayDto
    {
        public int ScheduledDayId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public int WeekNumber { get; set; }
        public int DayNumber { get; set; }
        public string Status { get; set; } = "Scheduled";
        public List<ScheduledEquipmentBookingDto> EquipmentBookings { get; set; } = new();
    }

    /// <summary>
    /// DTO for equipment bookings created for a scheduled day
    /// </summary>
    public class ScheduledEquipmentBookingDto
    {
        public int BookingId { get; set; }
        public int EquipmentId { get; set; }
        public string EquipmentName { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Status { get; set; } = "Confirmed";
    }
}
