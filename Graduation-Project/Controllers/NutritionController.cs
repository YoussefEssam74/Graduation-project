using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Graduation_Project.Controllers
{
    [ApiController]
    [Route("api/nutrition")]
    public class NutritionController : ControllerBase
    {
        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] object payload)
        {
            return Ok(new { meal_plan = "[stub meal plan]" });
        }

        [HttpPost("feedback")]
        public async Task<IActionResult> Feedback([FromBody] object payload)
        {
            return Ok(new { status = "received" });
        }
    }
}
