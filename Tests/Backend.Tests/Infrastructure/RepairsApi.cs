using Backend.Tests.Contracts;
using System.Net;
using System.Net.Http.Json;

namespace Backend.Tests.Infrastructure
{
    /// <summary>
    /// Thin wrappers over the repairs REST endpoints. The Post* methods return the raw response for
    /// negative tests, the others assert success and return the job.
    /// </summary>
    public static class RepairsApi
    {
        public const string JobsPath = "/api/repairs/jobs";

        public static string JobPath(int id) => $"{JobsPath}/{id}";

        public static Task<HttpResponseMessage> PostReportAsync(this HttpClient client, ReportRepairRequest request)
        {
            return client.PostAsJsonAsync(JobsPath, request, ApiResponses.JsonOptions);
        }

        public static Task<HttpResponseMessage> PostStartAsync(this HttpClient client, int id)
        {
            return client.PostAsync($"{JobPath(id)}/start", content: null);
        }

        public static Task<HttpResponseMessage> PostNoteAsync(this HttpClient client, int id, string? note)
        {
            return client.PostAsJsonAsync($"{JobPath(id)}/notes", new { note }, ApiResponses.JsonOptions);
        }

        public static Task<HttpResponseMessage> PostCompleteAsync(this HttpClient client, int id, string? completionNote)
        {
            return client.PostAsJsonAsync($"{JobPath(id)}/complete", new { completionNote }, ApiResponses.JsonOptions);
        }

        public static async Task<RepairJobDto> ReportAsync(this HttpClient client, string description, string reporterName, string priority = RepairPriorities.Normal)
        {
            using var response = await client.PostReportAsync(new ReportRepairRequest(description, reporterName, priority));
            return await response.ExpectJsonAsync<RepairJobDto>(HttpStatusCode.Created);
        }

        public static async Task<RepairJobDto> StartWorkAsync(this HttpClient client, int id)
        {
            using var response = await client.PostStartAsync(id);
            return await response.ExpectJsonAsync<RepairJobDto>(HttpStatusCode.OK);
        }

        public static async Task<RepairJobDto> AddNoteAsync(this HttpClient client, int id, string note)
        {
            using var response = await client.PostNoteAsync(id, note);
            return await response.ExpectJsonAsync<RepairJobDto>(HttpStatusCode.OK);
        }

        public static async Task<RepairJobDto> CompleteAsync(this HttpClient client, int id, string completionNote)
        {
            using var response = await client.PostCompleteAsync(id, completionNote);
            return await response.ExpectJsonAsync<RepairJobDto>(HttpStatusCode.OK);
        }

        public static async Task<RepairJobDto> GetJobAsync(this HttpClient client, int id)
        {
            using var response = await client.GetAsync(JobPath(id));
            return await response.ExpectJsonAsync<RepairJobDto>(HttpStatusCode.OK);
        }

        /// <summary>
        /// Returns the job exactly as serialized by the server, for byte-for-byte "nothing changed" comparisons.
        /// </summary>
        public static async Task<string> GetJobJsonAsync(this HttpClient client, int id)
        {
            using var response = await client.GetAsync(JobPath(id));
            await response.ExpectStatusAsync(HttpStatusCode.OK);
            return await response.Content.ReadAsStringAsync();
        }

        public static async Task<IReadOnlyList<RepairJobDto>> ListJobsAsync(this HttpClient client)
        {
            using var response = await client.GetAsync(JobsPath);
            return await response.ExpectJsonAsync<List<RepairJobDto>>(HttpStatusCode.OK);
        }

        /// <summary>
        /// Reports a job and takes it through start, a progress note and completion.
        /// </summary>
        public static async Task<RepairJobDto> ReportAndCompleteAsync(this HttpClient client, string description, string note, string completionNote)
        {
            var job = await client.ReportAsync(description, "Alex Morgan", RepairPriorities.Urgent);
            await client.StartWorkAsync(job.Id);
            await client.AddNoteAsync(job.Id, note);
            return await client.CompleteAsync(job.Id, completionNote);
        }
    }
}
