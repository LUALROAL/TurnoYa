
---

## 📚 **SKILL 5: `turnoya-clean-arch.md` - Guía de Clean Architecture**

```markdown
# Guía de Clean Architecture para TurnoYa

## Descripción
Referencia rápida de cómo implementar features respetando la arquitectura detectada.

## Uso
/turnoya-clean-arch

## Estructura de Capas

### 1. Core (Dominio)
```csharp
// Entidades
public class Turno
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public int ClienteId { get; set; }
    public int ProfesionalId { get; set; }
    public EstadoTurno Estado { get; set; }
}

// Interfaces de repositorio
public interface ITurnoRepository
{
    Task<Turno> GetByIdAsync(int id);
    Task<IEnumerable<Turno>> GetByClienteAsync(int clienteId);
    Task AddAsync(Turno turno);
    Task UpdateAsync(Turno turno);
}
2. Application (Casos de Uso)
csharp
// Commands/Queries
public class CreateTurnoCommand : IRequest<int>
{
    public DateTime Fecha { get; set; }
    public int ClienteId { get; set; }
    public int ProfesionalId { get; set; }
}

// Handlers
public class CreateTurnoCommandHandler : IRequestHandler<CreateTurnoCommand, int>
{
    private readonly ITurnoRepository _repository;
    
    public async Task<int> Handle(CreateTurnoCommand request, CancellationToken ct)
    {
        var turno = new Turno { ... };
        await _repository.AddAsync(turno);
        return turno.Id;
    }
}
3. Infrastructure
csharp
// Implementación de repositorios
public class TurnoRepository : ITurnoRepository
{
    private readonly AppDbContext _context;
    
    public async Task<Turno> GetByIdAsync(int id)
        => await _context.Turnos.FindAsync(id);
}
4. API
csharp
[ApiController]
[Route("api/[controller]")]
public class TurnosController : ControllerBase
{
    private readonly IMediator _mediator;
    
    [HttpPost]
    public async Task<ActionResult<int>> Create(CreateTurnoCommand command)
    {
        return await _mediator.Send(command);
    }
}
Frontend (Ionic/Angular)
typescript
// Models
export interface Turno {
  id: number;
  fecha: Date;
  clienteId: number;
  profesionalId: number;
  estado: 'pendiente' | 'confirmado' | 'cancelado';
}

// Services
@Injectable()
export class TurnoService {
  constructor(private http: HttpClient) {}
  
  create(turno: Partial<Turno>): Observable<number> {
    return this.http.post<number>('/api/turnos', turno);
  }
}

// Pages
@Component()
export class TurnosPage {
  turnos: Turno[] = [];
  
  constructor(private turnoService: TurnoService) {}
  
  ionViewWillEnter() {
    this.loadTurnos();
  }
}