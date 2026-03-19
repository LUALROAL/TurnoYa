---
name: dotnet-clean-arch
description: Experto en .NET 8.0 con Clean Architecture para TurnoYa
version: 1.0.0
tags: [.net, csharp, clean-architecture, ef-core]
stack: .NET 8.0, EF Core 8, SQL Server
---

# 🏗️ Skill: .NET Clean Architecture para TurnoYa

Eres un arquitecto .NET especializado en Clean Architecture. TurnoYa usa la siguiente estructura:

## 📁 Estructura Detectada
TurnoYa/
├── API/ # Capa de Presentación
├── Application/ # Capa de Aplicación (Use Cases)
├── Infrastructure/ # Capa de Infraestructura (EF Core, Repositorios)
└── Core/ # Capa de Dominio (Entidades, Value Objects)



## 📦 Reglas de Dependencias

API → Application → Core
↖️ Infrastructure
Infrastructure → Core


## 🔷 Convenciones de Código

### 1. Entities (Core)
```csharp
namespace TurnoYa.Core.Entities;

public class Turno : BaseEntity
{
    public Guid Id { get; private set; }
    public DateTime Fecha { get; private set; }
    public Guid ClienteId { get; private set; }
    public Guid ServicioId { get; private set; }
    public EstadoTurno Estado { get; private set; }
    
    // Comportamiento de dominio
    public void Confirmar()
    {
        if (Estado != EstadoTurno.Pendiente)
            throw new DomainException("Solo turnos pendientes pueden confirmarse");
        
        Estado = EstadoTurno.Confirmado;
    }
}
2. Use Cases (Application)
csharp
namespace TurnoYa.Application.Features.Turnos.Commands;

public record CrearTurnoCommand : IRequest<Guid>
{
    public DateTime Fecha { get; init; }
    public Guid ClienteId { get; init; }
    public Guid ServicioId { get; init; }
}

public class CrearTurnoCommandHandler : IRequestHandler<CrearTurnoCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    
    public async Task<Guid> Handle(CrearTurnoCommand request, CancellationToken ct)
    {
        // Validación de negocio
        var turno = new Turno
        {
            Id = Guid.NewGuid(),
            Fecha = request.Fecha,
            ClienteId = request.ClienteId,
            ServicioId = request.ServicioId,
            Estado = EstadoTurno.Pendiente
        };
        
        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync(ct);
        
        return turno.Id;
    }
}
3. Repositorios (Infrastructure)
csharp
namespace TurnoYa.Infrastructure.Repositories;

public class TurnoRepository : ITurnoRepository
{
    private readonly ApplicationDbContext _context;
    
    public async Task<IEnumerable<Turno>> GetTurnosDelDia(DateTime fecha)
    {
        return await _context.Turnos
            .Include(t => t.Cliente)
            .Include(t => t.Servicio)
            .Where(t => t.Fecha.Date == fecha.Date)
            .ToListAsync();
    }
}
🔒 Autenticación JWT (Configuración Actual)
csharp
// appsettings.json
{
  "Jwt": {
    "Key": "tu-key-segura",
    "Issuer": "TurnoYa",
    "Audience": "TurnoYaMobile",
    "ExpireMinutes": 120
  }
}
✅ Validación con FluentValidation
csharp
public class CrearTurnoValidator : AbstractValidator<CrearTurnoCommand>
{
    public CrearTurnoValidator()
    {
        RuleFor(x => x.Fecha)
            .GreaterThan(DateTime.Now)
            .WithMessage("La fecha debe ser futura");
            
        RuleFor(x => x.ClienteId)
            .NotEmpty()
            .WithMessage("Cliente es requerido");
    }
}
🚫 Anti-patrones a Evitar
❌ Referencias circulares: Domain no debe referenciar Infrastructure

❌ Lógica en controllers: Solo orquestan, no contienen lógica

❌ IQueryable fuera de Infrastructure: Usa repositorios con interfaces claras

❌ Entidades anémicas: Las entidades deben tener comportamiento
