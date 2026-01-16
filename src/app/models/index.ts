export interface User {
    id: string;
    correo_electronico: string;
    // Password is not returned usually
    rol: 'client' | 'provider' | 'admin';
    estado: 'active' | 'blocked';
    creado_en: string; // ISO Date
    actualizado_en: string;
}

export interface ClientProfile {
    id: string;
    usuario_id: string;
    nombre_completo: string;
    telefono?: string;
    avatar_url?: string;
    creado_en: string;
}

export interface ProviderProfile {
    id: string;
    usuario_id: string;
    nombre_negocio: string;
    descripcion?: string;
    telefono?: string;
    avatar_url?: string;
    direccion_formato?: string;
    latitud?: number;
    longitud?: number;
    radio_cobertura_km?: number;
    tipo_suscripcion_actual?: 'basico' | 'plus';
    categoria_principal_id?: string;
    creado_en: string;
    actualizado_en: string;
}

export interface Cart {
    id: string;
    cliente_usuario_id: string;
    fecha_servicio_deseada?: string;
    direccion_servicio?: string;
    latitud_servicio?: number;
    longitud_servicio?: number;
    estado: 'activo' | 'abandonado' | 'convertido';
    creado_en: string;
    actualizado_en: string;
    items?: CartItem[];
}

export interface CartItem {
    id: string;
    carrito_id: string;
    paquete_id: string;
    cantidad: number;
    precio_unitario_momento: number;
    creado_en: string;
    paquete?: ProviderPackage; // Joined data
}

export interface ServiceRequest { // 'Solicitud'
    id: string;
    numero_solicitud: number;
    cliente_usuario_id: string;
    proveedor_usuario_id: string;
    fecha_servicio: string;
    direccion_servicio: string;
    latitud_servicio?: number;
    longitud_servicio?: number;
    titulo_evento?: string;
    estado: 'pendiente_aprobacion' | 'negociacion' | 'aceptada' | 'rechazada' | 'completada' | 'cancelada';
    creado_en: string;
    actualizado_en: string;
}

export interface Quote { // 'Cotización'
    id: string;
    solicitud_id: string;
    proveedor_usuario_id: string;
    precio_total_propuesto: number;
    desglose_json?: any;
    notas?: string;
    estado: 'pendiente' | 'aceptada_cliente' | 'rechazada_cliente';
    creado_en: string;
}

export interface Payment {
    id: string;
    cotizacion_id: string;
    cliente_usuario_id: string;
    proveedor_usuario_id: string;
    monto: number;
    metodo_pago: 'transferencia' | 'efectivo' | 'deposito_oxxo';
    comprobante_url?: string;
    estado: 'esperando_comprobante' | 'en_revision' | 'aprobado' | 'rechazado';
    motivo_rechazo?: string;
    creado_en: string;
    actualizado_en: string;
}

export interface ProviderPackage {
    id: string;
    proveedor_usuario_id: string;
    categoria_servicio_id?: string;
    nombre: string;
    descripcion?: string;
    precio_base: number;
    estado: 'borrador' | 'publicado' | 'archivado';
    creado_en: string;
    actualizado_en: string;
    proveedor?: ProviderProfile; // Joined data
}

export interface AuthResponse {
    token: string;
    user: User;
}
