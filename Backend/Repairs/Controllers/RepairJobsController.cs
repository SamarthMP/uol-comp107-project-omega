using Backend.Auth.Dto;
using Backend.Helpers;
using Backend.Repairs.Dto;
using Backend.Repairs.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Repairs.Controllers
{
    /// <summary>
    /// Lists, reads and reports repair jobs for the house.
    /// </summary>
    [ApiController]
    [Authorize]
    [Route("api/repairs/jobs")]
    [Produces("application/json")]
    public class RepairJobsController : RepairsControllerBase
    {
        public RepairJobsController(IRepairJobService service, RepairActorResolver actorResolver)
            : base(service, actorResolver)
        { }

        [HttpGet]
        [ProducesResponseType<List<RepairJobResponse>>(StatusCodes.Status200OK)]
        public async Task<IActionResult> ListJobs(CancellationToken cancellationToken)
        {
            return Ok(await Service.ListAsync(cancellationToken));
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType<RepairJobResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetJob(int id, CancellationToken cancellationToken)
        {
            var job = await Service.GetAsync(id, cancellationToken);
            if (job == null)
                return NotFound(new ErrorResponse { Error = BackendMessageKeys.RepairJobNotFound });

            return Ok(job);
        }

        /// <summary>
        /// Reports a new repair. It starts as New with an automatic ID, timestamp and the house name.
        /// </summary>
        [HttpPost]
        [ProducesResponseType<RepairJobResponse>(StatusCodes.Status201Created)]
        [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateJob([FromBody] CreateRepairJobRequest request, CancellationToken cancellationToken)
        {
            var actor = await GetActorAsync();
            if (actor == null) return Unauthorized();

            var result = await Service.CreateAsync(request, actor, cancellationToken);
            if (!result.Succeeded)
                return ToErrorResult(result);

            return CreatedAtAction(nameof(GetJob), new { id = result.Job!.Id }, result.Job);
        }
    }
}
