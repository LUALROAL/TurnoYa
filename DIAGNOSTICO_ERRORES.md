# 🔍 DIAGNÓSTICO DE ERRORES - TURNOYA

## ✅ VERIFICACIÓN BACKEND

### Prueba 1: Endpoint de Negocios
```bash
curl https://localhost:7187/api/Business?pageNumber=1&pageSize=10
```

**Resultado:** ✅ **FUNCIONA**
```json
[
  {
    "id": "b48e73d7-9193-4153-a789-46c9920e37ad",
    "name": "Barbería Central",
    "category": "Barber",
    "city": "Medellín"
  },
  {
    "id": "8a2d5849-93b7-4fd2-bc86-ce7562ca7828",
    "name": "Masajes inc",
    "category": "Masajista",
    "city": "bogota"
  },
  ...
]
```

**Conclusión:** El backend está funcionando correctamente y devolviendo datos.

---

## 🔴 PROBLEMAS IDENTIFICADOS EN FRONTEND

### Problema 1: Business-List aparece vacío

**Archivo:** `business-list.page.ts`

**Análisis del código:**
```typescript
this.businessService.getBusinesses(
  this.currentPage,
  this.pageSize,
  this.searchTerm
).subscribe({
  next: (response) => {
    console.log('Response from backend:', response);
    
    // El backend puede devolver directamente un array o un ApiResponse
    let businessData: any[] = [];

    if (Array.isArray(response)) {
      businessData = response;
    } else if (response && response.data) {
      businessData = Array.isArray(response.data) ? response.data : [response.data];
    }
    
    this.businesses = businessData;
  }
})
```

**Problema detectado:**
El código maneja dos formatos:
1. Array directo: `[{...}, {...}]`
2. ApiResponse: `{ data: [{...}], totalPages: 5 }`

El backend está devolviendo **array directo**, así que debería funcionar.

**Posible causa:**
- El componente se carga **ANTES** de que el authGuard valide
- No hay token en localStorage
- La petición falla pero no muestra error

### Problema 2: Appointments-List vacío

Similar al anterior - falta verificar:
1. Si el usuario tiene citas
2. Si el endpoint funciona
3. Si hay logs de error

---

## 🛠️ SOLUCIÓN PASO A PASO

### Paso 1: Verificar Token en Frontend

**Abrir DevTools → Application → LocalStorage**

Debe existir:
- `turnoYa_token`: Token JWT
- `turnoYa_refresh_token`: Refresh token

Si NO existen → **Hacer login nuevamente**

### Paso 2: Verificar Logs en Consola

**Abrir DevTools → Console**

Buscar:
```
Response from backend: ...
Business data to display: ...
Number of businesses: ...
```

Si NO aparecen logs → **El componente no se está cargando**
Si aparece error 401 → **Token expirado, hacer login**
Si aparece error de CORS → **Problema de configuración**

### Paso 3: Verificar Network Tab

**DevTools → Network → XHR**

Buscar petición a:
```
GET https://localhost:7187/api/Business?pageNumber=1&pageSize=10
```

**Revisar:**
- Status Code (debe ser 200)
- Response (debe tener array de negocios)
- Request Headers (debe tener Authorization: Bearer ...)

---

## 📋 CHECKLIST DE DIAGNÓSTICO

### Frontend:
- [ ] ¿La app está corriendo en http://localhost:8100?
- [ ] ¿Hay token en localStorage?
- [ ] ¿El token es válido? (no expirado)
- [ ] ¿Se ve el home con las tarjetas?
- [ ] ¿Al hacer click en "Buscar Negocios" navega a /business/list?
- [ ] ¿business-list.page.ts se carga? (ver logs)
- [ ] ¿loadBusinesses() se ejecuta? (ver logs)
- [ ] ¿Hay errores en console?
- [ ] ¿La petición HTTP se hace? (ver Network tab)
- [ ] ¿La respuesta tiene datos?

### Backend:
- [x] ¿El backend está corriendo en https://localhost:7187?
- [x] ¿El endpoint /api/Business devuelve datos?
- [ ] ¿El token se valida correctamente?
- [ ] ¿Hay errores en logs del backend?

---

## 🔧 CORRECCIONES A APLICAR

### Fix 1: Mejorar manejo de respuesta en business-list

**Problema:** El código asume que siempre viene un array, pero debemos verificar mejor.

**Código actual:**
```typescript
if (Array.isArray(response)) {
  businessData = response;
} else if (response && response.data) {
  businessData = Array.isArray(response.data) ? response.data : [response.data];
}
```

**Código mejorado:**
```typescript
// Extraer datos dependiendo del formato
if (Array.isArray(response)) {
  // Formato: [{...}, {...}]
  businessData = response;
} else if (response && typeof response === 'object') {
  // Formato: { data: [...], items: [...], o directamente el objeto }
  businessData = response.data || response.items || [response];
} else {
  console.error('Formato de respuesta inesperado:', response);
  businessData = [];
}

console.log('✅ Datos extraídos:', businessData);
console.log('✅ Cantidad de negocios:', businessData.length);
```

### Fix 2: Agregar mejor manejo de errores

```typescript
.subscribe({
  next: (response) => {
    // ...código de extracción...
  },
  error: (error) => {
    console.error('❌ Error al cargar negocios:', error);
    console.error('❌ Status:', error.status);
    console.error('❌ Message:', error.message);
    console.error('❌ Full error:', error);
    
    this.isLoading = false;
    
    if (error.status === 401) {
      this.showToast('Sesión expirada. Por favor inicia sesión nuevamente.', 'danger');
      this.router.navigate(['/login']);
    } else {
      this.showToast(`Error al cargar negocios: ${error.message}`, 'danger');
    }
  }
})
```

### Fix 3: Agregar logs de inicio

```typescript
ngOnInit() {
  console.log('🚀 BusinessListPage inicializada');
  console.log('📍 Current URL:', this.router.url);
  this.loadBusinesses();
  this.loadCategories();
}

loadBusinesses(reset: boolean = false) {
  console.log('📊 loadBusinesses() ejecutándose...');
  console.log('🔄 Reset:', reset);
  console.log('📄 Current page:', this.currentPage);
  console.log('📦 Page size:', this.pageSize);
  console.log('🔍 Search term:', this.searchTerm);
  
  this.isLoading = true;
  // ... resto del código
}
```

### Fix 4: Verificar authGuard

**Problema:** El authGuard puede estar bloqueando sin redirigir correctamente.

**Archivo:** `auth.guard.ts`

**Agregar logs:**
```typescript
export const authGuard: CanActivateFn = async (route, state) => {
  console.log('🔐 authGuard ejecutándose...');
  console.log('📍 Route:', state.url);
  
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.isAuthenticated();
  console.log('✅ isAuthenticated:', isAuthenticated);

  if (!isAuthenticated) {
    console.log('❌ No autenticado, redirigiendo a /login');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  console.log('✅ Autenticado, permitiendo acceso');
  return true;
};
```

---

## 🎯 ACCIONES INMEDIATAS

1. **Abrir la app en el navegador** (http://localhost:8100)
2. **Abrir DevTools** (F12)
3. **Ir a la pestaña Console**
4. **Hacer login** y observar los logs
5. **Navegar a "Buscar Negocios"** y observar:
   - ¿Se ejecuta ngOnInit?
   - ¿Se ejecuta loadBusinesses?
   - ¿Hay errores?
   - ¿Qué devuelve el backend?
6. **Ir a Network tab** y verificar la petición HTTP
7. **Reportar** qué logs aparecen en consola

---

## 📸 CAPTURAS NECESARIAS

Por favor toma capturas de:
1. **Console tab** - Con todos los logs
2. **Network tab** - Con la petición a /api/Business
3. **Application → LocalStorage** - Para ver los tokens
4. **La pantalla** - Para ver qué se muestra

Con esta información podré dar una solución exacta.

