namespace Backend.Repairs.Models
{
    /// <summary>
    /// Fixed values and field limits shared by the repair entities, DTOs and validation.
    /// </summary>
    public static class RepairLimits
    {
        public const string HouseName = "Meadow House";
        public const string ReferencePrefix = "MH";

        public const int HouseNameMaxLength = 64;
        public const int DescriptionMaxLength = 1000;
        public const int ReporterNameMaxLength = 100;
        public const int NoteMaxLength = 1000;

        public static string FormatReference(int id) => $"{ReferencePrefix}-{id:D4}";
    }
}
