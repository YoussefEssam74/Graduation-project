namespace Shared.DTOs.Equipment
{
    public class CreateEquipmentDto
    {
        public string Name { get; set; } = null!;
        public int? CategoryId { get; set; }
        public string? Location { get; set; }
        public int TokensCostPerHour { get; set; }
    }
}
