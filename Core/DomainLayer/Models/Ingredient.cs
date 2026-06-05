namespace IntelliFit.Domain.Models
{
    public class Ingredient
    {
        public int IngredientId { get; set; }
        public string Name { get; set; } = null!;
        public string? Category { get; set; }
        public int CaloriesPer100g { get; set; }
        public decimal ProteinPer100g { get; set; }
        public decimal CarbsPer100g { get; set; }
        public decimal FatsPer100g { get; set; }
        public bool IsActive { get; set; } = true;
        public bool ContainsDairy { get; set; } = false;
        public bool ContainsGluten { get; set; } = false;
        public bool ContainsNuts { get; set; } = false;
        public bool ContainsSoy { get; set; } = false;
        public bool ContainsEggs { get; set; } = false;
        public bool ContainsFish { get; set; } = false;
        public string? FoodRole { get; set; }

        public virtual ICollection<MealIngredient> MealIngredients { get; set; } = new List<MealIngredient>();
        public virtual ICollection<IngredientAllergy> IngredientAllergies { get; set; } = new List<IngredientAllergy>();
    }
}