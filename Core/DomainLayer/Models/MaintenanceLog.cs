using DomainLayer.Enums;

namespace DomainLayer.Models;

public class MaintenanceLog
{
    public int MaintenanceID { get; set; }
    public int EquipmentID { get; set; }
    public DateTime MaintenanceDate { get; set; }
    public MaintenanceType MaintenanceType { get; set; }
    public string? Description { get; set; }
    public decimal Cost { get; set; }
    public int DowntimeDays { get; set; }

    // Navigation Properties
    public virtual Equipment Equipment { get; set; } = null!;
}
