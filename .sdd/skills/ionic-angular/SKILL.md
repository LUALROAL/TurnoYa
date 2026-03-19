### **Paso 4: Skill para Ionic/Angular**

Edita `.sdd/skills/ionic-angular/SKILL.md`:

```markdown
---
name: ionic-angular
description: Experto en Ionic 8 + Angular 20 para TurnoYa
version: 1.0.0
tags: [ionic, angular, typescript, tailwindcss]
stack: Ionic 8.0, Angular 20, TypeScript 5.9, TailwindCSS
---

# 📱 Skill: Ionic + Angular para TurnoYa Mobile

Eres un desarrollador mobile experto en Ionic/Angular. TurnoYa usa:

## 📁 Estructura del Proyecto
src/
├── app/
│ ├── core/ # Servicios singleton, guards, interceptors
│ │ ├── services/
│ │ ├── guards/
│ │ └── interceptors/
│ ├── features/ # Módulos por funcionalidad
│ │ ├── auth/
│ │ ├── turnos/
│ │ └── perfil/
│ ├── shared/ # Componentes reusables
│ │ ├── components/
│ │ └── pipes/
│ └── pages/ # Páginas principales
├── assets/
└── theme/ # Variables de Tailwind

## 🎨 Estilos con TailwindCSS

```html
<!-- Usa clases de Tailwind -->
<ion-content class="p-4">
  <div class="flex flex-col space-y-4">
    <h1 class="text-2xl font-bold text-primary-600">
      Mis Turnos
    </h1>
    
    <ion-card class="shadow-lg rounded-xl">
      <ion-card-content>
        <p class="text-gray-600">Próximo turno: Hoy 15:30</p>
      </ion-card-content>
    </ion-card>
  </div>
</ion-content>
🔷 Patrones Angular Esenciales
1. Servicios con Inyección
typescript
@Injectable({ providedIn: 'root' })
export class TurnoService {
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}
  
  getTurnosDelDia(): Observable<Turno[]> {
    const headers = this.auth.getAuthHeaders();
    return this.http.get<Turno[]>(`${this.apiUrl}/turnos/hoy`, { headers });
  }
}
2. Componentes con Signals (Angular 20)
typescript
@Component({
  selector: 'app-lista-turnos',
  template: `
    <ion-list>
      @for (turno of turnos(); track turno.id) {
        <ion-item>
          <ion-label>
            <h2>{{ turno.cliente }}</h2>
            <p>{{ turno.fecha | date:'short' }}</p>
          </ion-label>
          <ion-badge [color]="turno.estado | estadoColor">
            {{ turno.estado }}
          </ion-badge>
        </ion-item>
      }
    </ion-list>
  `
})
export class ListaTurnosComponent {
  turnos = signal<Turno[]>([]);
  
  constructor(private turnoService: TurnoService) {
    this.cargarTurnos();
  }
  
  async cargarTurnos() {
    const turnos = await firstValueFrom(this.turnoService.getTurnosDelDia());
    this.turnos.set(turnos);
  }
}
3. Guards para Rutas
typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}
  
  canActivate(): boolean {
    if (this.auth.isAuthenticated()) {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}
🧪 Testing con Karma + Jasmine
typescript
describe('TurnoService', () => {
  let service: TurnoService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TurnoService]
    });
    
    service = TestBed.inject(TurnoService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('debe obtener turnos del día', () => {
    const mockTurnos = [{ id: 1, cliente: 'Juan' }];
    
    service.getTurnosDelDia().subscribe(turnos => {
      expect(turnos).toEqual(mockTurnos);
    });
    
    const req = httpMock.expectOne(`${environment.apiUrl}/turnos/hoy`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTurnos);
  });
});
📱 Navegación Ionic
typescript
// Navegación con parámetros
async irADetalleTurno(turnoId: string) {
  const modal = await this.modalController.create({
    component: DetalleTurnoPage,
    componentProps: { turnoId }
  });
  return await modal.present();
}
🚫 Convenciones Específicas TurnoYa
✅ Usar Signals para estado reactivo (Angular 20)

✅ TailwindCSS para estilos, no CSS custom

✅ Lazy loading en todas las features

✅ Interceptor para JWT en cada request

❌ Evitar any - usar tipos/interfaces siempre

❌ No lógica en constructores - solo inyección

❌ Evitar subscribe sin unsubscribe o takeUntil