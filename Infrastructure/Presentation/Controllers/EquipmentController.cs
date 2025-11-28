using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction.Services;
using Shared.DTOs.Equipment;
using Shared.Helpers;

namespace IntelliFit.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentController : ControllerBase
    {
        private readonly IEquipmentService _equipmentService;

        public EquipmentController(IEquipmentService equipmentService)
        {
            _equipmentService = equipmentService;
        }

        /// <summary>
        /// Get all equipment
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<EquipmentDto>>>> GetAllEquipment()
        {
            try
            {
                var equipment = await _equipmentService.GetAllEquipmentAsync();
                return Ok(ApiResponse<IEnumerable<EquipmentDto>>.SuccessResponse(equipment));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<EquipmentDto>>.ErrorResponse("Failed to retrieve equipment", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get available equipment only
        /// </summary>
        [HttpGet("available")]
        public async Task<ActionResult<ApiResponse<IEnumerable<EquipmentDto>>>> GetAvailableEquipment()
        {
            try
            {
                var equipment = await _equipmentService.GetAvailableEquipmentAsync();
                return Ok(ApiResponse<IEnumerable<EquipmentDto>>.SuccessResponse(equipment));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<EquipmentDto>>.ErrorResponse("Failed to retrieve available equipment", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get equipment by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<EquipmentDto>>> GetEquipment(int id)
        {
            try
            {
                var equipment = await _equipmentService.GetEquipmentByIdAsync(id);

                if (equipment == null)
                {
                    return NotFound(ApiResponse<EquipmentDto>.ErrorResponse("Equipment not found"));
                }

                return Ok(ApiResponse<EquipmentDto>.SuccessResponse(equipment));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<EquipmentDto>.ErrorResponse("Failed to retrieve equipment", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Update equipment status
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<EquipmentDto>>> UpdateEquipmentStatus(int id, [FromBody] int status)
        {
            try
            {
                var equipment = await _equipmentService.UpdateEquipmentStatusAsync(id, status);
                return Ok(ApiResponse<EquipmentDto>.SuccessResponse(equipment, "Equipment status updated successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<EquipmentDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<EquipmentDto>.ErrorResponse("Failed to update equipment status", new List<string> { ex.Message }));
            }
        }
    }
}
