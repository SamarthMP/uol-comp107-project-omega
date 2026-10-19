// Program.cs appends to process-wide static lists (AuthConfig.AuthProviders) every time a host starts,
// so the in-memory test servers must be started one at a time.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
