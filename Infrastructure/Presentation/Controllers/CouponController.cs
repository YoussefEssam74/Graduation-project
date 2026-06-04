using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Subscription;
using Shared.Helpers;

namespace Presentation.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/coupons")]
    [ApiController]
    public class CouponController(IServiceManager _serviceManager) : ApiControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<CouponDto>>>> GetAllCoupons()
        {
            try
            {
                var coupons = await _serviceManager.CouponService.GetAllCouponsAsync();
                return Ok(ApiResponse<IEnumerable<CouponDto>>.SuccessResponse(coupons));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<CouponDto>>.ErrorResponse("Failed to retrieve coupons", new List<string> { ex.Message }));
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<CouponDto>>> GetCoupon(int id)
        {
            try
            {
                var coupon = await _serviceManager.CouponService.GetCouponByIdAsync(id);
                if (coupon == null) return NotFound(ApiResponse<CouponDto>.ErrorResponse("Coupon not found."));
                return Ok(ApiResponse<CouponDto>.SuccessResponse(coupon));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<CouponDto>.ErrorResponse("Failed to retrieve coupon", new List<string> { ex.Message }));
            }
        }

        [HttpGet("code/{code}")]
        [AllowAnonymous] // Allow checkout page to check coupons before login or during booking
        public async Task<ActionResult<ApiResponse<CouponDto>>> GetCouponByCode(string code)
        {
            try
            {
                var coupon = await _serviceManager.CouponService.GetCouponByCodeAsync(code);
                if (coupon == null) return NotFound(ApiResponse<CouponDto>.ErrorResponse("Coupon code not found."));
                return Ok(ApiResponse<CouponDto>.SuccessResponse(coupon));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<CouponDto>.ErrorResponse("Failed to retrieve coupon", new List<string> { ex.Message }));
            }
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<CouponDto>>> CreateCoupon([FromBody] CreateCouponDto dto)
        {
            try
            {
                var coupon = await _serviceManager.CouponService.CreateCouponAsync(dto);
                return Ok(ApiResponse<CouponDto>.SuccessResponse(coupon, "Coupon created successfully."));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<CouponDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<CouponDto>.ErrorResponse("Failed to create coupon", new List<string> { ex.Message }));
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<CouponDto>>> UpdateCoupon(int id, [FromBody] UpdateCouponDto dto)
        {
            try
            {
                var coupon = await _serviceManager.CouponService.UpdateCouponAsync(id, dto);
                return Ok(ApiResponse<CouponDto>.SuccessResponse(coupon, "Coupon updated successfully."));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<CouponDto>.ErrorResponse(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<CouponDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<CouponDto>.ErrorResponse("Failed to update coupon", new List<string> { ex.Message }));
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteCoupon(int id)
        {
            try
            {
                var deleted = await _serviceManager.CouponService.DeleteCouponAsync(id);
                if (!deleted) return NotFound(ApiResponse<bool>.ErrorResponse("Coupon not found."));
                return Ok(ApiResponse<bool>.SuccessResponse(true, "Coupon deleted successfully."));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Failed to delete coupon", new List<string> { ex.Message }));
            }
        }

        [HttpGet("validate/{code}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<CouponDto>>> ValidateCoupon(string code)
        {
            try
            {
                var coupon = await _serviceManager.CouponService.ValidateCouponAsync(code);
                if (coupon == null) return BadRequest(ApiResponse<CouponDto>.ErrorResponse("Coupon code is invalid, expired, or has reached its usage limit."));
                return Ok(ApiResponse<CouponDto>.SuccessResponse(coupon, "Coupon code is valid."));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<CouponDto>.ErrorResponse("Failed to validate coupon", new List<string> { ex.Message }));
            }
        }
    }
}
