using Backend.Helpers.Types;
using Microsoft.AspNetCore.Http.Extensions;
using System.Text.Encodings.Web;

namespace Backend.Helpers
{
    public class MetadataHelper
    {
        /// <summary>
        /// Gets the metadata for a given URL path
        /// </summary>
        public static async Task<SEOMetadata?> FindMetadata(string urlPath)
        {
            // TODO: Implement logic to map URL paths to SEO metadata
            return null;
        }

        /// <summary>
        /// Determines if a URL is canonical, which basically means if it's the main version of a page and not an alias/duplicate.
        /// </summary>
        public static async Task<bool> IsCanonical(string url)
        {
            return url == await MapCanonicalURL(url);
        }

        /// <summary>
        /// Gets the canonical URL from the request URL path
        /// </summary>
        public static async Task<string> MapCanonicalURL(string url)
        {
            // Normalize trailing slash
            if (!url.EndsWith("/")) url += "/";

            // Both ASP.NET and react-router use case insensitive routing
            url = url.ToLowerInvariant();

            return url;
        }

        /// <summary>
        /// Generates raw HTML metadata tags for the request.
        /// </summary>
        public static async Task<string> GenerateMetadataTags(HttpContext ctx)
        {
            var tagString = "\n";

            var requestPath = ctx.Request.Path.Value;
            if (string.IsNullOrEmpty(requestPath)) requestPath = "/";

            var metadata = await FindMetadata(requestPath!);

            var tryMapMetaTag = (string property, string? value) =>
            {
                if (!string.IsNullOrEmpty(value))
                    tagString += $"<meta property=\"{HtmlEncoder.Default.Encode(property)}\" content=\"{HtmlEncoder.Default.Encode(value)}\" />\n";
            };

            tryMapMetaTag("og:title", metadata?.Title);
            tryMapMetaTag("og:description", metadata?.Description);
            tryMapMetaTag("og:type", metadata?.PageType);
            tryMapMetaTag("og:image", metadata?.ImageURL);

            // Canonical URL, important for SEO
            var canonicalURL = await MapCanonicalURL(ctx.Request.GetEncodedUrl());
            if (!string.IsNullOrEmpty(canonicalURL))
            {
                tagString += $"<link rel=\"canonical\" href=\"{HtmlEncoder.Default.Encode(canonicalURL)}\" />\n";
                tagString += $"<meta property=\"og:url\" content=\"{HtmlEncoder.Default.Encode(canonicalURL)}\" />\n";
            }

            return tagString;
        }
    }
}
