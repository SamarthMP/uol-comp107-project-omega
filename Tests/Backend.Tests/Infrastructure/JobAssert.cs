using Backend.Tests.Contracts;

namespace Backend.Tests.Infrastructure
{
    public static class JobAssert
    {
        private static readonly IReadOnlyList<RepairHistoryEntryDto> NoHistory = [];

        /// <summary>
        /// Deep comparison of two jobs. Record equality compares lists by reference, so history is compared separately.
        /// </summary>
        public static void Same(RepairJobDto expected, RepairJobDto actual)
        {
            Assert.Equal(expected with { History = NoHistory }, actual with { History = NoHistory });
            Assert.Equal(expected.History, actual.History);
        }
    }
}
