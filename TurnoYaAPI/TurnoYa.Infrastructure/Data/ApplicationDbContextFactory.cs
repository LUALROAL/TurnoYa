using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Data;

/// <summary>
/// Factory para crear ApplicationDbContext en tiempo de diseño (migraciones)
/// </summary>
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        
        // Usar la misma cadena de conexión que en appsettings.json
        var connectionString = "Server=(local);Database=TurnoyaDB;Trusted_Connection=True;TrustServerCertificate=True;";
        
        optionsBuilder.UseSqlServer(connectionString);
        
        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
