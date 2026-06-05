namespace IntelliFit.Domain.Models
{
    public class DiseaseAvoidedIngredient
    {
        public int DiseaseRuleId { get; set; }
        public int IngredientId { get; set; }

        public virtual DiseaseRule DiseaseRule { get; set; } = null!;
        public virtual Ingredient Ingredient { get; set; } = null!;
    }
}
