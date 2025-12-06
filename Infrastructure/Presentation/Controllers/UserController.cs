using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.User;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/users")]
    public class UserController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get User

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _serviceManager.UserService.GetUserByIdAsync(id);
            return Ok(user);
        }

        #endregion

        #region Update Profile

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateProfile(int id, [FromBody] UpdateProfileDto updateDto)
        {
            var user = await _serviceManager.UserService.UpdateProfileAsync(id, updateDto);
            return Ok(user);
        }

        #endregion

        #region Get Token Balance

        [HttpGet("{id}/tokens")]
        public async Task<ActionResult<int>> GetTokenBalance(int id)
        {
            var balance = await _serviceManager.UserService.GetTokenBalanceAsync(id);
            return Ok(balance);
        }

        #endregion

        #region Get Coaches List

        [HttpGet("coaches")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetCoaches()
        {
            var coaches = await _serviceManager.UserService.GetCoachesListAsync();
            return Ok(coaches);
        }

        #endregion

        #region Deactivate User

        [HttpDelete("{id}")]
        public async Task<ActionResult<bool>> DeactivateUser(int id)
        {
            var result = await _serviceManager.UserService.DeactivateUserAsync(id);
            return Ok(result);
        }

        #endregion

        #region User Metrics

        /// <summary>
        /// Get user's physical metrics (weight, height, BMI, fitness goals)
        /// </summary>
        [HttpGet("{id}/metrics")]
        public async Task<ActionResult<UserMetricsDto>> GetUserMetrics(int id)
        {
            // Users can only access their own metrics unless they're admin/coach
            var currentUserId = GetUserIdFromToken();
            if (currentUserId != id && !IsAdmin && !IsCoach)
            {
                return Forbid();
            }

            var metrics = await _serviceManager.UserService.GetUserMetricsAsync(id);
            if (metrics == null)
            {
                return NotFound(new { message = "User metrics not found. User may not be a member." });
            }
            return Ok(metrics);
        }

        #endregion

        #region Workout Summary

        /// <summary>
        /// Get user's workout summary with statistics
        /// </summary>
        [HttpGet("{id}/workout-summary")]
        public async Task<ActionResult<UserWorkoutSummaryDto>> GetWorkoutSummary(
            int id,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var currentUserId = GetUserIdFromToken();
            if (currentUserId != id && !IsAdmin && !IsCoach)
            {
                return Forbid();
            }

            var summary = await _serviceManager.UserService.GetUserWorkoutSummaryAsync(id, startDate, endDate);
            return Ok(summary);
        }

        #endregion

        #region AI Context

        /// <summary>
        /// Get comprehensive user context for AI personalization
        /// </summary>
        [HttpGet("{id}/ai-context")]
        public async Task<ActionResult<UserAIContextDto>> GetUserAIContext(int id)
        {
            var currentUserId = GetUserIdFromToken();
            if (currentUserId != id && !IsAdmin && !IsCoach)
            {
                return Forbid();
            }

            var context = await _serviceManager.UserService.GetUserAIContextAsync(id);
            return Ok(context);
        }

        #endregion
    }
}
