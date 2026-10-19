namespace Backend.Helpers
{
    public static class GeoResolutionHelper
    {
        private static readonly string[] CountryHeaders =
        [
            "CF-IPCountry",
            "CloudFront-Viewer-Country",
            "X-Vercel-IP-Country",
            "X-Country-Code",
            "X-Geo-Country",
        ];

        public static string? ResolveCountry(HttpContext context)
        {
            foreach (var header in CountryHeaders)
            {
                var value = context.Request.Headers[header].FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(value) && value.Length == 2)
                {
                    return value.ToUpperInvariant();
                }
            }

            return null;
        }

        public static string? ResolveBrowser(HttpContext context)
        {
            var ua = context.Request.Headers.UserAgent.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(ua)) return null;

            if (ua.Contains("EdgiOS", StringComparison.OrdinalIgnoreCase)) return "Edge";
            if (ua.Contains("Edg/", StringComparison.OrdinalIgnoreCase)) return "Edge";
            if (ua.Contains("OPR/", StringComparison.OrdinalIgnoreCase) || ua.Contains("Opera", StringComparison.OrdinalIgnoreCase)) return "Opera";
            if (ua.Contains("FxiOS", StringComparison.OrdinalIgnoreCase)) return "Firefox";
            if (ua.Contains("CriOS", StringComparison.OrdinalIgnoreCase)) return "Chrome";
            if (ua.Contains("Chrome/", StringComparison.OrdinalIgnoreCase) && !ua.Contains("Edg/", StringComparison.OrdinalIgnoreCase)) return "Chrome";
            if (ua.Contains("Firefox/", StringComparison.OrdinalIgnoreCase)) return "Firefox";
            if (ua.Contains("Safari/", StringComparison.OrdinalIgnoreCase)
                && !ua.Contains("Chrome/", StringComparison.OrdinalIgnoreCase)
                && !ua.Contains("CriOS", StringComparison.OrdinalIgnoreCase)
                && !ua.Contains("FxiOS", StringComparison.OrdinalIgnoreCase)
                && !ua.Contains("EdgiOS", StringComparison.OrdinalIgnoreCase)
                && !ua.Contains("OPR/", StringComparison.OrdinalIgnoreCase)) return "Safari";

            return null;
        }

        public static string? ResolveOperatingSystem(HttpContext context)
        {
            var ua = context.Request.Headers.UserAgent.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(ua)) return null;

            if (ua.Contains("Windows", StringComparison.OrdinalIgnoreCase)) return "Windows";
            if (ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase)
                || ua.Contains("iPad", StringComparison.OrdinalIgnoreCase)
                || ua.Contains("iPod", StringComparison.OrdinalIgnoreCase)) return "iOS";
            if (ua.Contains("Android", StringComparison.OrdinalIgnoreCase)) return "Android";
            if (ua.Contains("CrOS", StringComparison.OrdinalIgnoreCase)) return "ChromeOS";
            if (ua.Contains("Macintosh", StringComparison.OrdinalIgnoreCase) || ua.Contains("Mac OS", StringComparison.OrdinalIgnoreCase)) return "macOS";
            if (ua.Contains("Linux", StringComparison.OrdinalIgnoreCase) && !ua.Contains("Android", StringComparison.OrdinalIgnoreCase)) return "Linux";

            return null;
        }
    }
}
