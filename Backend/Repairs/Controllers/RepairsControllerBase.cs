using Backend.Auth.Dto;
using Backend.Helpers;
using Backend.Repairs.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Repairs.Controllers
{
    /// <summary>
    /// Shared helpers for the repair job controllers.
    /// </summary>
    public abstract class RepairsControllerBase : ControllerBase
    {
        protected readonly IRepairJobService Service;
        protected readonly RepairActorResolver ActorResolver;

        protected RepairsControllerBase(IRepairJobService service, RepairActorResolver actorResolver)
        {
            Service = service;
            ActorResolver = actorResolver;
        }

        protected Task<RepairActor?> GetActorAsync()
        {
            return ActorResolver.ResolveAsync(User);
        }

        /// <summary>
        /// Maps a failed service result to an HTTP error carrying a translatable message key.
        /// </summary>
        protected IActionResult ToErrorResult(RepairJobResult result)
        {
            var messageKey = result.MessageKey ?? BackendMessageKeys.ValidationFailed;

            return result.Error switch
            {
                RepairJobErrorKind.NotFound => NotFound(new ErrorResponse { Error = messageKey }),
                RepairJobErrorKind.Validation => BadRequest(new ErrorResponse
                {
                    Error = BackendMessageKeys.ValidationFailed,
                    Errors = new Dictionary<string, string[]> { [result.Field ?? "request"] = [messageKey] },
                }),
                RepairJobErrorKind.InvalidState or RepairJobErrorKind.Conflict => Conflict(new ErrorResponse { Error = messageKey }),
                _ => BadRequest(new ErrorResponse { Error = messageKey }),
            };
        }

        protected IActionResult ToActionResult(RepairJobResult result)
        {
            return result.Succeeded ? Ok(result.Job) : ToErrorResult(result);
        }
    }
}
