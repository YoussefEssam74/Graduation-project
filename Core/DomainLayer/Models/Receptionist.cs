namespace DomainLayer.Models;

public class Receptionist : User
{
    public int ReceptionistID { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    // Navigation Properties
    public virtual ICollection<InBodyMeasurement> RecordedMeasurements { get; set; } = new List<InBodyMeasurement>();
    public virtual ICollection<TokenTransaction> ProcessedTransactions { get; set; } = new List<TokenTransaction>();
}
