using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<HealthController> _logger;

    public HealthController(ApplicationDbContext context, ILogger<HealthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Health check endpoint - Verifica el estado de la API y la conexión a la base de datos
    /// </summary>
    /// <returns>Estado del servicio</returns>
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            // Verificar conexión a base de datos
            await _context.Database.ExecuteSqlRawAsync("SELECT 1");
            
            _logger.LogInformation("Health check exitoso");
            
            return Ok(new
            {
                status = "OK",
                database = "Connected",
                timestamp = DateTime.UtcNow,
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en health check");
            
            return StatusCode(500, new
            {
                status = "Unhealthy",
                database = "Disconnected",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}
