namespace IntelliFit.Shared.DTOs.Meal
{
    public class MealIngredientDto
    {
        public int MealIngredientId { get; set; }
        public int MealId { get; set; }
        public int IngredientId { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = null!;
        public string? IngredientName { get; set; }
        public string? Category { get; set; }
        public int CaloriesPer100g { get; set; }
        public decimal ProteinPer100g { get; set; }
        public decimal CarbsPer100g { get; set; }
        public decimal FatsPer100g { get; set; }
        public bool ContainsDairy { get; set; }
        public bool ContainsGluten { get; set; }
        public bool ContainsNuts { get; set; }
        public bool ContainsSoy { get; set; }
        public bool ContainsEggs { get; set; }
        public bool ContainsFish { get; set; }
        public string? FoodRole { get; set; }
        public List<string> Allergies { get; set; } = new();
    }

    public class CreateMealIngredientDto
    {
        public int IngredientId { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = null!;
    }
}
