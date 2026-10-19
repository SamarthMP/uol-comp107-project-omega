namespace Backend.Email
{
    public interface IEmailService
    {
        bool IsEnabled { get; }
        Task SendEmailAsync(string toEmail, string subject, string htmlBody);
        Task SendTemplatedEmailAsync(string toEmail, string subject, string templateName, Dictionary<string, string> replacements);
    }
}
