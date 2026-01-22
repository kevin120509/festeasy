PROMPT PARA ANTIGRAVITY
Contexto y Rol
Actúa como un Arquitecto de Software Senior especializado en Angular (última versión) y diseño de lógica de negocio para aplicaciones de servicios con agenda. El proyecto es una aplicación de servicios donde clientes agendan citas con proveedores. Se utiliza Angular con services para manejar la lógica de calendario y validaciones. El archivo principal a modificar es calendario-fecha.services.ts.

Consulta / Tarea
Implementar y mejorar la lógica de agenda y validación de fechas dentro del archivo calendario-fecha.services.ts, agregando reglas de negocio, validaciones de seguridad y control de disponibilidad del proveedor.

Especificaciones
1. Agenda y Bloqueo de Fechas:
- Conectar el servicio de calendario a la base de datos.
- Permitir que el proveedor bloquee fechas específicas.
- Al consultar disponibilidad, validar si la fecha seleccionada está bloqueada por el proveedor.
- Si la fecha está bloqueada, retornar un error indicando que el proveedor no está disponible.

2. Validación de Fechas Pasadas:
- Validar que el cliente no pueda seleccionar ni agendar fechas anteriores a la fecha actual.
- Usar data.day para validar la fecha seleccionada.
- Si la fecha es anterior a hoy, retornar un mensaje de error claro para el cliente.

3. Regla de 24 Horas (SLA):
- Calcular la diferencia entre la fecha actual y la fecha solicitada.
- Si la cita se solicita con menos de 24 horas de anticipación:
  - Establecer un tiempo máximo de respuesta del proveedor de 3 horas.
- Si es mayor a 24 horas, aplicar el flujo normal.
- Guardar esta información como parte del objeto de la cita.

4. Gestión de Citas Vencidas:
- Detectar cuando la fecha del servicio ya pasó.
- Mover automáticamente las citas vencidas al estado “finalizada”.
- Evitar que citas pasadas permanezcan activas en la agenda.

5. Estados de la Cita:
- Manejar correctamente los estados: pendiente, confirmada, en_proceso, finalizada, cancelada.

Criterios de Calidad
- Código limpio, claro y bien estructurado.
- Funciones separadas por responsabilidad.
- Uso correcto de Date y validaciones de tiempo.
- Mensajes de error comprensibles para el usuario.
- El service no debe contener lógica de UI, solo lógica de negocio.

Cómo debe ser la respuesta
- Generar el código actualizado de calendario-fecha.services.ts.
- Explicar brevemente cada función agregada o modificada.
- No inventar endpoints ni estructuras inexistentes; usar placeholders si es necesario.
- Mantener coherencia con una arquitectura Angular basada en services.

Verificación
- Confirmar que no se pueden agendar fechas pasadas.
- Confirmar que fechas bloqueadas por el proveedor no están disponibles.
- Confirmar que la regla de menos de 24 horas aplica el tiempo de respuesta de 3 horas.
- Confirmar que las citas pasadas se mueven a estado finalizada automáticamente.

✅ Qué hace bien este prompt

✔ No mezcla UI con lógica
✔ Está alineado a services
✔ Antigravity entiende qué tocar y qué no
✔ Define reglas de negocio claras
✔ Evita respuestas genéricas