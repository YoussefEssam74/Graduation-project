using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// TPT derived type for Coach users
    /// </summary>
    public class Coach : User
    {
        // Coach-specific properties
        public string? Specialization { get; set; }
        public string[]? Certifications { get; set; }
        public int? ExperienceYears { get; set; }
        public string? Bio { get; set; }
        public decimal? HourlyRate { get; set; }
        public decimal Rating { get; set; } = 0.00m;
        public int TotalReviews { get; set; } = 0;
        public int TotalClients { get; set; } = 0;
        public string? AvailabilitySchedule { get; set; }
        public bool IsAvailable { get; set; } = true;

        // Navigation properties
        public virtual ICollection<Booking> CoachBookings { get; set; } = new List<Booking>();
        public virtual ICollection<WorkoutPlan> WorkoutPlansCreated { get; set; } = new List<WorkoutPlan>();
        public virtual ICollection<WorkoutPlan> WorkoutPlansApproved { get; set; } = new List<WorkoutPlan>();
        public virtual ICollection<NutritionPlan> NutritionPlansCreated { get; set; } = new List<NutritionPlan>();
        public virtual ICollection<NutritionPlan> NutritionPlansApproved { get; set; } = new List<NutritionPlan>();
        public virtual ICollection<CoachReview> Reviews { get; set; } = new List<CoachReview>();
        public virtual ICollection<Exercise> ExercisesCreated { get; set; } = new List<Exercise>();
        public virtual ICollection<WorkoutTemplate> WorkoutTemplatesCreated { get; set; } = new List<WorkoutTemplate>();
        public virtual ICollection<Meal> MealsCreated { get; set; } = new List<Meal>();
    }
}
