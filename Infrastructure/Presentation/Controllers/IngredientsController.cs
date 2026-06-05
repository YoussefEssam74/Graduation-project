using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using ServiceAbstraction;
using Shared.DTOs.Ingredient;
using System.Threading.Tasks;

namespace Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/ingredients")]
    public class IngredientsController(IServiceManager _serviceManager, ILogger<IngredientsController> _logger) : ApiControllerBase
    {
        [HttpGet("search")]
        public async Task<IActionResult> SearchIngredients(
            [FromQuery] string? query,
            [FromQuery] string? category,
            [FromQuery] string? foodRole,
            [FromQuery] bool onlyIncomplete = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var results = await _serviceManager.IngredientService.SearchIngredientsAsync(query, category, foodRole, onlyIncomplete, page, pageSize);
            return Ok(results);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetIngredientById(int id)
        {
            var result = await _serviceManager.IngredientService.GetIngredientByIdAsync(id);
            if (result == null)
            {
                return NotFound(new { message = $"Ingredient with ID {id} not found" });
            }
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateIngredient(int id, [FromBody] UpdateIngredientDto dto)
        {
            if (!IsCoach && !IsAdmin)
            {
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _serviceManager.IngredientService.UpdateIngredientAsync(id, dto);
            if (result == null)
            {
                return NotFound(new { message = $"Ingredient with ID {id} not found" });
            }

            return Ok(result);
        }
    }
}
