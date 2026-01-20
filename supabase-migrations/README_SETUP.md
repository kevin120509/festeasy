# 🚀 Guía Rápida: Configuración de Base de Datos

## Tabla `disponibilidad_bloqueada`

Esta tabla almacena las fechas bloqueadas manualmente por los proveedores en su calendario.

---

## Paso 1: Acceder a Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **FestEasy**

---

## Paso 2: Abrir el Editor SQL

1. En el menú lateral, haz clic en **SQL Editor**
2. Haz clic en **New Query** para crear una nueva consulta

---

## Paso 3: Ejecutar la Migración

### Opción A: Copiar desde el archivo

1. Abre el archivo: [create_disponibilidad_bloqueada.sql](file:///c:/Users/pecha/Downloads/Integrador/FESTEASY/festeasy/supabase-migrations/create_disponibilidad_bloqueada.sql)
2. Copia **todo** el contenido (Ctrl+A, Ctrl+C)
3. Pega en el SQL Editor de Supabase
4. Haz clic en **Run** (o presiona Ctrl+Enter)

### Opción B: Copiar desde aquí

```sql
-- Crear la tabla principal
CREATE TABLE IF NOT EXISTS disponibilidad_bloqueada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha_bloqueada DATE NOT NULL,
  motivo TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_provider_date UNIQUE(proveedor_usuario_id, fecha_bloqueada)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_disponibilidad_bloqueada_proveedor 
  ON disponibilidad_bloqueada(proveedor_usuario_id);

CREATE INDEX IF NOT EXISTS idx_disponibilidad_bloqueada_fecha 
  ON disponibilidad_bloqueada(fecha_bloqueada);

CREATE INDEX IF NOT EXISTS idx_disponibilidad_bloqueada_proveedor_fecha 
  ON disponibilidad_bloqueada(proveedor_usuario_id, fecha_bloqueada);

-- Habilitar RLS
ALTER TABLE disponibilidad_bloqueada ENABLE ROW LEVEL SECURITY;

-- Política de seguridad
CREATE POLICY "Proveedores pueden gestionar sus fechas bloqueadas"
  ON disponibilidad_bloqueada
  FOR ALL
  USING (auth.uid() = proveedor_usuario_id)
  WITH CHECK (auth.uid() = proveedor_usuario_id);

-- Comentarios de documentación
COMMENT ON TABLE disponibilidad_bloqueada IS 'Almacena las fechas que los proveedores han bloqueado manualmente en su calendario';
COMMENT ON COLUMN disponibilidad_bloqueada.id IS 'Identificador único del bloqueo';
COMMENT ON COLUMN disponibilidad_bloqueada.proveedor_usuario_id IS 'ID del proveedor que bloqueó la fecha';
COMMENT ON COLUMN disponibilidad_bloqueada.fecha_bloqueada IS 'Fecha bloqueada (sin hora)';
COMMENT ON COLUMN disponibilidad_bloqueada.motivo IS 'Motivo opcional del bloqueo';
COMMENT ON COLUMN disponibilidad_bloqueada.creado_en IS 'Timestamp de creación del bloqueo';
```

---

## Paso 4: Verificar la Creación

### En el Table Editor

1. Ve a **Table Editor** en el menú lateral
2. Busca la tabla `disponibilidad_bloqueada`
3. Verifica que aparezca en la lista

### Verificar RLS (Row Level Security)

- La tabla debe tener un **ícono de escudo** 🛡️ que indica que RLS está habilitado
- Esto asegura que cada proveedor solo puede ver sus propios bloqueos

### Verificar Índices

En el SQL Editor, ejecuta:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'disponibilidad_bloqueada';
```

Deberías ver 4 índices:
- `disponibilidad_bloqueada_pkey` (clave primaria)
- `idx_disponibilidad_bloqueada_proveedor`
- `idx_disponibilidad_bloqueada_fecha`
- `idx_disponibilidad_bloqueada_proveedor_fecha`

---

## Paso 5: Probar la Tabla

### Insertar un bloqueo de prueba

```sql
-- Reemplaza 'TU_USER_ID' con tu ID de usuario real
INSERT INTO disponibilidad_bloqueada 
  (proveedor_usuario_id, fecha_bloqueada, motivo)
VALUES 
  ('TU_USER_ID', '2026-02-14', 'Día festivo - San Valentín');
```

### Consultar todos los bloqueos

```sql
SELECT * FROM disponibilidad_bloqueada 
ORDER BY fecha_bloqueada DESC;
```

### Eliminar el bloqueo de prueba

```sql
DELETE FROM disponibilidad_bloqueada 
WHERE motivo = 'Día festivo - San Valentín';
```

---

## ✅ ¡Listo!

Ahora puedes:
1. Iniciar tu aplicación Angular: `ng serve`
2. Navegar a la ruta del proveedor: `/proveedor/agenda`
3. Probar el componente de calendario

---

## 🔧 Solución de Problemas

### Error: "relation already exists"

**Causa**: La tabla ya fue creada anteriormente.

**Solución**: No hacer nada, la tabla ya existe. Para recrearla:
```sql
DROP TABLE IF EXISTS disponibilidad_bloqueada CASCADE;
-- Luego ejecuta de nuevo el script de creación
```

### Error: "permission denied"

**Causa**: No tienes permisos suficientes en Supabase.

**Solución**: Asegúrate de estar usando el rol de administrador del proyecto.

### La tabla no aparece en Table Editor

**Causa**: Puede que necesites refrescar la página.

**Solución**: Presiona F5 o recarga la página del dashboard.

---

## 📚 Recursos Adicionales

- [Documentación de Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/overview)
- [PostgreSQL Date Functions](https://www.postgresql.org/docs/current/functions-datetime.html)
