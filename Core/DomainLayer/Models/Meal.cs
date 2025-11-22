namespace DomainLayer.Models;

public class Meal
{
    public int MealId { get; set; }
    public int NutritionPlanId { get; set; }
    public string MealType { get; set; } = string.Empty; // Breakfast, Lunch, Dinner, Snack
    public string Name { get; set; } = string.Empty;
    public int Calories { get; set; }
    public float ProteinGrams { get; set; }
    public float CarbsGrams { get; set; }
    public float FatsGrams { get; set; }
    public TimeOnly RecommendedTime { get; set; }
    public bool IsAddedByCoach { get; set; } // Track if coach added this meal
    public int? AddedByCoachID { get; set; }

    // Navigation Properties
    public virtual NutritionPlan NutritionPlan { get; set; } = null!;
    public virtual Coach? AddedByCoach { get; set; }
    public virtual ICollection<MealIngredient> Ingredients { get; set; } = new List<MealIngredient>();
}