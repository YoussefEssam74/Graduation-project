using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction.Services;
using Shared.DTOs.Meal;

namespace IntelliFit.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/meals")]
    public class MealController : ControllerBase
    {
        private readonly IMealService _mealService;

        public MealController(IMealService mealService)
        {
            _mealService = mealService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllMeals()
        {
            var meals = await _mealService.GetAllMealsAsync();
            return Ok(meals);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveMeals()
        {
            var meals = await _mealService.GetActiveMealsAsync();
            return Ok(meals);
        }

        [HttpGet("{mealId}")]
        public async Task<IActionResult> GetMealById(int mealId)
        {
            var meal = await _mealService.GetMealByIdAsync(mealId);
            if (meal == null)
            {
                return NotFound(new { message = "Meal not found" });
            }
            return Ok(meal);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMeal([FromBody] CreateMealDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var meal = await _mealService.CreateMealAsync(createDto);
            return CreatedAtAction(nameof(GetMealById), new { mealId = meal.MealId }, meal);
        }

        [HttpPut("{mealId}")]
        public async Task<IActionResult> UpdateMeal(int mealId, [FromBody] CreateMealDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var meal = await _mealService.UpdateMealAsync(mealId, updateDto);
                return Ok(meal);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("{mealId}")]
        public async Task<IActionResult> DeleteMeal(int mealId)
        {
            try
            {
                await _mealService.DeleteMealAsync(mealId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
