namespace DomainLayer.Models;

public class CoachReview
{
    public int ReviewID { get; set; }
    public int UserID { get; set; }
    public int CoachID { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual Coach Coach { get; set; } = null!;
}
