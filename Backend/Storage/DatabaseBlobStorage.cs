using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Storage
{
    /// <summary>
    /// Stores blobs in the database via Entity Framework.
    /// Blobs are kept in a separate table so user queries stay fast.
    /// </summary>
    public class DatabaseBlobStorage : IBlobStorage
    {
        private readonly ApplicationDbContext Db;

        public DatabaseBlobStorage(ApplicationDbContext db)
        {
            Db = db;
        }

        public async Task SaveAsync(string key, byte[] data, string contentType)
        {
            var existing = await Db.StoredBlobs.FindAsync(key);
            if (existing != null)
            {
                existing.Data = data;
                existing.ContentType = contentType;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                Db.StoredBlobs.Add(new StoredBlob
                {
                    Key = key,
                    Data = data,
                    ContentType = contentType,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            await Db.SaveChangesAsync();
        }

        public async Task<BlobResult?> GetAsync(string key)
        {
            var blob = await Db.StoredBlobs.AsNoTracking().FirstOrDefaultAsync(b => b.Key == key);
            if (blob == null) return null;
            return new BlobResult { Data = blob.Data, ContentType = blob.ContentType };
        }

        public async Task DeleteAsync(string key)
        {
            var blob = await Db.StoredBlobs.FindAsync(key);
            if (blob != null)
            {
                Db.StoredBlobs.Remove(blob);
                await Db.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(string key)
        {
            return await Db.StoredBlobs.AnyAsync(b => b.Key == key);
        }
    }
}
