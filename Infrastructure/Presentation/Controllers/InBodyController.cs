using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction.Services;
using Shared.DTOs.InBody;

namespace IntelliFit.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/inbody")]
    public class InBodyController : ControllerBase
    {
        private readonly IInBodyService _inBodyService;

        public InBodyController(IInBodyService inBodyService)
        {
            _inBodyService = inBodyService;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserMeasurements(int userId)
        {
            var measurements = await _inBodyService.GetUserMeasurementsAsync(userId);
            return Ok(measurements);
        }

        [HttpGet("{measurementId}")]
        public async Task<IActionResult> GetMeasurementById(int measurementId)
        {
            var measurement = await _inBodyService.GetMeasurementByIdAsync(measurementId);
            if (measurement == null)
            {
                return NotFound(new { message = "InBody measurement not found" });
            }
            return Ok(measurement);
        }

        [HttpGet("user/{userId}/latest")]
        public async Task<IActionResult> GetLatestMeasurement(int userId)
        {
            var measurement = await _inBodyService.GetLatestMeasurementAsync(userId);
            if (measurement == null)
            {
                return NotFound(new { message = "No measurements found for this user" });
            }
            return Ok(measurement);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMeasurement([FromBody] CreateInBodyMeasurementDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var measurement = await _inBodyService.CreateMeasurementAsync(createDto);
                return CreatedAtAction(nameof(GetMeasurementById), new { measurementId = measurement.MeasurementId }, measurement);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
