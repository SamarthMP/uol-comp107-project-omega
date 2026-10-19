using Backend.Repairs.Dto;

namespace Backend.Repairs.Services
{
    public enum RepairJobErrorKind
    {
        None,
        NotFound,
        Validation,
        InvalidState,
        Conflict
    }

    /// <summary>
    /// The outcome of a repair job operation: either the updated job, or an error with a translatable message key.
    /// </summary>
    public sealed class RepairJobResult
    {
        public RepairJobResponse? Job { get; private init; }
        public RepairJobErrorKind Error { get; private init; }
        public string? MessageKey { get; private init; }

        /// <summary>
        /// The request field the error relates to, for validation errors.
        /// </summary>
        public string? Field { get; private init; }

        public bool Succeeded => Error == RepairJobErrorKind.None;

        public static RepairJobResult Success(RepairJobResponse job) => new() { Job = job };

        public static RepairJobResult Failure(RepairJobErrorKind error, string messageKey, string? field = null) => new()
        {
            Error = error,
            MessageKey = messageKey,
            Field = field,
        };
    }

    /// <summary>
    /// The signed-in person performing an action, recorded against history entries.
    /// </summary>
    public sealed record RepairActor(string UserId, string DisplayName);
}
