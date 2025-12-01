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
            var result = await _serviceManager.AuthService.LoginAsync(loginDto);
            return Ok(result);
        }

        #endregion

        #region Register

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto registerDto)
        {
            var result = await _serviceManager.AuthService.RegisterAsync(registerDto);
            return Ok(result);
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
