export type Rol = 'admin' | 'gerente' | 'asesor';

export interface Usuario {
    id: number;
    nombres: string;
    apellidos: string;
    email: string;
    rol: Rol;
    iniciales: string;
}

export interface SharedProps {
    app: { nombre: string; empresa: string };
    auth: { usuario: Usuario | null };
    moneda: { tipo_cambio: number; fecha: string | null };
    flash: { exito: string | null; error: string | null };
    errors: Record<string, string>;
    [key: string]: unknown;
}

export interface Proyecto {
    id: number;
    nombre: string;
    ubicacion: string | null;
    distrito: string | null;
    provincia: string | null;
    moneda: string;
    precio_m2_interior: number;
    precio_m2_esquina: number;
    telefono: string | null;
    whatsapp: string | null;
}

export type EstadoLote = 'disponible' | 'reservado' | 'vendido' | 'bloqueado';

export interface Lote {
    id: number;
    lote: string;
    manzana_id: number;
    manzana_codigo: string;
    manzana: string;
    frente_m: number;
    fondo_m: number;
    area_m2: number;
    precio_m2: number;
    precio: number;
    estado: EstadoLote;
    esquina: boolean;
    observacion: string | null;
    geometria: { points?: string } | null;
    orden: number;
}

export interface Reglas {
    plazos: number[];
    plazo_defecto: number;
    plazo_maximo: number;
    descuento_contado_pct: number;
    tasa_anual_pct: number;
    dias_validez: number;
}

export interface Resumen {
    total_lotes: number;
    disponibles: number;
    reservados: number;
    vendidos: number;
    bloqueados: number;
}

export interface Calculo {
    modalidad_pago: 'contado' | 'financiado';
    tipo_cambio: number;
    precio_m2: number;
    precio_lista: number;
    descuento_pct: number;
    descuento_monto: number;
    precio_final: number;
    plazo_meses: number;
    tasa_anual_pct: number;
    cuota_mensual: number;
    total_financiado: number;
    soles: { precio_lista: number; descuento_monto: number; precio_final: number; cuota_mensual: number; total_financiado: number };
}

export interface Paginado<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface FilaCotizacion {
    id: number;
    codigo: string;
    cliente_nombre: string;
    cliente_documento_mascara: string;
    canal: string;
    lote: string | null;
    manzana: string | null;
    modalidad_pago: 'contado' | 'financiado';
    plazo_meses: number;
    cuota_mensual: number;
    precio_final: number;
    tipo_cambio: number;
    emitida_at: string;
    asesor: string | null;
    asesor_id: number | null;
    visita: { estado: string; programada_para: string } | null;
}

export interface FilaVisita {
    id: number;
    estado: string;
    programada_para: string;
    notas: string | null;
    cliente: string | null;
    telefono: string | null;
    lote: string | null;
    cotizacion_id: number | null;
    cotizacion: string | null;
    asesor: string | null;
    puede_editar: boolean;
}
