using IntelliFit.Shared.DTOs.Meal;

namespace Shared.DTOs.NutritionPlan
{
    public class NutritionPlanDto
    {
        public int PlanId { get; set; }
        public int MemberId { get; set; }
        public string MemberName { get; set; } = null!;
        public string PlanName { get; set; } = null!;
        public string? Description { get; set; }
        public int? CreatedByCoachId { get; set; }
        public string? CoachName { get; set; }
        public int? CreatedByAiAgentId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? DailyCalories { get; set; }
        public int? ProteinGrams { get; set; }
        public int? CarbsGrams { get; set; }
        public int? FatGrams { get; set; }
        public int Status { get; set; }
        public string StatusText { get; set; } = null!;
        public bool IsActive { get; set; }
        public string? ApprovalNotes { get; set; }
        public DateTime CreatedAt { get; set; }
        public string[]? DietaryRestrictions { get; set; }
        public string? AiPlanJson { get; set; }
        public List<PlanMealDto> Meals { get; set; } = new List<PlanMealDto>();
    }

    public class PlanMealDto
    {
        public int MealId { get; set; }
        public string Name { get; set; } = null!;
        public string MealType { get; set; } = null!;
        public int Calories { get; set; }
        public int ProteinGrams { get; set; }
        public int CarbsGrams { get; set; }
        public int FatGrams { get; set; }
        public int DayNumber { get; set; }
        public List<MealIngredientDto> Ingredients { get; set; } = new List<MealIngredientDto>();
    }

    public class CoachEditNutritionPlanRequest
    {
        public string? PlanName { get; set; }
        public string? Description { get; set; }
        public int? DailyCalories { get; set; }
        public int? ProteinGrams { get; set; }
        public int? CarbsGrams { get; set; }
        public int? FatGrams { get; set; }
        public List<string>? DietaryRestrictions { get; set; }
        public string? CoachNotes { get; set; }
        public List<CoachEditNutritionPlanDayDto> Days { get; set; } = new();
    }

    public class CoachEditNutritionPlanDayDto
    {
        public int DayNumber { get; set; }
        public List<CoachEditNutritionPlanMealItemDto> Meals { get; set; } = new();
    }

    public class CoachEditNutritionPlanMealItemDto
    {
        public int? MealId { get; set; }
        public string Name { get; set; } = null!;
        public string MealType { get; set; } = null!;
        public int Calories { get; set; }
        public int ProteinGrams { get; set; }
        public int CarbsGrams { get; set; }
        public int FatGrams { get; set; }
        public string? Description { get; set; }
        public List<CoachEditPlanMealIngredientDto>? Ingredients { get; set; } = new();
    }

    public class CoachEditPlanMealIngredientDto
    {
        public int? MealIngredientId { get; set; }
        public int IngredientId { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = null!;

        // Master ingredient properties to update/enrich if edited
        public string? Name { get; set; }
        public string? Category { get; set; }
        public int? CaloriesPer100g { get; set; }
        public decimal? ProteinPer100g { get; set; }
        public decimal? CarbsPer100g { get; set; }
        public decimal? FatsPer100g { get; set; }
        public bool? ContainsDairy { get; set; }
        public bool? ContainsGluten { get; set; }
        public bool? ContainsNuts { get; set; }
        public bool? ContainsSoy { get; set; }
        public bool? ContainsEggs { get; set; }
        public bool? ContainsFish { get; set; }
        public string? FoodRole { get; set; }
        public List<string>? Allergies { get; set; }
    }
}

