using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Helpers;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/status")]
    public class StatusController : ControllerBase
    {
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(BackendMessageKeys.Pong);
        }

        [Authorize]
        [HttpGet("whoami")]
        public IActionResult PingAuthenticated()
        {
            return Ok(BackendMessageKeys.LoggedIn);
        }
    }
}
