namespace DomainLayer.Models;

public class Ingredient
{
    public int IngredientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // Protein, Carb, Vegetable, etc.
    public int CaloriesPer100g { get; set; }
    public float ProteinPer100g { get; set; }
    public float CarbsPer100g { get; set; }
    public float FatsPer100g { get; set; }
    public string Unit { get; set; } = string.Empty; // grams, pieces, cups

    // Navigation Properties
    public virtual ICollection<MealIngredient> MealIngredients { get; set; } = new List<MealIngredient>();
}