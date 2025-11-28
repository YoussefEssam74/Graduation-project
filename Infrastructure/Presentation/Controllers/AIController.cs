using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction.Services;
using Shared.DTOs.AI;

namespace IntelliFit.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/ai")]
    public class AIController : ControllerBase
    {
        private readonly IAIChatService _aiChatService;

        public AIController(IAIChatService aiChatService)
        {
            _aiChatService = aiChatService;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> SendMessage([FromBody] AIChatRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _aiChatService.SendMessageAsync(request);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetChatHistory(int userId, [FromQuery] int limit = 50)
        {
            var history = await _aiChatService.GetChatHistoryAsync(userId, limit);
            return Ok(history);
        }
    }
}
