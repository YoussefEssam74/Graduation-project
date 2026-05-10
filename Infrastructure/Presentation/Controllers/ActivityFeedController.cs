using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using IntelliFit.Shared.DTOs.User;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/activity-feed")]
    public class ActivityFeedController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Create Activity

        [HttpPost]
        public async Task<ActionResult<ActivityFeedDto>> CreateActivity([FromBody] CreateActivityFeedDto dto)
        {
            dto.UserId = GetUserIdFromToken();
            var activity = await _serviceManager.ActivityFeedService.CreateActivityAsync(dto);
            return Ok(activity);
        }

        #endregion

        #region Get User Activities

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<ActivityFeedDto>>> GetUserActivities(int userId, [FromQuery] int limit = 50)
        {
            var activities = await _serviceManager.ActivityFeedService.GetUserActivitiesAsync(userId, limit);
            return Ok(activities);
        }

        #endregion

        #region Get Recent Activities

        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<ActivityFeedDto>>> GetRecentActivities([FromQuery] int limit = 100)
        {
            var userId = GetUserIdFromToken();
            var activities = await _serviceManager.ActivityFeedService.GetRecentActivitiesAsync(limit, userId);
            return Ok(activities);
        }

        #endregion

        #region Delete Activity

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteActivity(int id)
        {
            var userId = GetUserIdFromToken();
            await _serviceManager.ActivityFeedService.DeleteActivityAsync(id, userId);
            return NoContent();
        }

        #endregion

        #region Like / Unlike

        [HttpPost("{id}/like")]
        public async Task<ActionResult> LikeActivity(int id)
        {
            var userId = GetUserIdFromToken();
            await _serviceManager.ActivityFeedService.LikeActivityAsync(id, userId);
            return Ok(new { success = true });
        }

        [HttpDelete("{id}/like")]
        public async Task<ActionResult> UnlikeActivity(int id)
        {
            var userId = GetUserIdFromToken();
            await _serviceManager.ActivityFeedService.UnlikeActivityAsync(id, userId);
            return Ok(new { success = true });
        }

        #endregion

        #region Comments

        [HttpPost("{id}/comment")]
        public async Task<ActionResult<ActivityFeedCommentDto>> AddComment(int id, [FromBody] AddCommentDto dto)
        {
            var userId = GetUserIdFromToken();
            var comment = await _serviceManager.ActivityFeedService.AddCommentAsync(id, userId, dto.Comment);
            return Ok(comment);
        }

        [HttpGet("{id}/comments")]
        public async Task<ActionResult<IEnumerable<ActivityFeedCommentDto>>> GetComments(int id)
        {
            var comments = await _serviceManager.ActivityFeedService.GetCommentsAsync(id);
            return Ok(comments);
        }

        #endregion
    }
}
