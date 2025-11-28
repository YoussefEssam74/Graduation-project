using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction.Services;
using Shared.DTOs.Auth;
using Shared.Helpers;

namespace IntelliFit.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Login user with email, password, and role
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequestDto loginDto)
        {
            try
            {
                var result = await _authService.LoginAsync(loginDto);
                return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Login successful"));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse<AuthResponseDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<AuthResponseDto>.ErrorResponse("Login failed", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Register new user
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterRequestDto registerDto)
        {
            try
            {
                var result = await _authService.RegisterAsync(registerDto);
                return Ok(ApiResponse<AuthResponseDto>.SuccessResponse(result, "Registration successful"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<AuthResponseDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<AuthResponseDto>.ErrorResponse("Registration failed", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Check if email exists
        /// </summary>
        [HttpGet("email-exists")]
        public async Task<ActionResult<ApiResponse<bool>>> EmailExists([FromQuery] string email)
        {
            try
            {
                var exists = await _authService.EmailExistsAsync(email);
                return Ok(ApiResponse<bool>.SuccessResponse(exists));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Check failed", new List<string> { ex.Message }));
            }
        }
    }
}
