namespace IntelliFit.Domain.Models
{
    public class ActivityFeedLike
    {
        public int Id { get; set; }
        public int ActivityId { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual ActivityFeed Activity { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}
