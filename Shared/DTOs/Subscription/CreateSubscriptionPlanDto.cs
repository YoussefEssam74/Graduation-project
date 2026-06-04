namespace Shared.DTOs.Subscription
{
    public class CreateSubscriptionPlanDto
    {
        public string PlanName { get; set; } = null!;
        public decimal Price { get; set; }
        public int DurationDays { get; set; }
        public string? Description { get; set; }
        public int TokensIncluded { get; set; }
        public int InvitationsAllowed { get; set; }
        public string? Features { get; set; }
        public int? MaxBookingsPerDay { get; set; }
        public int MaxFreezeDays { get; set; }
        public bool IsPopular { get; set; }
        /// <summary>Number of free AI workout plan generations included per subscription period.</summary>
        public int FreeWorkoutPlans { get; set; } = 0;
        /// <summary>Number of free AI nutrition plan generations included per subscription period.</summary>
        public int FreeNutritionPlans { get; set; } = 0;
        /// <summary>Token cost for each AI workout plan generation beyond the free quota.</summary>
        public int ExtraWorkoutPlanTokenCost { get; set; } = 10;
        /// <summary>Token cost for each AI nutrition plan generation beyond the free quota.</summary>
        public int ExtraNutritionPlanTokenCost { get; set; } = 10;
        /// <summary>Number of free AI coach messages allowed per day.</summary>
        public int FreeAiCoachMessagesPerDay { get; set; } = 0;
    }
}
