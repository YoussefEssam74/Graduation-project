using DomainLayer.Enums;

namespace DomainLayer.Models;

public class SafetyIncident
{
    public int IncidentID { get; set; }
    public int? UserID { get; set; }
    public int? EquipmentID { get; set; }
    public string IncidentType { get; set; } = string.Empty;
    public IncidentSeverity Severity { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime DetectedAt { get; set; }
    public bool IsResolved { get; set; }

    // Navigation Properties
    public virtual User? User { get; set; }
    public virtual Equipment? Equipment { get; set; }
}
