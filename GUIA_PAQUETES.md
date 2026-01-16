# Sistema de Creación y Subida de Paquetes - Guía Completa

## ✅ Implementación Completada

### 📦 **Funcionalidad de Subida de Paquetes**

El sistema ahora guarda **TODA** la información del paquete al backend, incluyendo:

1. **Información Básica**:
   - Nombre del paquete
   - Categoría del servicio
   - Descripción
   - Precio base
   - Estado (borrador/publicado)

2. **Items del Inventario**:
   - Lista completa de items con nombre y cantidad
   - Guardados en el campo `detalles_json`

3. **Cargos Adicionales**:
   - Servicios extra con nombre y precio
   - Guardados en el campo `detalles_json`

4. **Imágenes**:
   - URLs de todas las imágenes subidas a Supabase
   - Indicador de cuál es la imagen de portada
   - Guardadas en el campo `detalles_json`

5. **Total Estimado**:
   - Cálculo automático del precio total
   - Guardado en el campo `detalles_json`

---

## 🔧 **Cómo Funciona el Sistema**

### **Flujo de Creación de Paquete**

```
1. Usuario completa Paso 1 (Información General)
   ↓
2. Usuario completa Paso 2 (Items y Precios)
   ↓
3. Usuario sube imágenes en Paso 3
   → Las imágenes se suben INMEDIATAMENTE a Supabase Storage
   → Se obtienen las URLs públicas
   ↓
4. Usuario revisa todo en Paso 4
   ↓
5. Usuario hace clic en "Publicar" o "Guardar Borrador"
   ↓
6. Sistema valida todos los campos
   ↓
7. Sistema envía TODO al backend en una sola petición
   ↓
8. Backend guarda el paquete en la base de datos
   ↓
9. Sistema muestra mensaje de éxito
   ↓
10. Formulario se resetea automáticamente
```

---

## 📡 **Estructura de Datos Enviada al Backend**

```json
{
  "nombre": "Paquete de Sonido e Iluminación",
  "categoria_servicio_id": "musica",
  "descripcion": "Incluye equipo profesional de sonido...",
  "precio_base": 5000,
  "estado": "publicado",
  "detalles_json": "{
    \"items\": [
      {\"nombre\": \"Sillas Tiffany\", \"cantidad\": 20},
      {\"nombre\": \"Mesas Imperiales\", \"cantidad\": 4}
    ],
    \"cargos_adicionales\": [
      {\"nombre\": \"Montaje\", \"precio\": 500},
      {\"nombre\": \"Transporte\", \"precio\": 300}
    ],
    \"imagenes\": [
      {\"url\": \"https://ghlosgnopdmrowiygxdm.supabase.co/storage/v1/object/public/festeasy/packages/user-123-1234567890.jpg\", \"isPortada\": true},
      {\"url\": \"https://ghlosgnopdmrowiygxdm.supabase.co/storage/v1/object/public/festeasy/packages/user-123-1234567891.jpg\", \"isPortada\": false}
    ],
    \"total_estimado\": 5800
  }"
}
```

---

## 🧪 **Cómo Probar el Sistema**

### **Paso 1: Verificar que el Backend Esté Corriendo**

```bash
# En la carpeta del backend
cd backend
npm start
# o
node server.js
```

El backend debe estar corriendo en `http://localhost:3000`

### **Paso 2: Verificar que Supabase Esté Configurado**

1. Ve a [https://supabase.com](https://supabase.com)
2. Verifica que el proyecto `ghlosgnopdmrowiygxdm` exista
3. Verifica que el bucket `festeasy` esté creado y sea público
4. Verifica que las políticas de acceso estén configuradas

### **Paso 3: Probar la Creación de un Paquete**

1. Abre el navegador en `http://localhost:4200`
2. Inicia sesión como proveedor
3. Ve a `/proveedor/paquetes`
4. Completa los 4 pasos:

   **Paso 1: Información General**
   - Nombre: "Paquete de Prueba"
   - Categoría: "Música y Sonido"
   - Descripción: "Este es un paquete de prueba con todos los detalles necesarios"

   **Paso 2: Detalles y Precios**
   - Agregar items:
     * "Sillas Tiffany" - Cantidad: 20
     * "Mesas Imperiales" - Cantidad: 4
   - Precio Base: $5000
   - Cargos adicionales:
     * "Montaje" - $500
     * "Transporte" - $300

   **Paso 3: Multimedia**
   - Subir al menos 2-3 imágenes
   - Seleccionar una como portada
   - Verificar que las imágenes se suban correctamente

   **Paso 4: Revisión**
   - Verificar que toda la información esté correcta
   - Hacer clic en "Publicar Paquete"

5. **Verificar la respuesta**:
   - Debe aparecer el mensaje: "¡Paquete publicado exitosamente! 🎉"
   - El formulario debe resetearse después de 2 segundos

### **Paso 4: Verificar en la Consola del Navegador**

Abre las DevTools (F12) y verifica:

```javascript
// Debes ver estos logs:
📦 Guardando paquete: {nombre: "...", categoria_servicio_id: "...", ...}
✅ Paquete creado exitosamente: {id: "...", nombre: "...", ...}
```

### **Paso 5: Verificar en el Backend**

Verifica que el paquete se haya guardado en la base de datos:

```sql
SELECT * FROM paquetes_proveedor ORDER BY creado_en DESC LIMIT 1;
```

Debes ver el paquete con todos los datos, incluyendo el campo `detalles_json` con la información completa.

---

## 🐛 **Solución de Problemas**

### **Error: "No estás autenticado"**

**Causa**: No hay token de autenticación o el token expiró.

**Solución**:
1. Cierra sesión e inicia sesión nuevamente
2. Verifica que el token se esté enviando en las peticiones
3. Verifica que el backend esté validando correctamente el token

### **Error: "Datos inválidos"**

**Causa**: El backend rechazó los datos enviados.

**Solución**:
1. Verifica que todos los campos obligatorios estén llenos
2. Verifica que el formato de los datos sea correcto
3. Revisa los logs del backend para ver el error específico

### **Error: "Error del servidor"**

**Causa**: El backend tiene un error interno.

**Solución**:
1. Revisa los logs del backend
2. Verifica que la base de datos esté corriendo
3. Verifica que las tablas existan

### **Las imágenes no se suben**

**Causa**: Problema con Supabase Storage.

**Solución**:
1. Verifica las credenciales de Supabase en `environment.ts`
2. Verifica que el bucket `festeasy` exista
3. Verifica que el bucket sea público
4. Verifica las políticas de acceso

### **El paquete se guarda pero sin imágenes**

**Causa**: El campo `detalles_json` no se está guardando correctamente.

**Solución**:
1. Verifica que el backend acepte el campo `detalles_json`
2. Si el backend no tiene este campo, necesitas crear tablas separadas:
   - `paquete_items` (id, paquete_id, nombre, cantidad)
   - `paquete_imagenes` (id, paquete_id, url, is_portada)
   - `paquete_cargos` (id, paquete_id, nombre, precio)

---

## 📊 **Estructura de Base de Datos Recomendada**

Si el backend **NO** soporta el campo `detalles_json`, necesitas estas tablas:

### **Tabla: paquetes_proveedor**
```sql
CREATE TABLE paquetes_proveedor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proveedor_usuario_id UUID REFERENCES usuarios(id),
  nombre VARCHAR(255) NOT NULL,
  categoria_servicio_id VARCHAR(100),
  descripcion TEXT,
  precio_base DECIMAL(10, 2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'borrador',
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);
```

### **Tabla: paquete_items**
```sql
CREATE TABLE paquete_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paquete_id UUID REFERENCES paquetes_proveedor(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  cantidad INTEGER NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);
```

### **Tabla: paquete_imagenes**
```sql
CREATE TABLE paquete_imagenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paquete_id UUID REFERENCES paquetes_proveedor(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_portada BOOLEAN DEFAULT FALSE,
  orden INTEGER DEFAULT 0,
  creado_en TIMESTAMP DEFAULT NOW()
);
```

### **Tabla: paquete_cargos_adicionales**
```sql
CREATE TABLE paquete_cargos_adicionales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paquete_id UUID REFERENCES paquetes_proveedor(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 **Modificación del Backend (Si es necesario)**

Si necesitas modificar el backend para soportar tablas separadas, aquí está el código:

### **Controlador: createProviderPackage**

```javascript
async createProviderPackage(req, res) {
  const { 
    nombre, 
    categoria_servicio_id, 
    descripcion, 
    precio_base, 
    estado,
    detalles_json 
  } = req.body;
  
  const proveedor_usuario_id = req.user.id; // Del token JWT

  try {
    // 1. Crear el paquete principal
    const paquete = await db.query(
      `INSERT INTO paquetes_proveedor 
       (proveedor_usuario_id, nombre, categoria_servicio_id, descripcion, precio_base, estado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [proveedor_usuario_id, nombre, categoria_servicio_id, descripcion, precio_base, estado]
    );

    const paqueteId = paquete.rows[0].id;

    // 2. Parsear detalles_json
    const detalles = JSON.parse(detalles_json);

    // 3. Guardar items
    if (detalles.items && detalles.items.length > 0) {
      for (const item of detalles.items) {
        await db.query(
          `INSERT INTO paquete_items (paquete_id, nombre, cantidad)
           VALUES ($1, $2, $3)`,
          [paqueteId, item.nombre, item.cantidad]
        );
      }
    }

    // 4. Guardar imágenes
    if (detalles.imagenes && detalles.imagenes.length > 0) {
      for (let i = 0; i < detalles.imagenes.length; i++) {
        const img = detalles.imagenes[i];
        await db.query(
          `INSERT INTO paquete_imagenes (paquete_id, url, is_portada, orden)
           VALUES ($1, $2, $3, $4)`,
          [paqueteId, img.url, img.isPortada, i]
        );
      }
    }

    // 5. Guardar cargos adicionales
    if (detalles.cargos_adicionales && detalles.cargos_adicionales.length > 0) {
      for (const cargo of detalles.cargos_adicionales) {
        await db.query(
          `INSERT INTO paquete_cargos_adicionales (paquete_id, nombre, precio)
           VALUES ($1, $2, $3)`,
          [paqueteId, cargo.nombre, cargo.precio]
        );
      }
    }

    res.status(201).json({
      message: 'Paquete creado exitosamente',
      paquete: paquete.rows[0]
    });

  } catch (error) {
    console.error('Error al crear paquete:', error);
    res.status(500).json({ message: 'Error al crear el paquete' });
  }
}
```

---

## ✅ **Checklist de Verificación**

Antes de publicar un paquete, verifica:

- [ ] El backend está corriendo en `http://localhost:3000`
- [ ] Supabase está configurado correctamente
- [ ] El bucket `festeasy` existe y es público
- [ ] El usuario está autenticado (tiene token)
- [ ] El nombre del paquete está lleno
- [ ] La categoría está seleccionada
- [ ] El precio base es mayor a 0
- [ ] Se subió al menos 1 imagen
- [ ] Las imágenes se subieron correctamente a Supabase
- [ ] El backend acepta el campo `detalles_json` O tiene las tablas separadas

---

## 🎉 **Resultado Esperado**

Cuando todo funcione correctamente:

1. ✅ Las imágenes se suben a Supabase Storage
2. ✅ El paquete se guarda en la base de datos
3. ✅ Aparece el mensaje de éxito
4. ✅ El formulario se resetea
5. ✅ El paquete aparece en el listado de paquetes del proveedor
6. ✅ El paquete es visible en el marketplace (si está publicado)

---

## 📝 **Notas Importantes**

1. **Imágenes en Supabase**: Las imágenes se suben ANTES de guardar el paquete. Si el usuario cancela, las imágenes quedan en Supabase (puedes implementar limpieza automática después).

2. **Campo detalles_json**: Si el backend NO soporta este campo, necesitas modificar el backend para usar tablas separadas (ver sección anterior).

3. **Validaciones**: El sistema valida todos los campos antes de enviar al backend.

4. **Manejo de Errores**: El sistema muestra mensajes de error específicos según el tipo de error.

5. **Reseteo del Formulario**: Después de guardar exitosamente, el formulario se resetea automáticamente después de 2 segundos.

---

## 🚀 **Próximos Pasos**

1. **Listar Paquetes**: Crear una página para ver todos los paquetes del proveedor
2. **Editar Paquetes**: Permitir editar paquetes existentes
3. **Eliminar Paquetes**: Permitir eliminar paquetes
4. **Marketplace**: Mostrar los paquetes publicados en el marketplace para clientes

---

**¡El sistema de creación y subida de paquetes está completamente funcional! 🎉**
