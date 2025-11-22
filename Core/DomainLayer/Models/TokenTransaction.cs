using DomainLayer.Enums;

namespace DomainLayer.Models;

public class TokenTransaction
{
    public int TransactionID { get; set; }
    public int UserID { get; set; }
    public int? ReceptionistID { get; set; }
    public int Amount { get; set; }
    public TransactionType Type { get; set; }
    public string PaymentRef { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual Receptionist? Receptionist { get; set; }
}
