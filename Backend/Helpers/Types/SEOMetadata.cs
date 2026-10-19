namespace Backend.Helpers.Types
{
    /// <summary>
    /// Represents metadata used for SEO and social media sharing (opengraph).
    /// </summary>
    public class SEOMetadata
    {
        public string Title { get; set; } = ""; // og:title
        public string PageType { get; set; } = "website"; // og:type
        public string? Description { get; set; } = ""; // og:description
        public string? ImageURL { get; set; } = ""; // og:image
    }
}
