# Configuración de Supabase Storage para FESTEASY

## Pasos para configurar Supabase Storage

### 1. Crear un proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta o inicia sesión
2. Crea un nuevo proyecto
3. Anota la **URL del proyecto** y la **anon key** (clave pública)

### 2. Crear el bucket de almacenamiento

1. En el panel de Supabase, ve a **Storage** en el menú lateral
2. Haz clic en **Create a new bucket**
3. Nombre del bucket: `festeasy`
4. Configura el bucket como **público** para que las imágenes sean accesibles
5. Haz clic en **Create bucket**

### 3. Configurar políticas de acceso (RLS - Row Level Security)

Para permitir que los usuarios suban y accedan a sus imágenes, necesitas configurar políticas:

1. Ve a **Storage** > **Policies** en el bucket `festeasy`
2. Crea las siguientes políticas:

#### Política de lectura (SELECT)
```sql
-- Permitir lectura pública de todas las imágenes
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'festeasy' );
```

#### Política de inserción (INSERT)
```sql
-- Permitir a usuarios autenticados subir imágenes
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'festeasy' AND auth.role() = 'authenticated' );
```

#### Política de actualización (UPDATE)
```sql
-- Permitir a usuarios autenticados actualizar sus propias imágenes
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'festeasy' AND auth.role() = 'authenticated' );
```

#### Política de eliminación (DELETE)
```sql
-- Permitir a usuarios autenticados eliminar sus propias imágenes
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'festeasy' AND auth.role() = 'authenticated' );
```

### 4. Actualizar las credenciales en el proyecto

Abre el archivo `src/environments/environment.ts` y actualiza las credenciales:

```typescript
export const environment = {
    production: true,
    apiUrl: 'http://localhost:3000',
    supabaseUrl: 'TU_SUPABASE_URL_AQUI', // Ej: https://xxxxx.supabase.co
    supabaseKey: 'TU_SUPABASE_ANON_KEY_AQUI' // La clave pública (anon key)
};
```

También actualiza `src/environments/environment.development.ts` con las mismas credenciales.

### 5. Estructura de carpetas en el bucket

El sistema está configurado para organizar las imágenes de la siguiente manera:

```
festeasy/
├── avatars/
│   ├── {usuario_id}-{timestamp}.jpg
│   ├── {usuario_id}-{timestamp}.png
│   └── ...
└── packages/
    ├── {paquete_id}-{timestamp}.jpg
    └── ...
```

### 6. Verificar la configuración

1. Inicia el servidor de desarrollo: `ng serve`
2. Navega a `/proveedor/configuracion`
3. Intenta subir una imagen de perfil
4. Verifica que la imagen se suba correctamente y se muestre en el perfil

## Notas importantes

- **Tamaño máximo de archivo**: El sistema está configurado para aceptar imágenes de hasta 2MB
- **Formatos aceptados**: JPG, PNG, GIF
- **Seguridad**: Las políticas de Supabase están configuradas para permitir lectura pública pero solo usuarios autenticados pueden subir/modificar/eliminar archivos
- **URLs públicas**: Las imágenes se almacenan con URLs públicas que se pueden usar directamente en el HTML

## Solución de problemas

### Error: "Cannot find module '@supabase/supabase-js'"
Ejecuta: `npm install @supabase/supabase-js`

### Error al subir imágenes
1. Verifica que las credenciales de Supabase sean correctas
2. Asegúrate de que el bucket `festeasy` existe y es público
3. Verifica que las políticas de acceso estén configuradas correctamente

### Las imágenes no se muestran
1. Verifica que el bucket sea público
2. Comprueba la URL pública de la imagen en Supabase Storage
3. Asegúrate de que no haya errores de CORS
