using Backend.Tests.Contracts;
using Backend.Tests.Infrastructure;

namespace Backend.Tests.Repairs
{
    /// <summary>
    /// Brief test 5: changing one job never changes another.
    /// </summary>
    public class IndependentJobsTests : IClassFixture<MeadowHouseFactory>
    {
        private readonly MeadowHouseFactory Factory;

        public IndependentJobsTests(MeadowHouseFactory factory)
        {
            Factory = factory;
        }

        [Fact]
        public async Task Brief05_ChangingFenceLeavesKitchenLightUntouched()
        {
            using var session = await Factory.SignInDemoUserAsync();
            var fence = await session.Client.ReportAsync("Garden fence damaged", "Alex Morgan", RepairPriorities.Urgent);
            var kitchen = await session.Client.ReportAsync("Kitchen light not working", "Sam Lee", RepairPriorities.Normal);
            var kitchenJson = await session.Client.GetJobJsonAsync(kitchen.Id);

            Assert.NotEqual(fence.Id, kitchen.Id);
            Assert.NotEqual(fence.Reference, kitchen.Reference);

            await session.Client.StartWorkAsync(fence.Id);
            await session.Client.AddNoteAsync(fence.Id, "Temporary barrier fitted");
            using (var rejected = await session.Client.PostCompleteAsync(fence.Id, "   "))
            {
                await rejected.ExpectValidationErrorAsync("CompletionNote", ExpectedMessageKeys.RepairCompletionNoteRequired);
            }
            var changedFence = await session.Client.CompleteAsync(fence.Id, "Fence repaired and checked");

            Assert.Equal(RepairStatuses.Completed, changedFence.Status);
            Assert.Equal(4, changedFence.History.Count);

            Assert.Equal(kitchenJson, await session.Client.GetJobJsonAsync(kitchen.Id));

            var listedKitchen = (await session.Client.ListJobsAsync()).Single(job => job.Id == kitchen.Id);
            Assert.Equal("Kitchen light not working", listedKitchen.Description);
            Assert.Equal("Sam Lee", listedKitchen.ReporterName);
            Assert.Equal(RepairPriorities.Normal, listedKitchen.Priority);
            Assert.Equal(RepairStatuses.New, listedKitchen.Status);
            Assert.Null(listedKitchen.LatestNote);
            Assert.Null(listedKitchen.CompletionNote);
            Assert.Equal(1, listedKitchen.Version);
            Assert.Equal(kitchen.History, listedKitchen.History);
        }

        [Fact]
        public async Task JobsAreListedNewestFirst()
        {
            using var session = await Factory.SignInDemoUserAsync();
            var older = await session.Client.ReportAsync("Garden fence damaged", "Alex Morgan");
            var newer = await session.Client.ReportAsync("Kitchen light not working", "Sam Lee");

            var ids = (await session.Client.ListJobsAsync()).Select(job => job.Id).ToList();

            Assert.True(ids.IndexOf(newer.Id) < ids.IndexOf(older.Id));
        }
    }
}
