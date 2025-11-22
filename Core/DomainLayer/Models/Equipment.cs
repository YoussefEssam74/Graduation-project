using DomainLayer.Enums;

namespace DomainLayer.Models;

public class Equipment
{
    public int EquipmentID { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string QRCode { get; set; } = string.Empty;
    public EquipmentStatus Status { get; set; }
    public string Description { get; set; } = string.Empty;
    public int MaintenanceIntervalDays { get; set; }
    public DateTime? LastMaintenanceDate { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public int TokenCostPerHour { get; set; }

    // Navigation Properties
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public virtual ICollection<WorkoutSession> UsedInSessions { get; set; } = new List<WorkoutSession>();
    public virtual ICollection<MaintenanceLog> MaintenanceLogs { get; set; } = new List<MaintenanceLog>();
    public virtual ICollection<EquipmentDemandPrediction> DemandPredictions { get; set; } = new List<EquipmentDemandPrediction>();
    public virtual ICollection<SafetyIncident> SafetyIncidents { get; set; } = new List<SafetyIncident>();
}
