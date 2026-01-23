# Guía de Documentación de Código - Estándares de Senior Tech Lead

## Resumen
Esta guía establece los estándares de documentación para la base de código Angular/TypeScript de FestEasy, siguiendo las mejores prácticas de la industria para código mantenible, escalable y autodocumentado.

## Estándares Específicos por Lenguaje y Framework

### Documentación Angular/TypeScript (TSDoc)

#### Documentación de Clases
```typescript
/**
 * Servicio responsable de gestionar el estado de autenticación y sesiones de usuario.
 * Maneja login, logout, registro y gestión de perfiles de usuario usando Supabase.
 * 
 * @example
 * ```typescript
 * constructor(private authService: AuthService) {
 *   if (this.authService.isLoggedIn()) {
 *     this.navigateToDashboard();
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Implementación
}
```

#### Documentación de Métodos
```typescript
/**
 * Autentica usuario con credenciales de email y contraseña.
 * 
 * @param email - Dirección de email del usuario para autenticación
 * @param password - Contraseña del usuario (mínimo 8 caracteres)
 * @returns Observable<User> que contiene datos del usuario autenticado
 * @throws {UnauthorizedError} Cuando las credenciales son inválidas
 * @throws {NetworkError} Cuando la conexión a Supabase falla
 * 
 * @example
 * ```typescript
 * this.authService.login('usuario@ejemplo.com', 'password123')
 *   .subscribe(user => console.log('Usuario logueado:', user));
 * ```
 */
login(email: string, password: string): Observable<User> {
  // Implementación
}
```

#### Documentación de Interfaces
```typescript
/**
 * Representa un perfil de proveedor de servicios en la plataforma FestEasy.
 * Contiene información del negocio, detalles de servicios y configuración de disponibilidad.
 */
export interface ProviderProfile {
  /** Identificador único del perfil de proveedor */
  id: string;
  
  /** Nombre del negocio mostrado a los clientes */
  nombre_negocio: string;
  
  /** Descripción detallada de los servicios ofrecidos */
  descripcion?: string;
  
  /** Coordenadas geográficas para búsquedas basadas en ubicación */
  coordenadas?: {
    /** Coordenada de latitud */
    latitud: number;
    /** Coordenada de longitud */
    longitud: number;
  };
  
  /** Estado actual de la cuenta del proveedor */
  estado: 'active' | 'inactive' | 'pending';
}
```

## Estándares de Documentación por Categoría

### 1. Documentación de Servicios

#### Servicio de Autenticación (`auth.service.ts`)
```typescript
/**
 * Servicio central de autenticación que gestiona sesiones de usuario, roles y datos de perfil.
 * Se integra con Supabase para autenticación segura y proporciona gestión de estado reactiva.
 */
export class AuthService {
  /** Signal reactivo que indica el estado actual de autenticación */
  isLoggedIn = signal(false);
  
  /** Signal reactivo que contiene los datos del perfil del usuario actual */
  currentUser = signal<any>(null);

  /**
   * Inicializa el estado de autenticación verificando sesiones existentes.
   * Carga automáticamente el perfil del usuario si existe una sesión.
   * 
   * @private
   * @async
   * @returns Promise<void> Se resuelve cuando la inicialización se completa
   */
  private async initialize(): Promise<void> {
    // Implementación
  }

  /**
   * Carga el perfil completo del usuario incluyendo datos específicos del rol.
   * Determina el rol del usuario desde la base de datos primero, con fallback a metadatos.
   * 
   * @private
   * @async
   * @param user - Objeto usuario de Supabase que contiene datos básicos del usuario
   * @returns Promise<void> Se resuelve cuando el perfil está cargado y el estado está actualizado
   */
  private async loadUserProfile(user: any): Promise<void> {
    // Implementación
  }
}
```

#### Servicio API (`api.service.ts`)
```typescript
/**
 * Servicio API principal que maneja todas las operaciones de datos con el backend Supabase.
 * Proporciona métodos con seguridad de tipos para operaciones CRUD en todas las entidades.
 * 
 * @template T Tipo genérico para manejo de datos de respuesta
 */
export class ApiService {
  /**
   * Crea un nuevo perfil de cliente en la base de datos.
   * 
   * @param data - Datos parciales del perfil de cliente a crear
   * @returns Observable<ClientProfile> Emite el perfil creado con campos generados por el servidor
   * @throws {DatabaseError} Cuando la creación del perfil falla debido a restricciones
   * 
   * @example
   * ```typescript
   * this.apiService.createClientProfile({
   *   nombre_completo: 'Juan Pérez',
   *   telefono: '+1234567890'
   * }).subscribe(profile => console.log('Perfil creado:', profile));
   * ```
   */
  createClientProfile(data: Partial<ClientProfile>): Observable<ClientProfile> {
    // Implementación
  }

  /**
   * Recupera paquetes del proveedor con información de categoría.
   * Usa join de Supabase para incluir nombres de categoría en la respuesta.
   * 
   * @param providerUserId - Identificador único del proveedor
   * @returns Observable<ProviderPackage[]> Array de paquetes con datos de categoría
   * @throws {NotFoundError} Cuando el proveedor no tiene paquetes
   */
  getPackagesByProviderId(providerUserId: string): Observable<ProviderPackage[]> {
    // Implementación
  }
}
```

### 2. Documentación de Componentes

#### Documentación de Componentes Angular
```typescript
/**
 * Componente que muestra el dashboard del proveedor con métricas clave y navegación.
 * Muestra solicitudes pendientes, ganancias y acceso rápido a acciones comunes.
 */
@Component({
  selector: 'app-provider-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class ProviderDashboardComponent implements OnInit {
  /** Array de solicitudes de servicios pendientes */
  pendingRequests: ServiceRequest[] = [];
  
  /** Ganancias del mes actual calculadas de servicios completados */
  monthlyEarnings: number = 0;

  /**
   * Inicializa los datos del componente cargando estadísticas del proveedor.
   * Se llama automáticamente después de la construcción del componente.
   * 
   * @async
   * @returns Promise<void> Se resuelve cuando todos los datos del dashboard están cargados
   */
  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
  }

  /**
   * Maneja la aceptación de solicitudes con actualización de estado y notificación.
   * 
   * @param requestId - Identificador único de la solicitud a aceptar
   * @returns void Actualiza el estado de la solicitud y refresca el dashboard
   * @throws {UpdateError} Cuando la actualización del estado falla
   */
  acceptRequest(requestId: string): void {
    // Implementación
  }
}
```

### 3. Documentación de Lógica Compleja

#### Comentarios en Línea para Lógica Compleja
```typescript
/**
 * Determina el rol del usuario con estrategia de fallback para nuevos usuarios.
 * Prioridad: Base de Datos > Metadatos de Usuario > Por defecto 'client'
 */
private async loadUserProfile(user: any): Promise<void> {
  // 1. Verificar base de datos primero (fuente de verdad para usuarios existentes)
  let rol = await this.supabaseAuth.determineUserRole(user.id);

  // 2. Fallback a metadatos para nuevos usuarios no aún en tabla de perfil
  if (!rol) {
    rol = user.user_metadata?.rol || 'client';
  }

  // 3. Seleccionar tabla apropiada basada en el rol determinado
  const table = rol === 'provider' ? 'perfil_proveedor' : 'perfil_cliente';

  // 4. Consultar datos de perfil con manejo de errores apropiado
  const { data: profile } = await this.supabase
    .from(table)
    .select('*')
    .eq('usuario_id', user.id)
    .single();

  // 5. Fusionar datos de usuario y perfil para objeto de usuario completo
  const fullUser = {
    ...profile,
    profile_id: profile?.id ?? null,
    id: user.id,
    email: user.email,
    rol: rol,
  };

  // 6. Actualizar estado reactivo con datos completos del usuario
  this.isLoggedIn.set(true);
  this.currentUser.set(fullUser);
}
```

### 4. Documentación de Manejo de Errores

#### Documentación de Errores de Métodos
```typescript
/**
 * Crea una nueva solicitud de servicio con items asociados.
 * 
 * @param data - Datos de la solicitud incluyendo detalles del servicio e items
 * @returns Observable<ServiceRequest> Solicitud creada con ID generado por el servidor
 * @throws {AuthenticationError} Cuando el usuario no está autenticado
 * @throws {ValidationError} Cuando faltan campos requeridos o son inválidos
 * @throws {DatabaseError} Cuando la creación de la solicitud falla debido a restricciones
 * 
 * @example
 * ```typescript
 * this.apiService.createRequest({
 *   proveedor_usuario_id: 'provider-123',
 *   fecha_evento: '2024-12-31',
 *   items: [{ paquete_id: 'pkg-123', cantidad: 2 }]
 * }).subscribe(request => console.log('Solicitud creada:', request));
 * ```
 */
createRequest(data: any): Observable<any> {
  return from(this.supabase.auth.getUser()).pipe(
    switchMap(({ data: { user }, error }: any) => {
      // Validar estado de autenticación
      if (error) return throwError(() => error);
      if (!user) {
        return throwError(() => new Error('Sesión de Supabase no válida. Vuelve a iniciar sesión.'));
      }

      // Preparar payload con ID de usuario autenticado
      const payload = {
        ...data,
        cliente_usuario_id: user.id,
      };

      // Ejecutar inserción en base de datos con manejo de errores apropiado
      return this.fromSupabase(this.supabase.from('solicitudes').insert(payload).select().single());
    })
  );
}
```

## Estándares de Calidad de Documentación

### 1. Requisitos de Completitud
- **Toda clase pública** debe tener un bloque de documentación a nivel de clase
- **Todo método público** debe documentar parámetros, valores de retorno y excepciones
- **Toda interfaz** debe documentar todas las propiedades con descripciones claras
- **Lógica compleja** debe tener comentarios en línea explicando el "porqué"

### 2. Estándares de Contenido
- Usar **tiempo presente** para descripciones de métodos ("Crea", "Recupera", "Actualiza")
- Incluir **ejemplos** para métodos complejos o frecuentemente usados
- Documentar **todas las excepciones posibles** con tipos de error específicos
- Usar **lenguaje claro y conciso** evitando jerga técnica cuando sea posible

### 3. Estándares de Formato
- Usar **sintaxis TSDoc** (`@param`, `@returns`, `@throws`, `@example`)
- Mantener **indentación y formato consistentes**
- Incluir **información de tipos** para todos los parámetros y valores de retorno
- Usar **markdown apropiado** para ejemplos de código y formato

### 4. Estándares de Mantenimiento
- Actualizar documentación **inmediatamente** cuando el código cambia
- Revisar documentación durante **code reviews**
- Usar **herramientas automatizadas** para validar completitud de la documentación
- Mantener ejemplos **funcionales y probados**

## Checklist de Implementación

### Antes del Code Review
- [ ] Todas las clases públicas tienen documentación a nivel de clase
- [ ] Todos los métodos públicos documentan parámetros, retornos y excepciones
- [ ] Todas las interfaces documentan todas las propiedades
- [ ] La lógica compleja tiene comentarios en línea explicativos
- [ ] Los ejemplos son funcionales y están probados

### Durante el Code Review
- [ ] La documentación describe con precisión el comportamiento del código
- [ ] Los tipos de parámetros coinciden con la implementación real
- [ ] La documentación de excepciones cubre todos los casos de error
- [ ] Los ejemplos demuestran el uso correcto
- [ ] El lenguaje es claro y profesional

### Después de la Implementación
- [ ] Ejecutar herramientas de validación de documentación
- [ ] Probar todos los ejemplos de código
- [ ] Actualizar documentación relacionada
- [ ] Verificar consistencia con estándares de la base de código

## Herramientas y Automatización

### Herramientas Recomendadas
- **TypeDoc** para generar documentación de API
- **Reglas ESLint TSDoc** para validación de documentación
- **Extensiones IDE JSDoc/TSDoc** para mejor soporte del editor
- **Pruebas automatizadas** para ejemplos de código

### Comandos de Validación
```bash
# Generar documentación
npx typedoc src/

# Validar cumplimiento de TSDoc
npx eslint src/ --ext .ts --rule 'tsdoc/syntax: error'

# Verificar miembros públicos no documentados
npx eslint src/ --ext .ts --rule 'jsdoc/require-jsdoc: error'
```

Esta guía de documentación asegura que la base de código de FestEasy mantenga altos estándares de claridad, mantenibilidad y experiencia de desarrollador a través de documentación comprensiva, precisa y útil.