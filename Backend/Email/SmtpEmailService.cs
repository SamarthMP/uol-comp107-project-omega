using System.Net;
using System.Net.Mail;

namespace Backend.Email
{
    public class SmtpEmailService : IEmailService
    {
        private readonly SmtpConfig Config;
        private readonly IWebHostEnvironment Environment;

        public bool IsEnabled => Config.IsConfigured;

        public SmtpEmailService(SmtpConfig config, IWebHostEnvironment environment)
        {
            Config = config;
            Environment = environment;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            if (!IsEnabled)
                throw new InvalidOperationException("SMTP is not configured.");

            using var client = new SmtpClient(Config.Host, Config.Port)
            {
                Credentials = new NetworkCredential(Config.Username, Config.Password),
                EnableSsl = Config.UseSsl,
            };

            var message = new MailMessage
            {
                From = new MailAddress(Config.FromAddress, Config.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
            };
            message.To.Add(toEmail);

            await client.SendMailAsync(message);
        }

        public async Task SendTemplatedEmailAsync(string toEmail, string subject, string templateName, Dictionary<string, string> replacements)
        {
            var templatePath = Path.Combine(Environment.WebRootPath, "emails", $"{templateName}.html");

            if (!File.Exists(templatePath))
                throw new FileNotFoundException($"Email template not found: {templateName}");

            var html = await File.ReadAllTextAsync(templatePath);

            foreach (var (key, value) in replacements)
            {
                html = html.Replace($"{{{{{key}}}}}", value);
            }

            await SendEmailAsync(toEmail, subject, html);
        }
    }
}
