namespace DomainLayer.Models;

public class EquipmentDemandPrediction
{
    public int PredictionID { get; set; }
    public int EquipmentID { get; set; }
    public DateTime PredictedForDate { get; set; }
    public float DemandScore { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public virtual Equipment Equipment { get; set; } = null!;
}
