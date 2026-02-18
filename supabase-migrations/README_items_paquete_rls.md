# 🔧 Migración: Políticas RLS para items_paquete

## ⚠️ Problema que Resuelve

Si ves el error: **"new row violates row-level security policy for table items_paquete"** al crear o editar paquetes, necesitas ejecutar esta migración.

## 📋 ¿Qué hace esta migración?

Configura las políticas de seguridad (Row Level Security) en la tabla `items_paquete` para permitir que:
- Los proveedores puedan crear, editar y eliminar items de sus propios paquetes
- Los clientes puedan ver los items de paquetes publicados

---

## 🚀 Cómo Ejecutar la Migración

### Paso 1: Acceder a Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **FestEasy**

### Paso 2: Abrir el Editor SQL

1. En el menú lateral izquierdo, haz clic en **SQL Editor**
2. Haz clic en **New Query** para crear una nueva consulta

### Paso 3: Ejecutar la Migración

1. Abre el archivo: `supabase-migrations/20260218_items_paquete_rls.sql`
2. Copia **todo** el contenido del archivo
3. Pega el contenido en el SQL Editor de Supabase
4. Haz clic en **Run** (o presiona `Ctrl + Enter`) para ejecutar

### Paso 4: Verificar la Ejecución

Deberías ver un mensaje de éxito que indica que las políticas se crearon correctamente.

---

## ✅ Verificación

Después de ejecutar la migración, prueba lo siguiente:

1. Ve a la aplicación como proveedor
2. Crea o edita un paquete
3. Agrega algunos items (elementos incluidos)
4. Guarda el paquete

Si no aparece ningún error, ¡la migración fue exitosa! ✨

---

## 🔍 Políticas Creadas

Esta migración crea las siguientes políticas RLS:

1. **"Proveedores pueden ver sus items"**
   - Permite a los proveedores ver los items de sus propios paquetes

2. **"Proveedores pueden insertar items"**
   - Permite a los proveedores agregar items a sus paquetes

3. **"Proveedores pueden actualizar sus items"**
   - Permite a los proveedores editar items de sus paquetes

4. **"Proveedores pueden eliminar sus items"**
   - Permite a los proveedores eliminar items de sus paquetes

5. **"Todos pueden ver items de paquetes publicados"**
   - Permite a cualquier usuario ver items de paquetes publicados

---

## 🆘 Solución de Problemas

### Error: "relation items_paquete does not exist"

Si ves este error, la tabla `items_paquete` no existe en tu base de datos. Ejecuta primero el schema principal (`NEW_SCHEMA.sql` o `databae.sql`).

### Error de permisos

Si no puedes crear políticas, asegúrate de que estás usando el SQL Editor de Supabase con permisos de administrador.

---

## 📝 Notas Técnicas

- **Archivo de migración**: `supabase-migrations/20260218_items_paquete_rls.sql`
- **Fecha de creación**: 18 de febrero de 2026
- **Tablas afectadas**: `items_paquete`
- **Dependencias**: Requiere que las tablas `items_paquete` y `paquetes_proveedor` existan

---

## 🔄 Rollback (Deshacer)

Si necesitas deshacer esta migración (no recomendado), ejecuta:

```sql
DROP POLICY IF EXISTS "Proveedores pueden ver sus items" ON items_paquete;
DROP POLICY IF EXISTS "Proveedores pueden insertar items" ON items_paquete;
DROP POLICY IF EXISTS "Proveedores pueden actualizar sus items" ON items_paquete;
DROP POLICY IF EXISTS "Proveedores pueden eliminar sus items" ON items_paquete;
DROP POLICY IF EXISTS "Todos pueden ver items de paquetes publicados" ON items_paquete;
```

---

**¿Necesitas ayuda?** Consulta la [documentación de Supabase sobre RLS](https://supabase.com/docs/guides/auth/row-level-security)
