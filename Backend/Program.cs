using Backend.Auth;
using Backend.Auth.Dto;
using Backend.Auth.Providers;
using Backend.Data;
using Backend.Email;
using Backend.Helpers;
using Backend.Storage;
using Fido2NetLib;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenIddict.Validation.AspNetCore;
using Polly;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.RateLimiting;

// TODO: (IMPORTANT) Configure these properly for production
AuthConfig.PrimaryHost = "https://samsidparty.com";
AuthConfig.AppName = "SamsidParty";
AuthConfig.AuthProviders.Add(new GithubAuthProvider());

Keys.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.SetIsOriginAllowed(origin => new Uri(origin).IsLoopback)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var response = BackendValidationMessages.CreateValidationErrorResponse(context.ModelState);
            return new BadRequestObjectResult(response);
        };
    });
builder.Services.AddOpenApi();

builder.Services.AddDistributedMemoryCache();

#region Rate Limiting and proxy config

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("auth", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var username = "_";
        if (context.Request.HasFormContentType)
            username = context.Request.Form["username"].FirstOrDefault() ?? "_";
        var partitionKey = $"{ip}:{username}";

        return RateLimitPartition.GetSlidingWindowLimiter(partitionKey, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 15,
            Window = TimeSpan.FromMinutes(5),
            SegmentsPerWindow = 5,
            QueueLimit = 0,
        });
    });

    options.AddPolicy("signup", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(10),
            SegmentsPerWindow = 5,
            QueueLimit = 0,
        });
    });
});

// Trust forwarded headers from reverse proxies (Cloudflare, nginx, etc.)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

#endregion

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.UseOpenIddict();
});

builder.Services.AddScoped<IBlobStorage, DatabaseBlobStorage>();

var smtpConfig = SmtpConfig.FromEnvironment();
builder.Services.AddSingleton(smtpConfig);
builder.Services.AddSingleton<IEmailService, SmtpEmailService>();

#region Auth

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddOpenIddict()
    .AddCore(options =>
    {
        options.UseEntityFrameworkCore()
               .UseDbContext<ApplicationDbContext>();
    })
    .AddServer(options =>
    {
        options.SetTokenEndpointUris("/api/auth/token");

        options.AllowPasswordFlow();
        options.AllowRefreshTokenFlow();
        options.AllowCustomFlow("urn:custom:passkey");
        options.AllowCustomFlow("urn:custom:2fa");
        options.AllowCustomFlow("urn:custom:external");
        options.AllowCustomFlow("urn:custom:sudo");

        options.AcceptAnonymousClients();

        options.UseAspNetCore()
            .EnableTokenEndpointPassthrough()
            .DisableTransportSecurityRequirement();

        options.AddEphemeralSigningKey(); // OpenIddict requires at least one asymmetric signing key, but we won't use it since we provide our own symmettric keys.

        options.AddSigningKey(Keys.GetSigningKey());
        options.AddEncryptionKey(Keys.GetEncryptionKey());

        options.DisableAccessTokenEncryption();

        options.SetAccessTokenLifetime(TimeSpan.FromHours(12));
        options.SetRefreshTokenLifetime(TimeSpan.FromDays(90));
    })
    .AddValidation(options =>
    {
        options.UseLocalServer();
        options.UseAspNetCore();
    });

builder.Services.Configure<Microsoft.AspNetCore.Authentication.AuthenticationOptions>(options =>
{
    options.DefaultAuthenticateScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
});

// FIDO2 / WebAuthn for passkeys
builder.Services.AddFido2(options =>
{
    options.ServerName = AuthConfig.AppName;

    #if DEBUG
    options.ServerDomain = "localhost";
    options.Origins = new HashSet<string> { "http://localhost:5092", "http://localhost:6768" };
    #else
    var primaryHostUri = new Uri(AuthConfig.PrimaryHost);
    options.ServerDomain = primaryHostUri.Host;
    options.Origins = new HashSet<string> { $"http://{primaryHostUri.Host}", $"https://{primaryHostUri.Host}" };
    #endif
});

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = true;

    options.Lockout.MaxFailedAccessAttempts = 10;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.AllowedForNewUsers = true;
});

#region External OAuth providers

foreach (var provider in AuthConfig.AuthProviders)
{
    if (provider.IsEnabled())
    {
        provider.Configure(builder.Services.AddAuthentication());
        AuthProviderBase.RegisteredProviders.Add(provider);
    }
}

#endregion

#endregion

var app = builder.Build();


// Apply pending migrations automatically
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
    await InitialSuperAdminSeeder.EnsureSuperAdminAsync(
        scope.ServiceProvider,
        AuthConfig.PrimaryHost,
        app.Lifetime.ApplicationStopping);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
    await next();
});

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors();

app.UseForwardedHeaders();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.UseHttpsRedirection();
app.MapControllers();

#region SEO and Fallback Routing

// Loads the index.html file into memory so it doesn't read from disk every request
var env = app.Services.GetRequiredService<IWebHostEnvironment>();
var indexFilePath = Path.Combine(env.WebRootPath, "index.html");
var indexFile = await File.ReadAllTextAsync(indexFilePath);

// Sends the index.html file for any unmatched endpoint for client side routing
app.MapFallback(async context =>
{
    var injectedMetadata = await MetadataHelper.GenerateMetadataTags(context);

    var fileToServe = indexFile.Replace("<!-- INJECT_PLACEHOLDER -->", injectedMetadata);

    context.Response.ContentType = "text/html";
    await context.Response.WriteAsync(fileToServe);
});

#endregion

app.Start();

var urls = app.Urls;
if (urls.Count > 0 && !string.IsNullOrEmpty(urls.First()))
{
    // Start vite in debug mode
    #if DEBUG
    Task.Run(() => DebugFrontendHelper.Start(urls.First()));
    #endif
}

app.WaitForShutdown();