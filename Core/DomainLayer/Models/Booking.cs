using DomainLayer.Enums;

namespace DomainLayer.Models;

public class Booking
{
    public int BookingID { get; set; }
    public int UserID { get; set; }
    public int EquipmentID { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public BookingStatus Status { get; set; }
    public int TokensDeducted { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual Equipment Equipment { get; set; } = null!;
}
