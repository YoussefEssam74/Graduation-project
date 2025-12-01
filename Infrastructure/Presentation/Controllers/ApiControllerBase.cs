using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class ApiControllerBase : ControllerBase
    {
        protected string GetEmailFromToken() => User.FindFirstValue(ClaimTypes.Email);
    }
}
