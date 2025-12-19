using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Graduation_Project.Controllers
{
    [ApiController]
    [Route("api/coach")]
    public class CoachController : ControllerBase
    {
        [HttpPost("message")]
        public async Task<IActionResult> Message([FromBody] object payload)
        {
            return Ok(new { reply = "[stub coach reply]" });
        }

        [HttpPost("schedule")]
        public async Task<IActionResult> Schedule([FromBody] object payload)
        {
            return Ok(new { status = "scheduled" });
        }

        [HttpGet("history")]
        public async Task<IActionResult> History([FromQuery] string userId)
        {
            return Ok(new { messages = new object[] { } });
        }
    }
}
