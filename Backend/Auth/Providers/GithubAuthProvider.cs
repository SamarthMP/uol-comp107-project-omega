using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using System.Text.Json;

namespace Backend.Auth.Providers
{
    public class GithubAuthProvider : AuthProviderBase
    {
        private string? ClientID => Environment.GetEnvironmentVariable("GITHUB_CLIENT_ID");
        private string? ClientSecret => Environment.GetEnvironmentVariable("GITHUB_CLIENT_SECRET");
        public override bool IsEnabled() => (!string.IsNullOrEmpty(ClientID) && !string.IsNullOrEmpty(ClientSecret));

        public override AuthProviderInfo GetInfo()
        {
            return new AuthProviderInfo
            {
                ID = "GitHub",
                DisplayName = "GitHub",
                IconURL = "https://github.githubassets.com/favicons/favicon-dark.png",
                AccentColor = "#000000",
                TextColor = "#FFFFFF",
            };
        }

        public override AuthenticationBuilder Configure(AuthenticationBuilder builder)
        {
            return builder.AddOAuth("GitHub", options =>
            {
                options.SignInScheme = IdentityConstants.ExternalScheme;
                options.ClientId = ClientID!;
                options.ClientSecret = ClientSecret!;
                options.AuthorizationEndpoint = "https://github.com/login/oauth/authorize";
                options.TokenEndpoint = "https://github.com/login/oauth/access_token";
                options.UserInformationEndpoint = "https://api.github.com/user";
                options.CallbackPath = "/api/auth/callback/github";
                options.Scope.Add("user:email");
                options.SaveTokens = true;

                options.Events.OnCreatingTicket = async context =>
                {
                    // Fetch user profile from GitHub
                    var request = new HttpRequestMessage(HttpMethod.Get, context.Options.UserInformationEndpoint);
                    request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", context.AccessToken);
                    request.Headers.Add("User-Agent", AuthConfig.AppName);

                    var response = await context.Backchannel.SendAsync(request, context.HttpContext.RequestAborted);
                    response.EnsureSuccessStatusCode();

                    var user = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                    var root = user.RootElement;

                    // Map claims from GitHub user info
                    if (root.TryGetProperty("id", out var idProp))
                    {
                        context.Identity?.AddClaim(new Claim(ClaimTypes.NameIdentifier, idProp.ToString()));

                        // Profile picture on GitHub is a url tied to the user ID, so we can construct it without an extra API call
                        context.Identity?.AddClaim(new Claim("avatar_url", $"https://avatars.githubusercontent.com/u/{idProp.ToString()}?v=4"));
                    }

                    if (root.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == JsonValueKind.String)
                        context.Identity?.AddClaim(new Claim(ClaimTypes.Name, nameProp.GetString()!));
                    if (root.TryGetProperty("email", out var emailProp) && emailProp.ValueKind == JsonValueKind.String)
                        context.Identity?.AddClaim(new Claim(ClaimTypes.Email, emailProp.GetString()!));

                    // If email is not public on GitHub, fetch from the /user/emails endpoint
                    if (string.IsNullOrEmpty(context.Identity?.FindFirst(ClaimTypes.Email)?.Value))
                    {
                        var emailRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user/emails");
                        emailRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", context.AccessToken);
                        emailRequest.Headers.Add("User-Agent", AuthConfig.AppName);

                        var emailResponse = await context.Backchannel.SendAsync(emailRequest, context.HttpContext.RequestAborted);
                        if (emailResponse.IsSuccessStatusCode)
                        {
                            var emails = JsonDocument.Parse(await emailResponse.Content.ReadAsStringAsync());
                            var primaryEmail = emails.RootElement.EnumerateArray()
                                .FirstOrDefault(e => e.GetProperty("primary").GetBoolean());
                            if (primaryEmail.ValueKind != JsonValueKind.Undefined)
                            {
                                context.Identity?.AddClaim(new Claim(
                                    ClaimTypes.Email,
                                    primaryEmail.GetProperty("email").GetString()!));
                            }
                        }
                    }
                };
            });
        }

    }
}
