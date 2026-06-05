namespace IntelliFit.Domain.Models
{
    public class MemberAllergy
    {
        public int MemberProfileId { get; set; }
        public virtual MemberProfile MemberProfile { get; set; } = null!;

        public int AllergyId { get; set; }
        public virtual Allergy Allergy { get; set; } = null!;
    }
}
