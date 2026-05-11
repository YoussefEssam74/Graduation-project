using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction.Services;
using IntelliFit.Shared.DTOs.User;
using AutoMapper;

namespace Service.Services
{
    public class ActivityFeedService : IActivityFeedService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ActivityFeedService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ActivityFeedDto> CreateActivityAsync(CreateActivityFeedDto dto)
        {
            var activity = _mapper.Map<ActivityFeed>(dto);

            await _unitOfWork.Repository<ActivityFeed>().AddAsync(activity);
            await _unitOfWork.SaveChangesAsync();

            return await MapToDtoAsync(activity, null);
        }

        public async Task<IEnumerable<ActivityFeedDto>> GetUserActivitiesAsync(int userId, int limit = 50)
        {
            var activities = await _unitOfWork.Repository<ActivityFeed>().GetAllAsync();
            var userActivities = activities.Where(a => a.UserId == userId)
                                          .OrderByDescending(a => a.CreatedAt)
                                          .Take(limit);

            var activityDtos = new List<ActivityFeedDto>();
            foreach (var activity in userActivities)
            {
                activityDtos.Add(await MapToDtoAsync(activity, userId));
            }
            return activityDtos;
        }

        public async Task<IEnumerable<ActivityFeedDto>> GetRecentActivitiesAsync(int limit = 100, int? currentUserId = null)
        {
            var activities = await _unitOfWork.Repository<ActivityFeed>().GetAllAsync();
            var recentActivities = activities.OrderByDescending(a => a.CreatedAt)
                                            .Take(limit);

            var activityDtos = new List<ActivityFeedDto>();
            foreach (var activity in recentActivities)
            {
                activityDtos.Add(await MapToDtoAsync(activity, currentUserId));
            }
            return activityDtos;
        }

        public async Task DeleteActivityAsync(int activityId, int requestingUserId)
        {
            var activity = await _unitOfWork.Repository<ActivityFeed>().GetByIdAsync(activityId);
            if (activity == null) return;

            if (activity.UserId != requestingUserId)
                throw new UnauthorizedAccessException("You can only delete your own posts.");

            _unitOfWork.Repository<ActivityFeed>().Remove(activity);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task LikeActivityAsync(int activityId, int userId)
        {
            var likes = await _unitOfWork.Repository<ActivityFeedLike>().GetAllAsync();
            var exists = likes.Any(l => l.ActivityId == activityId && l.UserId == userId);
            if (exists) return;

            var like = new ActivityFeedLike { ActivityId = activityId, UserId = userId };
            await _unitOfWork.Repository<ActivityFeedLike>().AddAsync(like);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UnlikeActivityAsync(int activityId, int userId)
        {
            var likes = await _unitOfWork.Repository<ActivityFeedLike>().GetAllAsync();
            var like = likes.FirstOrDefault(l => l.ActivityId == activityId && l.UserId == userId);
            if (like == null) return;

            _unitOfWork.Repository<ActivityFeedLike>().Remove(like);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<ActivityFeedCommentDto> AddCommentAsync(int activityId, int userId, string comment)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            var entity = new ActivityFeedComment
            {
                ActivityId = activityId,
                UserId = userId,
                Comment = comment
            };
            await _unitOfWork.Repository<ActivityFeedComment>().AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            return new ActivityFeedCommentDto
            {
                Id = entity.Id,
                ActivityId = entity.ActivityId,
                UserId = entity.UserId,
                UserName = user?.Name,
                Comment = entity.Comment,
                CreatedAt = entity.CreatedAt
            };
        }

        public async Task<IEnumerable<ActivityFeedCommentDto>> GetCommentsAsync(int activityId)
        {
            var comments = await _unitOfWork.Repository<ActivityFeedComment>().GetAllAsync();
            var result = comments.Where(c => c.ActivityId == activityId)
                                 .OrderBy(c => c.CreatedAt)
                                 .ToList();

            var dtos = new List<ActivityFeedCommentDto>();
            foreach (var c in result)
            {
                var user = await _unitOfWork.Repository<User>().GetByIdAsync(c.UserId);
                dtos.Add(new ActivityFeedCommentDto
                {
                    Id = c.Id,
                    ActivityId = c.ActivityId,
                    UserId = c.UserId,
                    UserName = user?.Name,
                    Comment = c.Comment,
                    CreatedAt = c.CreatedAt
                });
            }
            return dtos;
        }

        private async Task<ActivityFeedDto> MapToDtoAsync(ActivityFeed activity, int? currentUserId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(activity.UserId);
            var likes = await _unitOfWork.Repository<ActivityFeedLike>().GetAllAsync();
            var comments = await _unitOfWork.Repository<ActivityFeedComment>().GetAllAsync();

            var activityLikes = likes.Where(l => l.ActivityId == activity.ActivityId).ToList();
            var activityComments = comments.Where(c => c.ActivityId == activity.ActivityId).ToList();

            var dto = _mapper.Map<ActivityFeedDto>(activity);
            dto.UserName = user?.Name;
            dto.LikesCount = activityLikes.Count;
            dto.CommentsCount = activityComments.Count;
            dto.IsLikedByCurrentUser = currentUserId.HasValue && activityLikes.Any(l => l.UserId == currentUserId.Value);
            return dto;
        }
    }
}
