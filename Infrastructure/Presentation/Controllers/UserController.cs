using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.User;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/users")]
    public class UserController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get User

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _serviceManager.UserService.GetUserByIdAsync(id);
            return Ok(user);
        }

        #endregion

        #region Update Profile

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateProfile(int id, [FromBody] UpdateProfileDto updateDto)
        {
            var user = await _serviceManager.UserService.UpdateProfileAsync(id, updateDto);
            return Ok(user);
        }

        #endregion

        #region Get Token Balance

        [HttpGet("{id}/tokens")]
        public async Task<ActionResult<int>> GetTokenBalance(int id)
        {
            var balance = await _serviceManager.UserService.GetTokenBalanceAsync(id);
            return Ok(balance);
        }

        #endregion

        #region Deactivate User

        [HttpDelete("{id}")]
        public async Task<ActionResult<bool>> DeactivateUser(int id)
        {
            var result = await _serviceManager.UserService.DeactivateUserAsync(id);
            return Ok(result);
        }

        #endregion
    }
}
