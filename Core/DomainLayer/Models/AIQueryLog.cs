namespace DomainLayer.Models;

public class AIQueryLog
{
    public int QueryID { get; set; }
    public int UserID { get; set; }
    public int AI_ID { get; set; }
    public string QueryText { get; set; } = string.Empty;
    public string ResponseText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual AI_Agent AIAgent { get; set; } = null!;
}
