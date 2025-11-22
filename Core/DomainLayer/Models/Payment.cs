using DomainLayer.Enums;

namespace DomainLayer.Models;

public class Payment
{
    public int PaymentID { get; set; }
    public int UserID { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentType { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
}
