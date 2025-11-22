using DomainLayer.Enums;

namespace DomainLayer.Models;

public class Notification
{
    public int NotificationID { get; set; }
    public int UserID { get; set; }
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
}
