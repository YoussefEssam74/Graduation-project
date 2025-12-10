using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Auth;

namespace Presentation.Controllers
{
    public class AuthController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Login

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginRequestDto loginDto)
        {
            try
            {
                var result = await _serviceManager.AuthService.LoginAsync(loginDto);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                // Treat invalid operations as bad requests (e.g., account issues)
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        #endregion

        #region Register

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto registerDto)
        {
            try
            {
                var result = await _serviceManager.AuthService.RegisterAsync(registerDto);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        #endregion

        #region Check Email

        [HttpGet("emailexists")]
        public async Task<ActionResult<bool>> CheckEmail(string email)
        {
            var result = await _serviceManager.AuthService.EmailExistsAsync(email);
            return Ok(result);
        }

        #endregion
    }
}
