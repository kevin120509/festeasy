import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SolicitudDataService {
    private supabaseService = inject(SupabaseService);
    private api = inject(ApiService);

    // BehaviorSubject para el carrito
    private carrito = new BehaviorSubject<any[]>([]);
    eventoActual = signal<any>(null);
    paquetesSeleccionados = signal<any[]>([]);
    proveedorActual = signal<any>(null);

    // Observable para que los componentes se suscriban
    carrito$ = this.carrito.asObservable();

    constructor() {
        // Cargar el carrito desde localStorage al iniciar el servicio
        const carritoGuardado = localStorage.getItem('carrito');
        if (carritoGuardado) {
            this.carrito.next(JSON.parse(carritoGuardado));
        }

        this.cargarBorrador();
    }

    private cargarBorrador() {
        // Cargar evento actual
        const ev = localStorage.getItem('eventoActual') || sessionStorage.getItem('eventoActual');
        if (ev) try { this.eventoActual.set(JSON.parse(ev)); } catch (e) { }

        // Cargar paquetes seleccionados
        const pkgs = localStorage.getItem('paquetesSeleccionados') || sessionStorage.getItem('paquetesSeleccionados');
        if (pkgs) try { this.paquetesSeleccionados.set(JSON.parse(pkgs)); } catch (e) { }

        // Cargar proveedor actual
        const prov = localStorage.getItem('proveedorActual') || sessionStorage.getItem('proveedorActual');
        if (prov) try { this.proveedorActual.set(JSON.parse(prov)); } catch (e) { }
    }

    setEventoActual(data: any) {
        this.eventoActual.set(data);
        localStorage.setItem('eventoActual', JSON.stringify(data));
        sessionStorage.setItem('eventoActual', JSON.stringify(data));
    }

    setPaquetesSeleccionados(pkgs: any[]) {
        this.paquetesSeleccionados.set(pkgs);
        localStorage.setItem('paquetesSeleccionados', JSON.stringify(pkgs));
        sessionStorage.setItem('paquetesSeleccionados', JSON.stringify(pkgs));
    }

    setProveedorActual(prov: any) {
        this.proveedorActual.set(prov);
        localStorage.setItem('proveedorActual', JSON.stringify(prov));
        sessionStorage.setItem('proveedorActual', JSON.stringify(prov));
    }

    getEventoActual() { return this.eventoActual(); }
    getPaquetesSeleccionados() { return this.paquetesSeleccionados(); }
    getProveedorActual() { return this.proveedorActual(); }

    limpiarBorrador() {
        this.eventoActual.set(null);
        this.paquetesSeleccionados.set([]);
        this.proveedorActual.set(null);
        ['eventoActual', 'paquetesSeleccionados', 'proveedorActual'].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
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
        // Unificar payload para usar lógica centralizada de ApiService
        const solicitudPayload = {
            proveedor_usuario_id: proveedor.usuario_id,
            fecha_servicio: solicitud.fecha_servicio,
            direccion_servicio: solicitud.ubicacion,
            titulo_evento: solicitud.titulo_evento || 'Evento',
            monto_total: solicitud.monto_total,
            estado: 'pendiente_aprobacion'
        };

        return this.api.createRequest(solicitudPayload).pipe(
            switchMap((solicitudCreada: any) => {
                if (!solicitudCreada || !solicitudCreada.id) return of(solicitudCreada);

                const items = paquetes.map((p: any) => ({
                    solicitud_id: solicitudCreada.id,
                    paquete_id: p.id,
                    nombre_paquete_snapshot: p.nombre,
                    cantidad: p.cantidad || 1,
                    precio_unitario: p.precio_base
                }));

                if (items.length === 0) return of(solicitudCreada);

                // Reutilizamos el método centralizado de API para items
                return this.api.createSolicitudItems(items).pipe(
                    map(() => solicitudCreada)
                );
            })
        );
    }
}
