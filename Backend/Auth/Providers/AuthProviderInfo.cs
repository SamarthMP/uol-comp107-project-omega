namespace Backend.Auth.Providers
{
    public class AuthProviderInfo
    {
        public required string ID { get; set; }
        public required string DisplayName { get; set; }
        public string? IconURL { get; set; }
        public string? AccentColor { get; set; } = "#000000";
        public string? TextColor { get; set; } = "#FFFFFF";
    }
}
