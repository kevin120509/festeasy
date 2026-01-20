export class VerificacionFechaService {
    verificarFecha(fecha: Date): boolean {
        const hoy = new Date();
        return fecha >= hoy;
    }
}