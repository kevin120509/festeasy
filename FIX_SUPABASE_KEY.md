# ⚠️ ERROR: Invalid Compact JWS - Solución

## 🔴 Problema Detectado

El error "Invalid Compact JWS" indica que la clave de Supabase (`supabaseKey`) no es válida.

La clave actual en el environment es:
```
44602cc38581c73caee60072799897507f5fa02de0ae5167adc785db23cebefc
```

Esta clave NO es una clave JWT válida de Supabase.

---

## ✅ Solución: Obtener la Anon Key Correcta

### **Paso 1: Ir al Dashboard de Supabase**

1. Abre tu navegador
2. Ve a: https://app.supabase.com
3. Inicia sesión con tu cuenta

### **Paso 2: Seleccionar el Proyecto**

1. En la lista de proyectos, selecciona: `ghlosgnopdmrowiygxdm`
2. O busca el proyecto llamado "festeasy" o similar

### **Paso 3: Ir a Settings > API**

1. En el menú lateral izquierdo, haz clic en el ícono de **Settings** (⚙️)
2. En el submenú, haz clic en **API**

### **Paso 4: Copiar la Anon Key**

En la sección **Project API keys**, verás dos claves:

#### ✅ **anon / public** (Esta es la que necesitas)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoLm9zZ25vcGRtcm93aXlneGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzY0NzY4MDAsImV4cCI6MTk1MjA1MjgwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### ❌ **service_role** (NO uses esta)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoLm9zZ25vcGRtcm93aXlneGRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYzNjQ3NjgwMCwiZXhwIjoxOTUyMDUyODAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANTE**: 
- La **anon key** es segura para usar en el frontend
- La **service_role key** NUNCA debe usarse en el frontend (tiene permisos de administrador)

### **Paso 5: Actualizar los Archivos de Environment**

Una vez que tengas la **anon key** correcta, actualiza estos archivos:

#### **1. `src/environments/environment.development.ts`**
```typescript
export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000',
    supabaseUrl: 'https://ghlosgnopdmrowiygxdm.supabase.co',
    supabaseKey: 'PEGA_AQUI_TU_ANON_KEY'  // ← Reemplaza esto
};
```

#### **2. `src/environments/environment.ts`**
```typescript
export const environment = {
    production: true,
    apiUrl: 'http://localhost:3000',
    supabaseUrl: 'https://ghlosgnopdmrowiygxdm.supabase.co',
    supabaseKey: 'PEGA_AQUI_TU_ANON_KEY'  // ← Reemplaza esto
};
```

### **Paso 6: Reiniciar el Servidor de Desarrollo**

Después de actualizar las claves:

1. Detén el servidor de desarrollo (Ctrl + C en la terminal)
2. Vuelve a iniciarlo:
   ```bash
   ng serve
   ```

---

## 🔍 Cómo Identificar la Anon Key Correcta

La **anon key** de Supabase siempre:

✅ Empieza con: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.`
✅ Tiene 3 partes separadas por puntos (`.`)
✅ Es muy larga (más de 200 caracteres)
✅ Contiene la palabra `"role":"anon"` cuando la decodificas

La clave que tienes actualmente:
❌ `44602cc38581c73caee60072799897507f5fa02de0ae5167adc785db23cebefc`
❌ No empieza con `eyJ...`
❌ No tiene puntos
❌ Es muy corta
❌ NO es una clave JWT válida

---

## 🧪 Verificar que la Clave es Correcta

Puedes verificar que la clave es correcta en: https://jwt.io

1. Ve a https://jwt.io
2. Pega tu anon key en el campo "Encoded"
3. En el lado derecho (Decoded), deberías ver algo como:

```json
{
  "iss": "supabase",
  "ref": "ghlosgnopdmrowiygxdm",
  "role": "anon",
  "iat": 1636476800,
  "exp": 1952052800
}
```

Si ves `"role": "anon"`, ¡la clave es correcta! ✅

---

## 📸 Captura de Pantalla de Referencia

La sección en Supabase Dashboard se ve así:

```
Settings > API

Project URL
https://ghlosgnopdmrowiygxdm.supabase.co

Project API keys

anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoLm9zZ25vcGRtcm93aXlneGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzY0NzY4MDAsImV4cCI6MTk1MjA1MjgwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
[Copy] [Reveal]

service_role secret
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoLG9zZ25vcGRtcm93aXlneGRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYzNjQ3NjgwMCwiZXhwIjoxOTUyMDUyODAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
[Copy] [Reveal]
```

---

## ✅ Checklist de Solución

- [ ] Ir a Supabase Dashboard
- [ ] Seleccionar proyecto `ghlosgnopdmrowiygxdm`
- [ ] Ir a Settings > API
- [ ] Copiar la **anon / public** key (NO la service_role)
- [ ] Verificar que la clave empieza con `eyJ...`
- [ ] Actualizar `src/environments/environment.development.ts`
- [ ] Actualizar `src/environments/environment.ts`
- [ ] Reiniciar el servidor (`ng serve`)
- [ ] Probar subir una imagen nuevamente

---

## 🎯 Resultado Esperado

Después de actualizar la clave correcta:

✅ Las imágenes se subirán sin errores
✅ Verás el mensaje: "Imagen subida exitosamente"
✅ La imagen aparecerá en la galería
✅ No habrá errores en la consola

---

**¡Actualiza la anon key y el problema se resolverá!** 🚀
