// Enumeraciones
export enum SolicitudEstado {
    PENDIENTE_APROBACION = 'pendiente_aprobacion',
    EN_NEGOCIACION = 'en_negociacion',
    ESPERANDO_CONFIRMACION_CLIENTE = 'esperando_confirmacion_cliente',
    RECHAZADA = 'rechazada',
    ESPERANDO_ANTICIPO = 'esperando_anticipo',
    RESERVADO = 'reservado',
    EN_PROGRESO = 'en_progreso',
    ENTREGADO_PENDIENTE_LIQ = 'entregado_pendiente_liq',
    FINALIZADO = 'finalizado',
    CANCELADA = 'cancelada',
    ABANDONADA = 'abandonada'
}

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
    tipo_suscripcion_actual: 'festeasy' | 'libre';
    categoria_principal_id?: string;
    creado_en: string;
    actualizado_en: string;
    correo_electronico?: string;
    estado?: 'active' | 'blocked';
    datos_bancarios_json?: any;
    precio_base?: number; // Added property
    addons?: string[]; // Added property for active addons
    suscripcion_activa?: boolean; // simple indicator of paid status
    politicas_url?: string;
    porcentaje_anticipo?: number;
    ajustes_entrega_json?: DeliverySettings;
    // contrasena is not included in the frontend model
}

export interface DeliverySettings {
    requiere_foto?: boolean;
    requiere_firma_proveedor?: boolean;
    requiere_firma_cliente?: boolean;
    requiere_pin?: boolean;
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
    estado: 'pendiente_aprobacion' | 'en_negociacion' | 'esperando_confirmacion_cliente' | 'rechazada' | 'esperando_anticipo' | 'reservado' | 'en_progreso' | 'entregado_pendiente_liq' | 'finalizado' | 'cancelada' | 'abandonada';
    creado_en: string;
    actualizado_en: string;
    monto_total?: number;
    monto_anticipo?: number;
    monto_liquidacion?: number;
    link_pago_anticipo?: string;
    link_pago_liquidacion?: string;
    expiracion_negociacion?: string;
    expiracion_anticipo?: string;
    pin_validado_en?: string;
    pin_validacion?: string;
    fecha_validacion_pin?: string | Date;
    // Campos de evidencia
    evidencia_foto_url?: string;
    evidencia_firma_url?: string;
    evidencia_latitud?: number;
    evidencia_longitud?: number;
    finalizado_en?: string | Date;
    // Campos de negociación y cotización
    expiracion_negociacion?: string;
    cotizacion_borrador?: CotizacionBorrador;
    // Campos para cancelaciones
    cancelado_por_id?: string;
    motivo_cancelacion?: string;
    fecha_cancelacion?: string | Date;
    provider?: ProviderProfile; // Joined data
    cliente?: ClientProfile; // Joined data
    items?: RequestItem[]; // Joined data
    presupuesto_max?: number;
    horas_respuesta_max?: number;
    es_urgente?: boolean;
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
    plan: 'festeasy' | 'libre';
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
    cliente_id: string;
    destinatario_id: string;
    calificacion: number;
    comentario?: string;
    creado_en: string;
}

// Web Builder & Addons
export interface Addon {
    id: string;
    name: string;
    price: number;
    code: string;
    created_at: string;
}

export interface ProviderAddon {
    id: string;
    provider_id: string;
    addon_code: string;
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
}

export interface ProviderPublicPage {
    id: string;
    provider_id: string;
    slug: string;
    slogan?: string;
    description?: string;
    hero_image?: string;
    hero_alignment: 'left' | 'center' | 'right';
    contact_phone?: string;
    contact_email?: string;
    contact_whatsapp?: string;
    gallery?: any[];
    instagram_url?: string;
    facebook_url?: string;
    tiktok_url?: string;
    twitter_url?: string;
    primary_color?: string;
    accent_color?: string;
    hero_overlay_color?: string;
    hero_overlay_opacity?: number;
    theme?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

// Package Variants (qualitative options defined by provider)
export interface PackageVariantOption {
    label: string;          // e.g. "Azul", "Rock", "Round"
    precio_extra: number;   // Additional cost for this option (0 if no extra cost)
}

export interface PackageVariant {
    nombre: string;                    // e.g. "Color de silla", "Género musical"
    tipo: 'seleccion_unica' | 'seleccion_multiple' | 'texto_libre';
    requerida: boolean;                // Must the client choose?
    item_asociado?: string;            // nombre_item del PackageItem (undefined = variante general)
    opciones: PackageVariantOption[];  // Available options (empty if tipo = 'texto_libre')
}

// Chat Messages
export interface MensajeSolicitud {
    id: string;
    solicitud_id: string;
    emisor_usuario_id: string;
    mensaje: string;
    leido: boolean;
    creado_en: string;
}

// Cotización Borrador (stored in solicitudes.cotizacion_borrador jsonb)
export interface DesglosePaqueteBase {
    paquete_id: string;
    nombre: string;
    precio_base: number;
    cantidad: number;
    variantes_seleccionadas?: { nombre: string; opcion: string; precio_extra: number }[];
}

export interface DesgloseProducto {
    producto_id?: string;       // null if manually added
    nombre: string;
    precio_unitario: number;
    cantidad: number;
    subtotal: number;
}

export interface DesgloseAjuste {
    concepto: string;
    tipo: 'cargo' | 'descuento';
    monto: number;
}

export interface CotizacionBorrador {
    paquete_base: DesglosePaqueteBase;
    productos_extra: DesgloseProducto[];
    ajustes_proveedor: DesgloseAjuste[];
    subtotal: number;
    descuento_total: number;
    monto_total: number;
    anticipo_tipo: 'porcentaje' | 'monto_fijo';
    anticipo_valor: number;
    monto_anticipo: number;
    monto_liquidacion: number;
    notas_proveedor?: string;
}

// Inventory
export interface Producto {
    id: string;
    proveedor_id: string;
    nombre: string;
    categoria?: string;
    descripcion?: string;
    precio_unitario: number;
    stock: number;
    imagen_url?: string;
    destacado: boolean;
    creado_en: string;
    actualizado_en: string;
}