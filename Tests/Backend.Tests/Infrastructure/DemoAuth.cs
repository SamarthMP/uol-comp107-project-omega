using Backend.Tests.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Headers;

namespace Backend.Tests.Infrastructure
{
    /// <summary>
    /// Signs in through the passwordless demo grant, the same way each browser tab does.
    /// </summary>
    public static class DemoAuth
    {
        public const string TokenPath = "/api/auth/token";
        public const string ProfilePath = "/api/auth/me";
        public const string DemoGrantType = "urn:custom:demo";

        public static Task<HttpResponseMessage> PostDemoGrantAsync(this HttpClient client)
        {
            return client.PostAsync(TokenPath, new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = DemoGrantType,
                ["scope"] = "offline_access",
            }));
        }

        public static Task<HttpResponseMessage> PostRefreshGrantAsync(this HttpClient client, string refreshToken)
        {
            return client.PostAsync(TokenPath, new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["refresh_token"] = refreshToken,
            }));
        }

        /// <summary>
        /// Creates a client that does not follow redirects, so status codes are observed exactly as sent.
        /// </summary>
        public static HttpClient CreateApiClient(this MeadowHouseFactory factory)
        {
            return factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        }

        public static HttpClient CreateApiClient(this MeadowHouseFactory factory, string accessToken)
        {
            var client = factory.CreateApiClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            return client;
        }

        public static async Task<TokenResponseDto> RequestDemoTokenAsync(this MeadowHouseFactory factory)
        {
            using var anonymous = factory.CreateApiClient();
            using var response = await anonymous.PostDemoGrantAsync();
            return await response.ExpectJsonAsync<TokenResponseDto>(HttpStatusCode.OK);
        }

        public static async Task<DemoSession> SignInDemoUserAsync(this MeadowHouseFactory factory)
        {
            var token = await factory.RequestDemoTokenAsync();
            var client = factory.CreateApiClient(token.AccessToken);

            using var response = await client.GetAsync(ProfilePath);
            var profile = await response.ExpectJsonAsync<ProfileDto>(HttpStatusCode.OK);

            return new DemoSession { Client = client, Token = token, Profile = profile };
        }
    }
}
