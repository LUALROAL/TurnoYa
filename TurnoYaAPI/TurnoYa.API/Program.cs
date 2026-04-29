using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.SignalR;
using Serilog;
using System.Text.Json.Serialization;
using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using TurnoYa.Application.Interfaces;
using TurnoYa.Application.Services;
using TurnoYa.Application.Validators;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;
using TurnoYa.Infrastructure.Services;
using TurnoYa.Infrastructure.Repositories;
using TurnoYa.API.Hubs;
using TurnoYa.API.Services;

// Cargar variables de entorno desde .env local
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient();

// Serilog basic configuration
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// Add DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["cadenaConexionSQL"];
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// AutoMapper
builder.Services.AddAutoMapper(
    typeof(TurnoYa.Application.Mappings.AuthProfile),
    typeof(TurnoYa.Application.Mappings.BusinessProfile),
    typeof(TurnoYa.Application.Mappings.ServiceProfile),
    typeof(TurnoYa.Application.Mappings.EmployeeProfile),
    typeof(TurnoYa.Application.Mappings.AppointmentProfile)
);

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterUserDtoValidator>();

// ProblemDetails for standardized error responses
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
    };
});

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var problemDetails = new ValidationProblemDetails(context.ModelState)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Error de validacion",
            Type = "https://httpstatuses.com/400"
        };

        problemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

        return new BadRequestObjectResult(problemDetails);
    };
});

// Repositories
builder.Services.AddScoped<IBusinessRepository, BusinessRepository>();
builder.Services.AddScoped<IBusinessScheduleRepository, BusinessScheduleRepository>();
builder.Services.AddScoped<IEmployeeScheduleRepository, EmployeeScheduleRepository>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAppointmentRepository, AppointmentRepository>();
builder.Services.AddScoped<IUserDeviceTokenRepository, UserDeviceTokenRepository>();
builder.Services.AddScoped<IBusinessValidationRepository, BusinessValidationRepository>();

// Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddHttpClient<IWompiService, WompiService>();
builder.Services.AddScoped<IBusinessScheduleService, BusinessScheduleService>();
builder.Services.AddScoped<IEmployeeScheduleService, EmployeeScheduleService>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IEmployeePermissionRepository, EmployeePermissionRepository>();
builder.Services.AddScoped<IEmployeePermissionService, EmployeePermissionService>();

// Registro de IBusinessService
builder.Services.AddScoped<IBusinessService, BusinessService>();

// Business Validation Service
builder.Services.AddScoped<IBusinessValidationService, BusinessValidationService>();

// Push Notification Service
builder.Services.AddScoped<IFirebaseMessagingClient, FirebaseMessagingClient>();
builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();

// Telegram Service
builder.Services.AddScoped<ITelegramBotService, TelegramBotService>();
builder.Services.AddScoped<TelegramCallbackHandler>();

// SignalR for Real-Time Notifications
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
})
.AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Notifications Service (SignalR broadcasting)
builder.Services.AddSingleton<INotificationsService, NotificationsService>(); // SignalR broadcasting

// Authentication & JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
    };

    // PERMITIR JWT via query string para SignalR (WebSocket no soporta headers custom)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            // If the request is for the hub...
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && 
                path.StartsWithSegments("/hubs/notifications"))
            {
                // Read the token from query string
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configurar para evitar ciclos de referencia en serialización
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "TurnoYa API", Version = "v1" });
    // Include XML comments for better Swagger docs
    var xmlFile = System.Reflection.Assembly.GetExecutingAssembly().GetName().Name + ".xml";
    var xmlPath = System.IO.Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (System.IO.File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
    }
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "JWT Authorization header usando esquema Bearer. Ejemplo: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    };
    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            securityScheme,
            new string[] {}
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:8100",     // Angular dev server
                    "http://localhost:4200",     // Angular alternative
                    "http://127.0.0.1:8100",     // Alternative localhost
                    "capacitor://localhost"      // Capacitor mobile app
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
                .SetIsOriginAllowed(origin => true); // Allow any origin for SignalR WebSocket
        });

    // SignalR CORS policy (required for WebSocket connections from mobile)
    options.AddPolicy("SignalRCors", policy =>
    {
        policy.WithOrigins(
                "http://localhost:8100",
                "http://localhost:4200",
                "http://127.0.0.1:8100",
                "capacitor://localhost"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .SetIsOriginAllowed(origin => true);
    });
});


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler();

app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.UseCors("SignalRCors"); // CORS for SignalR WebSocket connections
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR Hub for real-time notifications
app.MapHub<NotificationsHub>("/hubs/notifications");

app.Run();
