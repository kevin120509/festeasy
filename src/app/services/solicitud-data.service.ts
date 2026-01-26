import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SolicitudDataService {
    private supabaseService = inject(SupabaseService);
    private api = inject(ApiService);

    // BehaviorSubject para el carrito
    private carrito = new BehaviorSubject<any[]>([]);

    // Observable para que los componentes se suscriban
    carrito$ = this.carrito.asObservable();

    constructor() {
        // Cargar el carrito desde localStorage al iniciar el servicio
        const carritoGuardado = localStorage.getItem('carrito');
        if (carritoGuardado) {
            this.carrito.next(JSON.parse(carritoGuardado));
        }
    }

    agregarAlCarrito(solicitud: any): boolean {
        const carritoActual = this.carrito.getValue();

        // Evitar duplicados por proveedor + fecha (mismo proveedor, misma fecha de servicio)
        const yaExiste = carritoActual.some(item =>
            item.proveedor?.usuario_id === solicitud?.proveedor?.usuario_id &&
            item.evento?.fecha === solicitud?.evento?.fecha
        );

        if (yaExiste) {
            return false;
        }

        const nuevoCarrito = [...carritoActual, solicitud];
        this.carrito.next(nuevoCarrito);
        this.actualizarLocalStorage(nuevoCarrito);
        return true;
    }

    getCarrito() {
        return this.carrito$;
    }

    getCarritoValue() {
        return this.carrito.getValue();
    }

    removerDelCarrito(id: number) {
        const carritoActual = this.carrito.getValue();
        const nuevoCarrito = carritoActual.filter(item => item.id !== id);
        this.carrito.next(nuevoCarrito);
        this.actualizarLocalStorage(nuevoCarrito);
    }

    removerPorProveedor(proveedorId: string) {
        const carritoActual = this.carrito.getValue();
        const nuevoCarrito = carritoActual.filter(item => item.proveedor?.usuario_id !== proveedorId);
        this.carrito.next(nuevoCarrito);
        this.actualizarLocalStorage(nuevoCarrito);
    }

    limpiarCarrito() {
        this.carrito.next([]);
        this.actualizarLocalStorage([]);
    }

    private actualizarLocalStorage(carrito: any[]) {
        localStorage.setItem('carrito', JSON.stringify(carrito));
    }

    async enviarSolicitud(item: any, user: any): Promise<string> {
        const { evento, proveedor, paquetes, total } = item;

        const solicitudPayload = {
            cliente_usuario_id: user.id,
            proveedor_usuario_id: proveedor.usuario_id,
            fecha_servicio: evento.fecha,
            direccion_servicio: evento.ubicacion,
            titulo_evento: evento.titulo,
            monto_total: total,
            estado: 'pendiente_aprobacion',
            latitud_servicio: 0,
            longitud_servicio: 0
        };

        const solicitud = await firstValueFrom(this.api.createRequest(solicitudPayload));
        if (!solicitud?.id) throw new Error('No se pudo crear la solicitud (sin id).');

        const itemsPayload = paquetes.map((pkg: any) => ({
            solicitud_id: solicitud.id,
            paquete_id: pkg.id,
            nombre_paquete_snapshot: pkg.nombre,
            cantidad: pkg.cantidad,
            precio_unitario: pkg.precio_base
        }));

        await firstValueFrom(this.api.createSolicitudItems(itemsPayload));
        return solicitud.id;
    }

    // Guarda la solicitud y los items en la base de datos
    guardarSolicitudCompleta(solicitud: any, proveedor: any, paquetes: any[]): Observable<any> {
        // 1. Insertar en solicitudes
        const supabase = this.supabaseService.getClient();
        return from(
            supabase.from('solicitudes').insert({
                cliente_usuario_id: solicitud.cliente_usuario_id,
                proveedor_usuario_id: proveedor.usuario_id,
                fecha_servicio: solicitud.fecha_servicio,
                direccion_servicio: solicitud.ubicacion,
                titulo_evento: solicitud.titulo_evento || 'Evento',
                estado: 'pendiente_aprobacion',
                creado_en: new Date().toISOString(),
                actualizado_en: new Date().toISOString()
            }).select().single()
        ).pipe(
            // 2. Insertar en items_solicitud usando el id de la solicitud creada
            // (esto se haría en el subscribe del componente de revisión)
            // Aquí, para simplificar, solo devolvemos la solicitud creada
            // Pero ahora insertamos los items_solicitud
            // Usamos switchMap para encadenar la inserción
            switchMap((solicitudCreada: any) => {
                if (!solicitudCreada || !solicitudCreada.id) return [solicitudCreada];
                const items = paquetes.map((p: any) => ({
                    solicitud_id: solicitudCreada.id,
                    paquete_id: p.id,
                    nombre_paquete_snapshot: p.nombre,
                    cantidad: p.cantidad || 1,
                    precio_unitario: p.precio_base
                }));
                if (items.length === 0) return [solicitudCreada];
                return from(supabase.from('items_solicitud').insert(items)).pipe(
                    map(() => solicitudCreada)
                );
            })
        );
    }
}
