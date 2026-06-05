using System.Collections.Generic;

namespace IntelliFit.Domain.Models
{
    public class Allergy
    {
        public int AllergyId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }

        public virtual ICollection<IngredientAllergy> IngredientAllergies { get; set; } = new List<IngredientAllergy>();
        public virtual ICollection<MemberAllergy> MemberAllergies { get; set; } = new List<MemberAllergy>();
    }
}
