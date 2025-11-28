using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction.Services;

namespace IntelliFit.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/stats")]
    public class StatsController : ControllerBase
    {
        private readonly IStatsService _statsService;

        public StatsController(IStatsService statsService)
        {
            _statsService = statsService;
        }

        [HttpGet("member/{memberId}")]
        public async Task<IActionResult> GetMemberStats(int memberId)
        {
            try
            {
                var stats = await _statsService.GetMemberStatsAsync(memberId);
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
                var stats = await _statsService.GetCoachStatsAsync(coachId);
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
            var stats = await _statsService.GetReceptionStatsAsync();
            return Ok(stats);
        }
    }
}
