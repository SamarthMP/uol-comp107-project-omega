using Backend.Auth.Dto;
using Backend.Repairs.Dto;
using Backend.Repairs.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Repairs.Controllers
{
    /// <summary>
    /// Progresses an existing repair job: starting work, adding notes and completing it.
    /// </summary>
    [ApiController]
    [Authorize]
    [Route("api/repairs/jobs/{id:int}")]
    [Produces("application/json")]
    public class RepairJobWorkflowController : RepairsControllerBase
    {
        public RepairJobWorkflowController(IRepairJobService service, RepairActorResolver actorResolver)
            : base(service, actorResolver)
        { }

        [HttpPost("start")]
        [ProducesResponseType<RepairJobResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
        [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> StartWork(int id, CancellationToken cancellationToken)
        {
            var actor = await GetActorAsync();
            if (actor == null) return Unauthorized();

            return ToActionResult(await Service.StartWorkAsync(id, actor, cancellationToken));
        }

        [HttpPost("notes")]
        [ProducesResponseType<RepairJobResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
        [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> AddProgressNote(int id, [FromBody] AddProgressNoteRequest request, CancellationToken cancellationToken)
        {
            var actor = await GetActorAsync();
            if (actor == null) return Unauthorized();

            return ToActionResult(await Service.AddProgressNoteAsync(id, request.Note, actor, cancellationToken));
        }

        [HttpPost("complete")]
        [ProducesResponseType<RepairJobResponse>(StatusCodes.Status200OK)]
        [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
        [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Complete(int id, [FromBody] CompleteRepairJobRequest request, CancellationToken cancellationToken)
        {
            var actor = await GetActorAsync();
            if (actor == null) return Unauthorized();

            return ToActionResult(await Service.CompleteAsync(id, request.CompletionNote, actor, cancellationToken));
        }
    }
}
