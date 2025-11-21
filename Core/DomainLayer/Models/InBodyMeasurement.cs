namespace DomainLayer.Models;

public class InBodyMeasurement
{
    public int InBodyID { get; set; }
    public int UserID { get; set; }
    public int ReceptionistID { get; set; }
    public float Weight { get; set; }
    public float FatPercentage { get; set; }
    public float MuscleMass { get; set; }
    public float BMI { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ReceiptPhotoUrl { get; set; }
    public string? AIInsights { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual Receptionist Receptionist { get; set; } = null!;
}
