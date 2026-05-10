namespace IntelliFit.Shared.DTOs.User
{
    public class ActivityFeedDto
    {
        public int ActivityId { get; set; }
        public int UserId { get; set; }
        public string ActivityType { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UserName { get; set; }
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
    }

    public class CreateActivityFeedDto
    {
        public int UserId { get; set; }
        public string ActivityType { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
    }

    public class ActivityFeedCommentDto
    {
        public int Id { get; set; }
        public int ActivityId { get; set; }
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public string Comment { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }

    public class AddCommentDto
    {
        public string Comment { get; set; } = null!;
    }
}
