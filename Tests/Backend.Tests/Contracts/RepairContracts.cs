namespace Backend.Tests.Contracts
{
    /// <summary>
    /// Wire shapes of the repairs API as the browser sees them. Enums are kept as strings so the tests
    /// pin the exact values the frontend relies on, such as "InProgress" and "Urgent".
    /// </summary>
    public sealed record RepairJobDto(
        int Id,
        string Reference,
        string HouseName,
        string Description,
        string ReporterName,
        string Priority,
        string Status,
        string? LatestNote,
        DateTimeOffset? LatestNoteAt,
        string? CompletionNote,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt,
        DateTimeOffset? StartedAt,
        DateTimeOffset? CompletedAt,
        int Version,
        IReadOnlyList<RepairHistoryEntryDto> History);

    public sealed record RepairHistoryEntryDto(
        int Id,
        string Type,
        string Status,
        string? Note,
        string ActorName,
        DateTimeOffset CreatedAt);

    public sealed record RepairJobChangedDto(
        string Kind,
        RepairJobDto Job,
        string ActorUserId,
        string ActorName);

    public sealed record OnlineUserDto(
        string UserId,
        string DisplayName,
        string? ProfilePictureUrl,
        IReadOnlyList<int> ViewingJobIds);

    public sealed record ReportRepairRequest(
        string? Description,
        string? ReporterName,
        string? Priority);

    public static class RepairStatuses
    {
        public const string New = "New";
        public const string InProgress = "InProgress";
        public const string Completed = "Completed";
    }

    public static class RepairPriorities
    {
        public const string Normal = "Normal";
        public const string Urgent = "Urgent";
    }

    public static class RepairHistoryTypes
    {
        public const string Reported = "Reported";
        public const string WorkStarted = "WorkStarted";
        public const string ProgressNote = "ProgressNote";
        public const string Completed = "Completed";
    }
}
