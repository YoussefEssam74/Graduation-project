using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using ServiceAbstraction;
using Shared.DTOs.Allergy;
using System.Threading.Tasks;

namespace Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/allergies")]
    public class AllergiesController(IServiceManager _serviceManager, ILogger<AllergiesController> _logger) : ApiControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAllAllergies()
        {
            var results = await _serviceManager.AllergyService.GetAllAllergiesAsync();
            return Ok(results);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAllergy([FromBody] AllergyDto dto)
        {
            if (!IsCoach && !IsAdmin)
            {
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _serviceManager.AllergyService.CreateAllergyAsync(dto);
            return CreatedAtAction(nameof(GetAllAllergies), null, result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAllergy(int id)
        {
            if (!IsCoach && !IsAdmin)
            {
                return Forbid();
            }

            var success = await _serviceManager.AllergyService.DeleteAllergyAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Allergy with ID {id} not found" });
            }

            return Ok(new { success = true, message = "Allergy deleted successfully" });
        }
    }
}
