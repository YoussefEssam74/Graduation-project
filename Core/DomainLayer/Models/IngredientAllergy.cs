namespace IntelliFit.Domain.Models
{
    public class IngredientAllergy
    {
        public int IngredientId { get; set; }
        public virtual Ingredient Ingredient { get; set; } = null!;

        public int AllergyId { get; set; }
        public virtual Allergy Allergy { get; set; } = null!;
    }
}
