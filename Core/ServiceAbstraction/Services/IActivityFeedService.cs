using IntelliFit.Shared.DTOs.User;

namespace IntelliFit.ServiceAbstraction.Services
{
    public interface IActivityFeedService
    {
        Task<ActivityFeedDto> CreateActivityAsync(CreateActivityFeedDto dto);
        Task<IEnumerable<ActivityFeedDto>> GetUserActivitiesAsync(int userId, int limit = 50);
        Task<IEnumerable<ActivityFeedDto>> GetRecentActivitiesAsync(int limit = 100, int? currentUserId = null);
        Task DeleteActivityAsync(int activityId, int requestingUserId);

        // Like
        Task LikeActivityAsync(int activityId, int userId);
        Task UnlikeActivityAsync(int activityId, int userId);

        // Comment
        Task<ActivityFeedCommentDto> AddCommentAsync(int activityId, int userId, string comment);
        Task<IEnumerable<ActivityFeedCommentDto>> GetCommentsAsync(int activityId);
    }
}
