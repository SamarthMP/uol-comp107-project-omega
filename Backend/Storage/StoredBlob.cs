using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Backend.Storage
{
    /// <summary>
    /// Entity for storing binary blobs in the database.
    /// Kept in a separate table to avoid bloating user queries.
    /// </summary>
    public class StoredBlob
    {
        [Key]
        public string Key { get; set; } = string.Empty;

        public byte[] Data { get; set; } = [];

        public string ContentType { get; set; } = string.Empty;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
