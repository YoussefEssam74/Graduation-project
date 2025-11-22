using DomainLayer.Enums;

namespace DomainLayer.Models;

public class ChurnPrediction
{
    public int PredictionID { get; set; }
    public int UserID { get; set; }
    public float ChurnProbability { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public DateTime PredictionDate { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
}
