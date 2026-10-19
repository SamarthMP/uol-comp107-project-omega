namespace Backend.Tests.Infrastructure
{
    /// <summary>
    /// Records messages pushed by the server and lets a test wait until one matching a condition arrives.
    /// </summary>
    public sealed class MessageLog<T>
    {
        public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(10);

        private readonly object Gate = new();
        private readonly List<T> Received = [];
        private readonly List<Waiter> Waiters = [];

        private sealed record Waiter(Func<T, bool> Predicate, int Skip, TaskCompletionSource<T> Completion);

        public int Count
        {
            get
            {
                lock (Gate)
                {
                    return Received.Count;
                }
            }
        }

        public void Add(T message)
        {
            lock (Gate)
            {
                Received.Add(message);
                var index = Received.Count - 1;

                Waiters.RemoveAll(waiter =>
                {
                    if (index < waiter.Skip || !waiter.Predicate(message))
                        return false;

                    waiter.Completion.TrySetResult(message);
                    return true;
                });
            }
        }

        /// <summary>
        /// Returns the first message matching <paramref name="predicate"/>, ignoring the first <paramref name="skip"/> messages.
        /// Capture <see cref="Count"/> before an action and pass it as <paramref name="skip"/> to only consider what the action caused.
        /// </summary>
        public async Task<T> WaitForAsync(string description, Func<T, bool> predicate, int skip = 0)
        {
            TaskCompletionSource<T> completion;

            lock (Gate)
            {
                var existing = Received.Skip(skip).Where(predicate).Take(1).ToList();
                if (existing.Count > 0)
                    return existing[0];

                completion = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
                Waiters.Add(new Waiter(predicate, skip, completion));
            }

            try
            {
                return await completion.Task.WaitAsync(DefaultTimeout);
            }
            catch (TimeoutException)
            {
                throw new TimeoutException($"Timed out after {DefaultTimeout.TotalSeconds}s waiting for {description}. {Count} message(s) were received.");
            }
        }
    }
}
