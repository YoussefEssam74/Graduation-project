using System;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// TPT derived type for Member users
    /// </summary>
    public class Member : User
    {
        // Member-specific properties
        public string? FitnessGoal { get; set; }
        public string? MedicalConditions { get; set; }
        public string? Allergies { get; set; }
        public string? FitnessLevel { get; set; }
        public string? PreferredWorkoutTime { get; set; }
        public int? SubscriptionPlanId { get; set; }
        public DateTime? MembershipStartDate { get; set; }
        public DateTime? MembershipEndDate { get; set; }
        public decimal? CurrentWeight { get; set; }
        public decimal? TargetWeight { get; set; }
        public decimal? Height { get; set; }
        public int TotalWorkoutsCompleted { get; set; } = 0;
        public int TotalCaloriesBurned { get; set; } = 0;
        public string Achievements { get; set; } = "[]";

        // Navigation properties
        public virtual SubscriptionPlan? SubscriptionPlan { get; set; }
    }
}
