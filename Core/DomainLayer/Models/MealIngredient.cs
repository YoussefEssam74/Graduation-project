namespace DomainLayer.Models;

public class MealIngredient
{
    public int MealIngredientId { get; set; }
    public int MealId { get; set; }
    public int IngredientId { get; set; }
    public float Quantity { get; set; }
    public string? Notes { get; set; }
    public bool IsAddedByCoach { get; set; }
    public int? ModifiedByCoachID { get; set; }

    // Navigation Properties
    public virtual Meal Meal { get; set; } = null!;
    public virtual Ingredient Ingredient { get; set; } = null!;
    public virtual Coach? ModifiedByCoach { get; set; }
}