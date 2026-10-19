using Backend.Data;
using Backend.Repairs.Models;
using Backend.Tests.Contracts;
using Backend.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Tests.Repairs
{
    /// <summary>
    /// Brief test 9: jobs live in the database, so a refresh, a new session or a server restart sees the same data.
    /// </summary>
    public class PersistenceTests : IClassFixture<MeadowHouseFactory>
    {
        private readonly MeadowHouseFactory Factory;

        public PersistenceTests(MeadowHouseFactory factory)
        {
            Factory = factory;
        }

        [Fact]
        public async Task Brief09_JobsAreReadBackFromTheDatabase()
        {
            using var author = await Factory.SignInDemoUserAsync();
            var completed = await author.Client.ReportAndCompleteAsync("Garden fence damaged", "Temporary barrier fitted", "Fence repaired and checked");
            var open = await author.Client.ReportAsync("Kitchen light not working", "Sam Lee", RepairPriorities.Normal);

            using (var scope = Factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var storedCompleted = await db.RepairJobs.AsNoTracking().Include(job => job.History).SingleAsync(job => job.Id == completed.Id);
                Assert.Equal("Garden fence damaged", storedCompleted.Description);
                Assert.Equal(RepairStatus.Completed, storedCompleted.Status);
                Assert.Equal("Fence repaired and checked", storedCompleted.CompletionNote);
                Assert.Equal(4, storedCompleted.History.Count);
                Assert.Contains(storedCompleted.History, entry => entry.Type == RepairHistoryEntryType.ProgressNote && entry.Note == "Temporary barrier fitted");

                var storedOpen = await db.RepairJobs.AsNoTracking().Include(job => job.History).SingleAsync(job => job.Id == open.Id);
                Assert.Equal("Kitchen light not working", storedOpen.Description);
                Assert.Equal(RepairStatus.New, storedOpen.Status);
                Assert.Equal(RepairPriority.Normal, storedOpen.Priority);
                Assert.Single(storedOpen.History);
            }

            using var reader = await Factory.SignInDemoUserAsync();
            Assert.Equal(await author.Client.GetJobJsonAsync(completed.Id), await reader.Client.GetJobJsonAsync(completed.Id));
            Assert.Equal(await author.Client.GetJobJsonAsync(open.Id), await reader.Client.GetJobJsonAsync(open.Id));

            var reloadedCompleted = await reader.Client.GetJobAsync(completed.Id);
            Assert.Equal(completed.History, reloadedCompleted.History);
            Assert.Equal(completed.CompletionNote, reloadedCompleted.CompletionNote);
            Assert.Equal(completed.LatestNote, reloadedCompleted.LatestNote);
        }

        [Fact]
        public async Task Brief09_JobsSurviveAServerRestart()
        {
            var databasePath = MeadowHouseFactory.CreateDatabasePath();

            try
            {
                string completedJson;
                string openJson;
                int completedId;
                int openId;

                await using (var firstServer = MeadowHouseFactory.ForExistingDatabase(databasePath))
                {
                    using var session = await firstServer.SignInDemoUserAsync();
                    completedId = (await session.Client.ReportAndCompleteAsync("Garden fence damaged", "Temporary barrier fitted", "Fence repaired and checked")).Id;
                    openId = (await session.Client.ReportAsync("Kitchen light not working", "Sam Lee", RepairPriorities.Normal)).Id;

                    completedJson = await session.Client.GetJobJsonAsync(completedId);
                    openJson = await session.Client.GetJobJsonAsync(openId);
                }

                await using var restartedServer = MeadowHouseFactory.ForExistingDatabase(databasePath);
                using var newSession = await restartedServer.SignInDemoUserAsync();

                Assert.Equal(completedJson, await newSession.Client.GetJobJsonAsync(completedId));
                Assert.Equal(openJson, await newSession.Client.GetJobJsonAsync(openId));

                var listed = await newSession.Client.ListJobsAsync();
                Assert.Equal([openId, completedId], listed.Select(job => job.Id));
            }
            finally
            {
                MeadowHouseFactory.DeleteDatabase(databasePath);
            }
        }
    }
}
