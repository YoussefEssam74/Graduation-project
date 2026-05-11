using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.Helpers;
using Shared.DTOs.Achievement;

namespace Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AchievementsController(IServiceManager _serviceManager) : ApiControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<AchievementDto>>>> GetAll()
        {
            try
            {
                var achievements = await _serviceManager.AchievementsService.GetAllAchievementsAsync();
                return Ok(ApiResponse<IEnumerable<AchievementDto>>.SuccessResponse(achievements));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<AchievementDto>>.ErrorResponse("Failed to retrieve achievements", new List<string> { ex.Message }));
            }
        }

        [HttpGet("user/{userId:int}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<UserAchievementDto>>>> GetUserAchievements(int userId)
        {
            try
            {
                var userAchievements = await _serviceManager.AchievementsService.GetUserAchievementsAsync(userId);
                return Ok(ApiResponse<IEnumerable<UserAchievementDto>>.SuccessResponse(userAchievements));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<UserAchievementDto>>.ErrorResponse("Failed to retrieve user achievements", new List<string> { ex.Message }));
            }
        }

        [HttpGet("my")]
        public async Task<ActionResult<ApiResponse<IEnumerable<UserAchievementDto>>>> GetMyAchievements()
        {
            try
            {
                var userId = GetUserIdFromToken();
                var userAchievements = await _serviceManager.AchievementsService.GetUserAchievementsAsync(userId);
                return Ok(ApiResponse<IEnumerable<UserAchievementDto>>.SuccessResponse(userAchievements));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<UserAchievementDto>>.ErrorResponse("Failed to retrieve achievements", new List<string> { ex.Message }));
            }
        }

        [HttpPost("check")]
        public async Task<ActionResult<ApiResponse<IEnumerable<UserAchievementDto>>>> CheckAndAward()
        {
            try
            {
                var userId = GetUserIdFromToken();
                var awarded = await _serviceManager.AchievementsService.CheckAndAwardAchievementsAsync(userId);
                return Ok(ApiResponse<IEnumerable<UserAchievementDto>>.SuccessResponse(awarded, "Achievements checked successfully"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<UserAchievementDto>>.ErrorResponse("Failed to check achievements", new List<string> { ex.Message }));
            }
        }
    }
}
