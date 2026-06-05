using System.Collections.Generic;

namespace Shared.DTOs.Ingredient
{
    public class UpdateIngredientDto
    {
        public string? Name { get; set; }
        public string? Category { get; set; }
        public int? CaloriesPer100g { get; set; }
        public decimal? ProteinPer100g { get; set; }
        public decimal? CarbsPer100g { get; set; }
        public decimal? FatsPer100g { get; set; }
        public bool? IsActive { get; set; }
        public string? FoodRole { get; set; }
        public List<string>? Allergies { get; set; }
    }
}
