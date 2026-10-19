namespace Backend.Storage
{
    /// <summary>
    /// Abstraction for storing and retrieving binary assets (profile pictures, uploads, etc.).
    /// Implement this interface to switch between database, disk, or S3 storage backends.
    /// </summary>
    public interface IBlobStorage
    {
        /// <summary>
        /// Store a blob with the given key and content type.
        /// If a blob with the same key exists, it will be overwritten.
        /// </summary>
        /// <param name="key">Unique key for the blob (e.g., "pfp/{userId}")</param>
        /// <param name="data">Binary content of the blob</param>
        /// <param name="contentType">MIME type (e.g., "image/png")</param>
        Task SaveAsync(string key, byte[] data, string contentType);

        /// <summary>
        /// Retrieve a blob by key. Returns null if not found.
        /// </summary>
        /// <param name="key">Unique key for the blob</param>
        /// <returns>The blob result containing data and content type, or null</returns>
        Task<BlobResult?> GetAsync(string key);

        /// <summary>
        /// Delete a blob by key. No-op if the blob does not exist.
        /// </summary>
        /// <param name="key">Unique key for the blob</param>
        Task DeleteAsync(string key);

        /// <summary>
        /// Check if a blob exists by key.
        /// </summary>
        /// <param name="key">Unique key for the blob</param>
        Task<bool> ExistsAsync(string key);
    }

    /// <summary>
    /// Result of retrieving a blob from storage.
    /// </summary>
    public class BlobResult
    {
        /// <summary>Binary content of the blob</summary>
        public required byte[] Data { get; set; }
        /// <summary>MIME type of the blob (e.g., "image/png")</summary>
        public required string ContentType { get; set; }
    }
}
