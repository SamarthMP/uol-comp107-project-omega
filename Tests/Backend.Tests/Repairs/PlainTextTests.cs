using Backend.Data;
using Backend.Tests.Contracts;
using Backend.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Repairs
{
    /// <summary>
    /// Brief test 10: typed text is stored and returned exactly as typed, never encoded, stripped or decoded.
    /// </summary>
    public class PlainTextTests : IClassFixture<MeadowHouseFactory>, IAsyncLifetime
    {
        private readonly MeadowHouseFactory Factory;
        private DemoSession Session = null!;

        public PlainTextTests(MeadowHouseFactory factory)
        {
            Factory = factory;
        }

        public async Task InitializeAsync()
        {
            Session = await Factory.SignInDemoUserAsync();
        }

        public Task DisposeAsync()
        {
            Session.Dispose();
            return Task.CompletedTask;
        }

        [Theory]
        [InlineData("<b>check gate</b>")]
        [InlineData("<script>alert('gate')</script>")]
        [InlineData("<img src=x onerror=alert(1)>")]
        [InlineData("&lt;b&gt; already escaped &amp; kept")]
        [InlineData("Tom & Jerry's \"gate\" > fence < shed")]
        public async Task Brief10_HtmlLookingTextRoundTripsExactly(string text)
        {
            var reported = await Session.Client.ReportAsync(text, text, RepairPriorities.Normal);
            Assert.Equal(text, reported.Description);
            Assert.Equal(text, reported.ReporterName);

            await Session.Client.StartWorkAsync(reported.Id);
            var noted = await Session.Client.AddNoteAsync(reported.Id, text);
            Assert.Equal(text, noted.LatestNote);

            var completed = await Session.Client.CompleteAsync(reported.Id, text);
            Assert.Equal(text, completed.CompletionNote);

            var reloaded = await Session.Client.GetJobAsync(reported.Id);
            Assert.Equal(text, reloaded.Description);
            Assert.Equal(text, reloaded.ReporterName);
            Assert.Equal(text, reloaded.LatestNote);
            Assert.Equal(text, reloaded.CompletionNote);
            Assert.All(
                reloaded.History.Where(entry => entry.Note != null),
                entry => Assert.Equal(text, entry.Note));

            using var scope = Factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var stored = await db.RepairJobs.AsNoTracking().SingleAsync(job => job.Id == reported.Id);
            Assert.Equal(text, stored.Description);
            Assert.Equal(text, stored.CompletionNote);
        }

        [Fact]
        public async Task Brief10_ApiAnswersWithJsonNotHtml()
        {
            var reported = await Session.Client.ReportAsync("<b>check gate</b>", "Alex Morgan");

            using var response = await Session.Client.GetAsync(RepairsApi.JobPath(reported.Id));

            Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        }
    }
}
