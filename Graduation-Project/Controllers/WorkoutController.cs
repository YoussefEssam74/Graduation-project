using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Graduation_Project.Controllers
{
    [ApiController]
    [Route("api/workout")]
    public class WorkoutController : ControllerBase
    {
        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] object payload)
        {
            // payload should contain userProfile and preferences
            return Ok(new { plan = "[stub plan]", sources = new string[] { } });
        }

        [HttpPost("feedback")]
        public async Task<IActionResult> Feedback([FromBody] object payload)
        {
            return Ok(new { status = "received" });
        }
    }
}
