# 🔴 Error 500 al Registrar Proveedor - Diagnóstico y Solución

## 📋 Problema Detectado

Error 500 (Internal Server Error) al intentar registrar un proveedor.

---

## 🔍 Posibles Causas

### **1. La tabla `perfil_proveedor` no existe en la base de datos**

El backend está intentando insertar en una tabla que no existe.

**Verificar:**
```sql
-- Conectarse a la base de datos y ejecutar:
SELECT * FROM information_schema.tables 
WHERE table_name = 'perfil_proveedor';
```

**Si no existe, crear la tabla:**
```sql
CREATE TABLE perfil_proveedor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_negocio VARCHAR(255) NOT NULL,
    descripcion TEXT,
    telefono VARCHAR(20),
    avatar_url TEXT,
    direccion_formato TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    radio_cobertura_km INTEGER DEFAULT 10,
    tipo_suscripcion_actual VARCHAR(20) DEFAULT 'basico',
    categoria_principal_id UUID REFERENCES categorias_servicio(id),
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- Índices
CREATE INDEX idx_perfil_proveedor_usuario ON perfil_proveedor(usuario_id);
CREATE INDEX idx_perfil_proveedor_categoria ON perfil_proveedor(categoria_principal_id);
```

---

### **2. El campo `usuario_id` no se está enviando correctamente**

El código actual envía:
```typescript
usuario_id: loginResponse.user.id
```

**Verificar:**
- Que `loginResponse.user.id` existe y es un UUID válido
- Que el backend espera este campo

---

### **3. Falta la tabla `usuarios`**

El backend necesita la tabla de usuarios para el registro.

**Verificar:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'usuarios';
```

**Si no existe, crear la tabla:**
```sql
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correo_electronico VARCHAR(255) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('client', 'provider')),
    verificado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_usuarios_email ON usuarios(correo_electronico);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
```

---

### **4. El backend no está configurado correctamente**

**Verificar en el backend:**

1. **Que el servidor esté corriendo:**
   ```bash
   # En la carpeta del backend
   npm start
   # o
   node server.js
   ```

2. **Que el endpoint exista:**
   ```javascript
   // En el backend, debe existir:
   POST /auth/register
   POST /auth/login
   POST /perfil-proveedor
   ```

3. **Que la conexión a la base de datos funcione:**
   ```javascript
   // Verificar en el backend que la conexión a PostgreSQL esté activa
   ```

---

### **5. Error en el endpoint del backend**

**Revisar los logs del backend:**

1. Abre la terminal donde está corriendo el backend
2. Busca el error específico cuando intentas registrarte
3. El error debería mostrar algo como:
   ```
   Error: relation "perfil_proveedor" does not exist
   ```
   o
   ```
   Error: column "usuario_id" does not exist
   ```

---

## ✅ Solución Paso a Paso

### **Paso 1: Verificar que el Backend Esté Corriendo**

```bash
# En la carpeta del backend
cd backend
npm start
```

Deberías ver algo como:
```
Server running on port 3000
Database connected successfully
```

---

### **Paso 2: Verificar las Tablas en la Base de Datos**

Conectarse a PostgreSQL y ejecutar:

```sql
-- Ver todas las tablas
\dt

-- Debería mostrar:
-- usuarios
-- perfil_cliente
-- perfil_proveedor
-- categorias_servicio
-- paquetes_proveedor
-- etc.
```

---

### **Paso 3: Crear las Tablas Faltantes**

Si faltan tablas, ejecutar los scripts SQL de arriba.

---

### **Paso 4: Verificar el Endpoint en el Backend**

**Archivo: `backend/controllers/authController.js` (o similar)**

Debe tener:
```javascript
async register(req, res) {
    const { correo_electronico, contrasena, rol } = req.body;
    
    try {
        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        
        // Insertar usuario
        const result = await db.query(
            `INSERT INTO usuarios (correo_electronico, contrasena_hash, rol)
             VALUES ($1, $2, $3)
             RETURNING id, correo_electronico, rol`,
            [correo_electronico, hashedPassword, rol]
        );
        
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
}
```

**Archivo: `backend/controllers/providerController.js` (o similar)**

Debe tener:
```javascript
async createProviderProfile(req, res) {
    const { usuario_id, nombre_negocio, descripcion, direccion_formato } = req.body;
    
    try {
        const result = await db.query(
            `INSERT INTO perfil_proveedor 
             (usuario_id, nombre_negocio, descripcion, direccion_formato)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [usuario_id, nombre_negocio, descripcion, direccion_formato]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear perfil de proveedor:', error);
        res.status(500).json({ message: 'Error al crear perfil' });
    }
}
```

---

### **Paso 5: Probar el Registro Nuevamente**

1. Asegúrate de que el backend esté corriendo
2. Asegúrate de que las tablas existan
3. Intenta registrarte nuevamente
4. Revisa los logs del backend para ver el error específico

---

## 🐛 Debugging en el Frontend

Abre la consola del navegador (F12) y verifica:

```javascript
// Deberías ver:
Provider Registration error details: {
    status: 500,
    statusText: "Internal Server Error",
    error: {
        message: "Error específico del backend"
    }
}
```

---

## 📝 Checklist de Verificación

- [ ] Backend está corriendo en `http://localhost:3000`
- [ ] Base de datos PostgreSQL está corriendo
- [ ] Tabla `usuarios` existe
- [ ] Tabla `perfil_proveedor` existe
- [ ] Endpoint `POST /auth/register` existe en el backend
- [ ] Endpoint `POST /auth/login` existe en el backend
- [ ] Endpoint `POST /perfil-proveedor` existe en el backend
- [ ] La conexión a la base de datos funciona
- [ ] Los logs del backend muestran el error específico

---

## 🔧 Solución Rápida (Si el Backend No Está Configurado)

Si el backend no está configurado, necesitas:

1. **Crear el proyecto del backend** (Node.js + Express + PostgreSQL)
2. **Configurar la conexión a la base de datos**
3. **Crear las tablas necesarias**
4. **Implementar los endpoints de autenticación y perfil**

¿Necesitas ayuda para configurar el backend desde cero?

---

## 📞 Próximos Pasos

1. **Revisa los logs del backend** cuando intentas registrarte
2. **Copia el error específico** que aparece en los logs
3. **Compártelo** para que pueda ayudarte a solucionarlo

El error 500 siempre viene del backend, así que necesitamos ver qué está fallando allí.
