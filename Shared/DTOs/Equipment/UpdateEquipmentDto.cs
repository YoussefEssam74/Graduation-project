using System;

namespace Shared.DTOs.Equipment
{
    public class UpdateEquipmentDto
    {
        public string Name { get; set; } = null!;
        public int? CategoryId { get; set; }
        public int Status { get; set; }
        public string? Location { get; set; }
        public DateTime? LastMaintenanceDate { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }
        public int TokensCostPerHour { get; set; }
    }
}
