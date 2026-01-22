// User and Profiles
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
    usuario_id?: string;
    nombre_negocio: string;
    descripcion?: string;
    telefono?: string;
    avatar_url?: string;
    direccion_formato?: string;
    latitud?: number;
    longitud?: number;
    radio_cobertura_km?: number;
    tipo_suscripcion_actual: 'basico' | 'plus';
    categoria_principal_id?: string;
    creado_en: string;
    actualizado_en: string;
    correo_electronico?: string;
    estado?: 'active' | 'blocked';
    datos_bancarios_json?: any;
    precio_base?: number; // Added property
    // contrasena is not included in the frontend model
}

// Categories
export interface EventCategory {
    id: string;
    nombre: string;
    icono?: string;
}

export interface ServiceCategory {
    id: string;
    nombre: string;
    descripcion?: string;
    icono?: string;
    activa: boolean;
}

// Packages and Items
export interface ProviderPackage {
    id: string;
    proveedor_usuario_id: string;
    categoria_servicio_id: string;
    nombre: string;
    descripcion?: string;
    precio_base: number;
    estado: 'borrador' | 'publicado' | 'archivado';
    creado_en: string;
    actualizado_en: string;
    detalles_json?: any;
    proveedor?: ProviderProfile; // Joined data
}

export interface PackageItem {
    id: string;
    paquete_id: string;
    nombre_item: string;
    cantidad: number;
    unidad?: string;
    creado_en: string;
}

// Cart
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

// Service Request (Solicitud)
export interface ServiceRequest {
    id: string;
    numero_solicitud: number;
    cliente_usuario_id: string;
    proveedor_usuario_id: string;
    fecha_servicio: string;
    direccion_servicio: string;
    latitud_servicio?: number;
    longitud_servicio?: number;
    titulo_evento?: string;
    estado: 'pendiente_aprobacion' | 'rechazada' | 'esperando_anticipo' | 'reservado' | 'en_progreso' | 'entregado_pendiente_liq' | 'finalizado' | 'cancelada' | 'abandonada';
    creado_en: string;
    actualizado_en: string;
    monto_total?: number;
    monto_anticipo?: number;
    monto_liquidacion?: number;
    link_pago_anticipo?: string;
    link_pago_liquidacion?: string;
    expiracion_anticipo?: string;
    pin_seguridad?: string;
    pin_validado_en?: string;
    pin_validacion?: string;
    fecha_validacion_pin?: string | Date;
    provider?: ProviderProfile; // Joined data
    client?: ClientProfile; // Joined data
    items?: RequestItem[]; // Joined data
    presupuesto_max?: number;
}

export interface RequestItem {
    id: string;
    solicitud_id: string;
    paquete_id?: string;
    nombre_paquete_snapshot: string;
    cantidad: number;
    precio_unitario: number;
}

// Quote (Cotización)
export interface Quote {
    id: string;
    solicitud_id: string;
    proveedor_usuario_id: string;
    precio_total_propuesto: number;
    desglose_json?: any;
    notas?: string;
    estado: 'pendiente' | 'aceptada_cliente' | 'rechazada_cliente';
    creado_en: string;
}

// Payments and Subscriptions
export interface Payment {
    id: string;
    cotizacion_id?: string;
    cliente_usuario_id: string;
    proveedor_usuario_id: string;
    monto: number;
    metodo_pago: 'transferencia' | 'efectivo' | 'deposito_oxxo';
    comprobante_url?: string;
    estado: 'esperando_comprobante' | 'en_revision' | 'aprobado' | 'rechazado';
    motivo_rechazo?: string;
    creado_en: string;
    actualizado_en: string;
    solicitud_id?: string;
    id_transaccion_externa?: string;
    tipo_pago?: 'anticipo' | 'liquidacion';
}

export interface SubscriptionHistory {
    id: string;
    proveedor_usuario_id: string;
    plan: 'basico' | 'plus';
    monto_pagado: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado_pago: 'pagado' | 'pendiente' | 'fallido';
    metodo_pago?: string;
    referencia_transaccion?: string;
    creado_en: string;
}

// Other
export interface CalendarBlock {
    id: string;
    proveedor_usuario_id: string;
    fecha_bloqueada: string; // Date string YYYY-MM-DD
    motivo?: string;
    creado_en: string;
}

export interface Review {
    id: string;
    solicitud_id: string;
    autor_id: string;
    destinatario_id: string;
    calificacion: number;
    comentario?: string;
    creado_en: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}