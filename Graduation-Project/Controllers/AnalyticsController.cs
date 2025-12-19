using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Graduation_Project.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    public class AnalyticsController : ControllerBase
    {
        [HttpGet("equipment-usage")]
        public async Task<IActionResult> EquipmentUsage([FromQuery] string from, [FromQuery] string to, [FromQuery] string equipmentId)
        {
            return Ok(new { data = new object[] { } });
        }

        [HttpGet("forecast")]
        public async Task<IActionResult> Forecast([FromQuery] string metric, [FromQuery] int periods = 12)
        {
            return Ok(new { forecast = new object[] { } });
        }
    }
}
