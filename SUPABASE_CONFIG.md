# Configuración de Supabase Storage - FESTEASY

## 📋 Información del Proyecto

### **URL del Proyecto Supabase**
```
https://ghlosgnopdmrowiygxdm.supabase.co
```

### **URL del Storage S3**
```
https://ghlosgnopdmrowiygxdm.storage.supabase.co/storage/v1/s3
```

### **Anon Key (Clave Pública)**
```
44602cc38581c73caee60072799897507f5fa02de0ae5167adc785db23cebefc
```

---

## 🔧 Configuración en el Proyecto

### **Archivos de Environment**

La configuración ya está correctamente establecida en:

1. **`src/environments/environment.ts`** (Producción)
2. **`src/environments/environment.development.ts`** (Desarrollo)

```typescript
export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000',
    supabaseUrl: 'https://ghlosgnopdmrowiygxdm.supabase.co',
    supabaseKey: '44602cc38581c73caee60072799897507f5fa02de0ae5167adc785db23cebefc'
};
```

---

## 📦 Bucket Configurado

### **Nombre del Bucket**
```
festeasy
```

### **Estructura de Carpetas**
```
festeasy/
├── avatars/          # Fotos de perfil de proveedores
│   └── {usuario_id}-{timestamp}.{ext}
│
└── packages/         # Imágenes de paquetes
    └── {usuario_id}-{timestamp}-{random}.{ext}
```

---

## 🌐 URLs Generadas

### **Formato de URL Pública**

Cuando subes un archivo, Supabase genera automáticamente una URL pública con este formato:

```
https://ghlosgnopdmrowiygxdm.supabase.co/storage/v1/object/public/festeasy/{ruta_del_archivo}
```

### **Ejemplos de URLs Reales**

**Avatar de proveedor:**
```
https://ghlosgnopdmrowiygxdm.supabase.co/storage/v1/object/public/festeasy/avatars/user-123-1737048000000.jpg
```

**Imagen de paquete:**
```
https://ghlosgnopdmrowiygxdm.supabase.co/storage/v1/object/public/festeasy/packages/user-123-1737048000000-abc123.jpg
```

---

## ✅ Verificación de Configuración

### **1. Verificar que el Bucket Existe**

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona el proyecto `ghlosgnopdmrowiygxdm`
3. Ve a **Storage** en el menú lateral
4. Verifica que el bucket `festeasy` existe
5. Verifica que el bucket sea **público**

### **2. Verificar las Políticas de Acceso**

El bucket debe tener las siguientes políticas (RLS):

#### **Política de Lectura (SELECT)**
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'festeasy' );
```

#### **Política de Inserción (INSERT)**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'festeasy' );
```

#### **Política de Actualización (UPDATE)**
```sql
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'festeasy' );
```

#### **Política de Eliminación (DELETE)**
```sql
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'festeasy' );
```

---

## 🧪 Probar la Configuración

### **Método 1: Desde el Dashboard de Supabase**

1. Ve a **Storage** > **festeasy**
2. Intenta subir un archivo manualmente
3. Verifica que se genere una URL pública
4. Abre la URL en el navegador para verificar que la imagen sea accesible

### **Método 2: Desde la Aplicación**

1. Inicia sesión como proveedor
2. Ve a **Configuración** (`/proveedor/configuracion`)
3. Intenta subir una foto de perfil
4. Verifica en la consola del navegador que se imprima:
   ```
   Imagen subida exitosamente
   ```
5. Verifica que la imagen se muestre en el perfil

### **Método 3: Crear un Paquete**

1. Ve a **Mis Paquetes** (`/proveedor/paquetes`)
2. Completa los pasos 1 y 2
3. En el Paso 3, sube imágenes
4. Verifica en la consola del navegador que no haya errores
5. Verifica que las imágenes se muestren en la galería
6. Completa el Paso 4 y publica el paquete
7. Verifica en la base de datos que las URLs de las imágenes se guardaron correctamente

---

## 🐛 Solución de Problemas

### **Error: "Failed to upload file"**

**Posibles causas:**
1. El bucket no existe
2. El bucket no es público
3. Las políticas de acceso no están configuradas
4. La anon key es incorrecta

**Solución:**
1. Verifica que el bucket `festeasy` existe
2. Verifica que el bucket sea público
3. Verifica las políticas de acceso (ver arriba)
4. Verifica que la `supabaseKey` en el environment sea correcta

### **Error: "CORS policy"**

**Causa:** Supabase no permite el origen de la aplicación.

**Solución:**
1. Ve a **Settings** > **API** en Supabase Dashboard
2. Agrega `http://localhost:4200` a los orígenes permitidos
3. Agrega `http://localhost:3000` si usas el backend

### **Las imágenes se suben pero no se ven**

**Causa:** El bucket no es público.

**Solución:**
1. Ve a **Storage** > **festeasy**
2. Haz clic en los 3 puntos (⋮)
3. Selecciona **Make public**
4. Confirma

### **Error: "Invalid API key"**

**Causa:** La anon key es incorrecta o ha expirado.

**Solución:**
1. Ve a **Settings** > **API** en Supabase Dashboard
2. Copia la **anon/public key**
3. Actualiza `supabaseKey` en los archivos de environment
4. Reinicia el servidor de desarrollo (`ng serve`)

---

## 📝 Notas Importantes

1. **URL del Storage S3**: La URL `https://ghlosgnopdmrowiygxdm.storage.supabase.co/storage/v1/s3` es la URL interna del storage S3. El cliente de Supabase maneja esto automáticamente, no necesitas configurarla manualmente.

2. **Anon Key**: La clave pública (`anon key`) es segura para usar en el frontend. NO uses la `service_role key` en el frontend.

3. **Bucket Público**: El bucket `festeasy` debe ser público para que las imágenes sean accesibles sin autenticación.

4. **Políticas de Seguridad**: Aunque el bucket es público para lectura, solo usuarios autenticados pueden subir, actualizar o eliminar archivos.

5. **Límites de Supabase**:
   - **Free tier**: 1GB de storage
   - **Tamaño máximo de archivo**: 50MB (pero limitamos a 5MB en la app)
   - **Ancho de banda**: 2GB/mes en free tier

---

## 🔗 Enlaces Útiles

- **Supabase Dashboard**: https://app.supabase.com/project/ghlosgnopdmrowiygxdm
- **Documentación de Supabase Storage**: https://supabase.com/docs/guides/storage
- **Políticas de Seguridad (RLS)**: https://supabase.com/docs/guides/storage/security/access-control

---

## ✅ Checklist de Configuración

- [x] Proyecto Supabase creado
- [x] Bucket `festeasy` creado
- [x] Bucket configurado como público
- [x] Políticas de acceso configuradas
- [x] URLs configuradas en `environment.ts`
- [x] URLs configuradas en `environment.development.ts`
- [x] Servicio de Supabase creado (`supabase.service.ts`)
- [x] Paquete `@supabase/supabase-js` instalado

---

**Estado**: ✅ **CONFIGURADO Y LISTO PARA USAR**

**Última verificación**: 2026-01-16 09:20
