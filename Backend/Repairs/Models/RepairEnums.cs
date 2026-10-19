using System.Text.Json.Serialization;

namespace Backend.Repairs.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter<RepairPriority>))]
    public enum RepairPriority
    {
        Normal,
        Urgent
    }

    [JsonConverter(typeof(JsonStringEnumConverter<RepairStatus>))]
    public enum RepairStatus
    {
        New,
        InProgress,
        Completed
    }

    /// <summary>
    /// The kind of event recorded in a job's history. Also used to describe realtime change notifications.
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<RepairHistoryEntryType>))]
    public enum RepairHistoryEntryType
    {
        Reported,
        WorkStarted,
        ProgressNote,
        Completed
    }
}
