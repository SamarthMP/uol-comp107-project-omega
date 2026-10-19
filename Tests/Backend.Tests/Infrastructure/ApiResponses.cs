using Backend.Tests.Contracts;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Backend.Tests.Infrastructure
{
    /// <summary>
    /// JSON settings matching ASP.NET Core's web defaults, plus assertion helpers that print the response body on failure.
    /// </summary>
    public static class ApiResponses
    {
        public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public static async Task<T> ReadJsonAsync<T>(this HttpResponseMessage response)
        {
            var value = await response.Content.ReadFromJsonAsync<T>(JsonOptions);
            Assert.NotNull(value);
            return value;
        }

        public static async Task ExpectStatusAsync(this HttpResponseMessage response, HttpStatusCode expected)
        {
            if (response.StatusCode == expected)
                return;

            var body = await response.Content.ReadAsStringAsync();
            Assert.Fail($"Expected {(int)expected} {expected} from {response.RequestMessage?.Method} {response.RequestMessage?.RequestUri} but got {(int)response.StatusCode} {response.StatusCode}: {body}");
        }

        public static async Task<T> ExpectJsonAsync<T>(this HttpResponseMessage response, HttpStatusCode expected)
        {
            await response.ExpectStatusAsync(expected);
            return await response.ReadJsonAsync<T>();
        }

        /// <summary>
        /// Asserts an error response carrying the given top-level message key.
        /// </summary>
        public static async Task<ErrorDto> ExpectErrorAsync(this HttpResponseMessage response, HttpStatusCode expected, string messageKey)
        {
            var error = await response.ExpectJsonAsync<ErrorDto>(expected);
            Assert.Equal(messageKey, error.Error);
            return error;
        }

        /// <summary>
        /// Asserts a 400 validation response that reports <paramref name="messageKey"/> against <paramref name="field"/>.
        /// </summary>
        public static async Task<ErrorDto> ExpectValidationErrorAsync(this HttpResponseMessage response, string field, string messageKey)
        {
            var error = await response.ExpectErrorAsync(HttpStatusCode.BadRequest, ExpectedMessageKeys.ValidationFailed);

            Assert.NotNull(error.Errors);
            Assert.True(error.Errors.TryGetValue(field, out var fieldErrors), $"Expected a validation error for '{field}', got: {string.Join(", ", error.Errors.Keys)}");
            Assert.Contains(messageKey, fieldErrors);

            return error;
        }
    }
}
