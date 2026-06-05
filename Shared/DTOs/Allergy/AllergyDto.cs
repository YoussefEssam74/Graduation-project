namespace Shared.DTOs.Allergy
{
    public class AllergyDto
    {
        public int AllergyId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
    }
}
