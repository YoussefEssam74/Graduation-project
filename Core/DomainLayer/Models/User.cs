using DomainLayer.Enums;

namespace DomainLayer.Models;

public abstract class User
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
    public Gender Gender { get; set; }
    public string FitnessGoal { get; set; } = string.Empty;
    public int TokenBalance { get; set; }
    public string SubscriptionPlan { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public UserRole Role { get; set; }
}
