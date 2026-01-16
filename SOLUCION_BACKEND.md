# 🔧 Solución al Error 500 - Cambio de Backend

## 📋 Problema Identificado

El frontend está configurado para un backend en `http://localhost:3000`, pero **cambiaron de backend**.

La tabla `perfil_proveedor` existe en Supabase con esta estructura:
- Hace referencia a `public.users(id)` (no `usuarios`)
- Usa `gen_random_uuid()` para generar IDs
- Tiene campos obligatorios: `nombre_negocio`, `usuario_id`

---

## ✅ Soluciones Posibles

### **Opción 1: Usar Supabase Directamente (Recomendado)**

Si el nuevo backend es **Supabase**, puedes usar el cliente de Supabase directamente desde el frontend.

#### **Paso 1: Actualizar el Servicio de Autenticación**

Crear un nuevo servicio que use Supabase Auth:

```typescript
// src/app/services/supabase-auth.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseAuthService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    // Registrar usuario
    async signUp(email: string, password: string, metadata: any) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata // nombre_negocio, rol, etc.
            }
        });

        if (error) throw error;
        return data;
    }

    // Iniciar sesión
    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    // Crear perfil de proveedor
    async createProviderProfile(profile: any) {
        const { data, error } = await this.supabase
            .from('perfil_proveedor')
            .insert([profile])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Obtener usuario actual
    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    // Cerrar sesión
    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }
}
```

#### **Paso 2: Actualizar el Componente de Registro**

```typescript
// src/app/proveedor/registro/registro.ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseAuthService } from '../../services/supabase-auth.service';

@Component({
    selector: 'app-proveedor-registro',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './registro.html'
})
export class ProveedorRegistroComponent {
    private supabaseAuth = inject(SupabaseAuthService);
    private router = inject(Router);

    nombreNegocio = '';
    categoria = '';
    ubicacion = '';
    email = '';
    password = '';
    error = '';
    loading = false;

    categorias = ['DJ / Sonido', 'Catering', 'Fotografía', 'Decoración', 'Iluminación', 'Pastelería', 'Mobiliario', 'Entretenimiento'];

    async register() {
        if (!this.nombreNegocio || !this.categoria || !this.email || !this.password) {
            this.error = 'Por favor completa todos los campos obligatorios';
            return;
        }

        this.loading = true;
        this.error = '';

        try {
            // 1. Registrar usuario en Supabase Auth
            const { user } = await this.supabaseAuth.signUp(
                this.email,
                this.password,
                {
                    nombre_negocio: this.nombreNegocio,
                    rol: 'provider'
                }
            );

            if (!user) {
                throw new Error('No se pudo crear el usuario');
            }

            // 2. Crear perfil de proveedor
            await this.supabaseAuth.createProviderProfile({
                usuario_id: user.id,
                nombre_negocio: this.nombreNegocio,
                descripcion: `Categoría: ${this.categoria}`,
                direccion_formato: this.ubicacion
            });

            // 3. Redirigir al dashboard
            this.router.navigate(['/proveedor/dashboard']);

        } catch (err: any) {
            console.error('Error en registro:', err);
            this.error = err.message || 'Error al registrarse';
            this.loading = false;
        }
    }
}
```

---

### **Opción 2: Actualizar la URL del Backend**

Si el nuevo backend es un servidor Node.js/Express en otra URL:

#### **Actualizar `environment.development.ts`:**

```typescript
export const environment = {
    production: false,
    apiUrl: 'https://TU_NUEVO_BACKEND_URL',  // ← Cambia esto
    supabaseUrl: 'https://ghlosgnopdmrowiygxdm.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

#### **Verificar los Endpoints del Nuevo Backend:**

El nuevo backend debe tener estos endpoints:

```
POST /auth/register
POST /auth/login
POST /perfil-proveedor
GET  /perfil-proveedor/:id
PUT  /perfil-proveedor/:id
```

---

### **Opción 3: Usar Supabase Edge Functions**

Si estás usando Supabase Edge Functions como backend:

```typescript
// Actualizar environment
export const environment = {
    production: false,
    apiUrl: 'https://ghlosgnopdmrowiygxdm.supabase.co/functions/v1',
    supabaseUrl: 'https://ghlosgnopdmrowiygxdm.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

---

## 🎯 ¿Cuál es tu Nuevo Backend?

Para ayudarte mejor, necesito saber:

1. **¿Qué tipo de backend estás usando ahora?**
   - [ ] Supabase directamente (sin backend intermedio)
   - [ ] Node.js/Express en otra URL
   - [ ] Supabase Edge Functions
   - [ ] Otro (especifica)

2. **¿Cuál es la URL del nuevo backend?**
   - Ejemplo: `https://api.tudominio.com`
   - O: `https://ghlosgnopdmrowiygxdm.supabase.co`

3. **¿Tienes documentación de los endpoints del nuevo backend?**

---

## 📝 Próximos Pasos

Una vez que me digas qué backend estás usando, puedo:

1. ✅ Actualizar el `ApiService` para que funcione con el nuevo backend
2. ✅ Actualizar el componente de registro
3. ✅ Configurar la autenticación correctamente
4. ✅ Probar que el registro funcione

**¿Qué tipo de backend estás usando ahora?**
