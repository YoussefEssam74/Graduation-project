using DomainLayer.Enums;

namespace DomainLayer.Models;

public class Admin : User
{
    public int AdminID { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }

    // Navigation Properties
    public virtual ICollection<Equipment> ManagedEquipment { get; set; } = new List<Equipment>();
    public virtual ICollection<User> ManagedUsers { get; set; } = new List<User>();
}
