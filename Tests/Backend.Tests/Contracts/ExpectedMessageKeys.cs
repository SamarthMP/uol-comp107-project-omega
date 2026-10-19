namespace Backend.Tests.Contracts
{
    /// <summary>
    /// Message keys the frontend translates through en.json. Spelled out literally rather than borrowed from
    /// the backend constants, so renaming a key on the server fails a test instead of silently breaking the UI.
    /// </summary>
    public static class ExpectedMessageKeys
    {
        public const string ValidationFailed = "backendMessages.validationFailed";
        public const string RepairDescriptionRequired = "backendMessages.repairDescriptionRequired";
        public const string RepairReporterRequired = "backendMessages.repairReporterRequired";
        public const string RepairPriorityInvalid = "backendMessages.repairPriorityInvalid";
        public const string RepairNoteRequired = "backendMessages.repairNoteRequired";
        public const string RepairCompletionNoteRequired = "backendMessages.repairCompletionNoteRequired";
        public const string RepairJobNotFound = "backendMessages.repairJobNotFound";
        public const string RepairJobAlreadyStarted = "backendMessages.repairJobAlreadyStarted";
        public const string RepairJobAlreadyCompleted = "backendMessages.repairJobAlreadyCompleted";
    }
}
