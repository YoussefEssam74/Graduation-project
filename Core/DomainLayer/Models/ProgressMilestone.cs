namespace DomainLayer.Models;

public class ProgressMilestone
{
    public int MilestoneID { get; set; }
    public int UserID { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime AchievedAt { get; set; }
    public bool IsAIGenerated { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
}
