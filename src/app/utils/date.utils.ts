/**
 * Utilidades para manejo de fechas en FestEasy
 * Zona horaria: América/Mérida (CST/CDT)
 */

/**
 * Verifica si hoy es el día del evento
 * Compara solo día, mes y año usando strings YYYY-MM-DD (ignora horas y minutos)
 * @param fechaServicio - Fecha del servicio en formato ISO string desde Supabase
 * @returns true si hoy es el día del evento, false en caso contrario
 */
export function esDiaDelEvento(fechaServicio: string): boolean {
    // Manejo de nulos/undefined
    if (!fechaServicio) {
        console.warn('⚠️ esDiaDelEvento: fecha_servicio está vacía');
        return false;
    }

    try {
        // Obtener fecha actual en formato YYYY-MM-DD (zona horaria local de Mérida)
        const hoy = new Date().toISOString().split('T')[0];

        // Convertir fecha del evento a formato YYYY-MM-DD
        // Esto maneja tanto '2026-01-22T10:00:00' como '2026-01-22'
        const fechaEvento = new Date(fechaServicio).toISOString().split('T')[0];

        // Comparación simple de strings
        const coinciden = hoy === fechaEvento;

        // 🔍 DEBUG: Log para verificar comparación
        console.log(`📅 esDiaDelEvento() - Hoy: ${hoy}, Evento: ${fechaEvento}, ¿Coinciden?: ${coinciden}`);

        return coinciden;
    } catch (error) {
        console.error('❌ Error en esDiaDelEvento:', error);
        return false;
    }
}

/**
 * Verifica si faltan exactamente 3 horas (o menos) para el evento
 * Útil para enviar notificaciones previas al cliente
 * @param fechaServicio - Fecha del servicio en formato ISO string
 * @returns true si faltan 3 horas o menos para el evento
 */
export function faltanTresHorasParaEvento(fechaServicio: string): boolean {
    if (!fechaServicio) return false;

    const ahora = new Date();
    const fechaEvento = new Date(fechaServicio);

    // Calcular diferencia en milisegundos
    const diferenciaMs = fechaEvento.getTime() - ahora.getTime();

    // Convertir a horas
    const horasRestantes = diferenciaMs / (1000 * 60 * 60);

    // Retorna true si faltan entre 0 y 3 horas
    return horasRestantes > 0 && horasRestantes <= 3;
}

/**
 * Verifica si la fecha del evento ya pasó
 * @param fechaServicio - Fecha del servicio en formato ISO string
 * @returns true si el evento ya pasó
 */
export function eventoYaPaso(fechaServicio: string): boolean {
    if (!fechaServicio) return false;

    const ahora = new Date();
    const fechaEvento = new Date(fechaServicio);

    return ahora.getTime() > fechaEvento.getTime();
}

/**
 * Formatea una fecha para mostrar al usuario
 * @param fechaServicio - Fecha en formato ISO string
 * @returns Fecha formateada: "25 de enero de 2026"
 */
export function formatearFechaEvento(fechaServicio: string): string {
    if (!fechaServicio) return 'Fecha no disponible';

    const fecha = new Date(fechaServicio);
    return fecha.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Obtiene el PIN del localStorage para un evento específico
 * @param solicitudId - ID de la solicitud
 * @returns PIN almacenado o null si no existe
 */
export function obtenerPinAlmacenado(solicitudId: string): string | null {
    try {
        const key = `pin_evento_${solicitudId}`;
        return localStorage.getItem(key);
    } catch (error) {
        console.warn('Error al obtener PIN del localStorage:', error);
        return null;
    }
}

/**
 * Guarda el PIN en localStorage para acceso offline
 * @param solicitudId - ID de la solicitud
 * @param pin - PIN de 4 dígitos
 */
export function guardarPinEnLocalStorage(solicitudId: string, pin: string): void {
    try {
        const key = `pin_evento_${solicitudId}`;
        localStorage.setItem(key, pin);
        console.log(`✅ PIN guardado en localStorage para evento ${solicitudId}`);
    } catch (error) {
        console.warn('Error al guardar PIN en localStorage:', error);
    }
}

/**
 * Limpia el PIN del localStorage después de que el evento terminó
 * @param solicitudId - ID de la solicitud
 */
export function limpiarPinAlmacenado(solicitudId: string): void {
    try {
        const key = `pin_evento_${solicitudId}`;
        localStorage.removeItem(key);
        console.log(`🗑️ PIN eliminado del localStorage para evento ${solicitudId}`);
    } catch (error) {
        console.warn('Error al limpiar PIN del localStorage:', error);
    }
}
