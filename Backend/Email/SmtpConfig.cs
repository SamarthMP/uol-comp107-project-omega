using Backend.Auth;

namespace Backend.Email
{
    public class SmtpConfig
    {
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 587;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FromAddress { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
        public bool UseSsl { get; set; } = true;

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(Host) &&
            !string.IsNullOrWhiteSpace(Username) &&
            !string.IsNullOrWhiteSpace(Password) &&
            !string.IsNullOrWhiteSpace(FromAddress);

        public static SmtpConfig FromEnvironment()
        {
            return new SmtpConfig
            {
                Host = Environment.GetEnvironmentVariable("SMTP_HOST") ?? "",
                Port = int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT"), out var port) ? port : 587,
                Username = Environment.GetEnvironmentVariable("SMTP_USERNAME") ?? "",
                Password = Environment.GetEnvironmentVariable("SMTP_PASSWORD") ?? "",
                FromAddress = Environment.GetEnvironmentVariable("SMTP_FROM_ADDRESS") ?? "",
                FromName = Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? AuthConfig.AppName,
                UseSsl = Environment.GetEnvironmentVariable("SMTP_USE_SSL")?.ToLowerInvariant() != "false",
            };
        }
    }
}
