using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction;
using Shared.Helpers;
using Shared.DTOs.Stats;

namespace Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/stats")]
    public class StatsController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get Stats
        [HttpGet("member/{memberId}")]
        public async Task<IActionResult> GetMemberStats(int memberId)
        {
            try
            {
                var stats = await _serviceManager.StatsService.GetMemberStatsAsync(memberId);
                return Ok(stats);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("coach/{coachId}")]
        public async Task<IActionResult> GetCoachStats(int coachId)
        {
            try
            {
                var stats = await _serviceManager.StatsService.GetCoachStatsAsync(coachId);
                return Ok(stats);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("reception")]
        public async Task<IActionResult> GetReceptionStats()
        {
            var stats = await _serviceManager.StatsService.GetReceptionStatsAsync();
            return Ok(stats);
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminStats()
        {
            try
            {
                var stats = await _serviceManager.StatsService.GetAdminStatsAsync();
                return Ok(ApiResponse<AdminStatsDto>.SuccessResponse(stats));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<AdminStatsDto>.ErrorResponse("Failed to retrieve admin stats", new List<string> { ex.Message }));
            }
        }
        #endregion
    }
}
