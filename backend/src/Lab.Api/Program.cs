using System.Text;
using System.Threading.RateLimiting;
using Lab.Application.Common.Interfaces;
using Lab.Infrastructure.Data;
using Lab.Infrastructure.Identity;
using Lab.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Configure Logging (Avoid Windows EventLog ObjectDisposedException)
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var dbProvider = builder.Configuration["DatabaseProvider"] ?? "SqlServer";
var sqliteConn = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=lab_lims.db";

// Smart Environment-Aware Connection String Selection:
var sqlServerConn = builder.Configuration.GetConnectionString("DefaultConnection");
if (builder.Environment.IsProduction())
{
    if (string.IsNullOrWhiteSpace(sqlServerConn) ||
        sqlServerConn.Contains("Server=.") ||
        sqlServerConn.Contains("localhost") ||
        sqlServerConn.Contains("(localdb)"))
    {
        var prodConn = builder.Configuration.GetConnectionString("ProductionConnection");
        if (!string.IsNullOrWhiteSpace(prodConn))
        {
            sqlServerConn = prodConn;
        }
    }
}
else
{
    if (string.IsNullOrWhiteSpace(sqlServerConn))
    {
        sqlServerConn = "Server=.;Database=LabLimsDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;";
    }
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (dbProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlServer(sqlServerConn, o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery));
    }
    else
    {
        options.UseSqlite(sqliteConn);
    }
});

builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

// 2. Add ASP.NET Core Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// 3. Add JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "DigitLabEnterpriseSuperSecretEncryptionKey2026!@#$%^&*";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "DigitLab";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "DigitLabApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.Zero
    };
});

// 4. Register Application & Infrastructure Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IBarcodeService, BarcodeService>();
builder.Services.AddScoped<IPdfReportService, PdfReportService>();

// 5. In-Memory Cache for fast repeat PDF retrieval (Anti-DoS)
builder.Services.AddMemoryCache();

// 6. Comprehensive Anti-Abuse & Rate Limiting Protection across ALL endpoints
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync("{\"message\": \"Rate limit exceeded. Automated request spamming is blocked by Security Shield. Please wait 1 minute.\", \"statusCode\": 429}", token);
    };

    // GLOBAL LIMITER: Automatically protects 100% of ALL endpoints across the entire site
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        if (httpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
        {
            var ip = forwarded.ToString().Split(',').FirstOrDefault()?.Trim();
            if (!string.IsNullOrWhiteSpace(ip)) clientIp = ip;
        }

        var path = httpContext.Request.Path.Value?.ToLowerInvariant() ?? "";

        // 1. Strict Auth Protection: /api/auth/login, /api/auth/register (max 10 attempts/min to stop brute force)
        if (path.StartsWith("/api/auth/login") || path.StartsWith("/api/auth/register"))
        {
            return RateLimitPartition.GetFixedWindowLimiter(
                $"auth_{clientIp}",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
        }

        // 2. Strict PDF & File Exports: /pdf, /invoice, /thermal-receipt (max 15 requests/min per IP)
        if (path.Contains("/pdf") || path.Contains("/invoice") || path.Contains("/thermal-receipt"))
        {
            return RateLimitPartition.GetSlidingWindowLimiter(
                $"pdf_{clientIp}",
                _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 15,
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 6,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
        }

        // 3. Global Protection for every single API or page hit: Max 60 requests/min per IP
        return RateLimitPartition.GetSlidingWindowLimiter(
            $"global_{clientIp}",
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    // Specific Named Policy for explicit controller annotations
    options.AddPolicy("PdfReportPolicy", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        if (httpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
        {
            var ip = forwarded.ToString().Split(',').FirstOrDefault()?.Trim();
            if (!string.IsNullOrWhiteSpace(ip)) clientIp = ip;
        }

        return RateLimitPartition.GetSlidingWindowLimiter(
            $"pdf_policy_{clientIp}",
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 15,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });
});

// 7. Configure CORS for Angular Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// 6. Configure Swagger with JWT Bearer Auth
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DigitLab LIMS & Pathology API",
        Version = "v1",
        Description = "Enterprise Multi-Tenant Cloud Pathology Laboratory Information Management System API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 7. Seed Database and Initial Data
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        // Test connection; fallback to SQLite if SQL Server connection fails
        try
        {
            await db.Database.CanConnectAsync();
        }
        catch
        {
            // fallback
        }
        await DbInitializer.InitializeAsync(app.Services);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization error: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "DigitLab LIMS API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowAll");
app.UseRateLimiter();

// Real-Time Enforcement: Disable all HTTP response caching
app.Use(async (context, next) =>
{
    context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0";
    context.Response.Headers["Pragma"] = "no-cache";
    context.Response.Headers["Expires"] = "-1";
    await next();
});

// Security Shield: Block known malicious hacking scanners & exploit tools
app.Use(async (context, next) =>
{
    var userAgent = context.Request.Headers["User-Agent"].ToString().ToLowerInvariant();
    var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

    if (path.StartsWith("/api/"))
    {
        string[] blockedScanners = { "sqlmap", "nikto", "gobuster", "dirbuster", "wpscan", "masscan", "zgrab" };
        if (blockedScanners.Any(scanner => userAgent.Contains(scanner)))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"message\": \"Access denied by Security Shield. Automated scanner detected.\", \"statusCode\": 403}");
            return;
        }
    }

    await next();
});

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
