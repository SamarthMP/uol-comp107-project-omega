namespace Backend.Helpers
{
    public static class ProfilePictureUrls
    {
        /// <summary>
        /// Resolves the public URL for a stored profile picture value.
        /// Returns null if no picture is set.
        /// </summary>
        public static string? Resolve(string? profilePicture)
        {
            if (profilePicture == null) return null;

            if (profilePicture.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                profilePicture.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return profilePicture;

            if (profilePicture.StartsWith("blob:"))
                return $"/api/auth/pfp/{Uri.EscapeDataString(profilePicture)}";

            return null;
        }
    }
}
