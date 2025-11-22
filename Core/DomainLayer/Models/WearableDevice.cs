namespace DomainLayer.Models;

public class WearableDevice
{
    public int DeviceID { get; set; }
    public int UserID { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string DeviceIdentifier { get; set; } = string.Empty;
    public DateTime PairedAt { get; set; }
    public bool IsActive { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<HeartRateData> HeartRateData { get; set; } = new List<HeartRateData>();
}
