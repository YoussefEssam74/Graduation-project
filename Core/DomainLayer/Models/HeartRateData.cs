namespace DomainLayer.Models;

public class HeartRateData
{
    public int RecordID { get; set; }
    public int DeviceID { get; set; }
    public int? SessionID { get; set; }
    public DateTime Timestamp { get; set; }
    public int HeartRate { get; set; }
    public float CaloriesBurned { get; set; }

    // Navigation Properties
    public virtual WearableDevice Device { get; set; } = null!;
    public virtual WorkoutSession? Session { get; set; }
}
