import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export type Moneda = 'USD' | 'PEN';

const usdFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd0Fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** US$ 40,960.00 */
export function usd(valor: number, decimales = true): string {
    return 'US$ ' + (decimales ? usdFmt : usd0Fmt).format(valor ?? 0);
}

/** S/ 141,230.08 */
export function soles(valor: number, decimales = true): string {
    return 'S/ ' + (decimales ? usdFmt : usd0Fmt).format(valor ?? 0);
}

/** Convierte dolares a la moneda pedida con el tipo de cambio dado. */
export function monto(valorUsd: number, moneda: Moneda, tipoCambio: number, decimales = true): string {
    return moneda === 'USD' ? usd(valorUsd, decimales) : soles(Math.round(valorUsd * tipoCambio * 100) / 100, decimales);
}

export function otraMoneda(valorUsd: number, moneda: Moneda, tipoCambio: number): string {
    return monto(valorUsd, moneda === 'USD' ? 'PEN' : 'USD', tipoCambio);
}

export function m2(valor: number, decimales = 2): string {
    return valor.toLocaleString('en-US', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }) + ' m²';
}

export function metros(valor: number): string {
    return valor.toFixed(2) + ' m';
}

export function minutos(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
    if (valor < 1) return Math.round(valor * 60) + ' s';
    if (valor < 60) return valor.toFixed(1) + ' min';
    return (valor / 60).toFixed(1) + ' h';
}

export function porcentaje(valor: number | null | undefined, decimales = 1): string {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—';
    return Number(valor).toFixed(decimales) + ' %';
}

export function fecha(iso: string | null | undefined, patron = "d 'de' MMM yyyy"): string {
    if (!iso) return '—';
    return format(parseISO(iso), patron, { locale: es });
}

export function fechaHora(iso: string | null | undefined): string {
    return fecha(iso, "d MMM yyyy, HH:mm");
}

export function hora(iso: string | null | undefined): string {
    return fecha(iso, 'HH:mm');
}

export function haceCuanto(iso: string | null | undefined): string {
    if (!iso) return '—';
    return formatDistanceToNowStrict(parseISO(iso), { locale: es, addSuffix: true });
}

export const ESTADO_LOTE: Record<string, string> = {
    disponible: 'Disponible',
    reservado: 'Separado',
    vendido: 'Vendido',
    bloqueado: 'Bloqueado',
};

export const ESTADO_VISITA: Record<string, string> = {
    agendada: 'Agendada',
    realizada: 'Realizada',
    cancelada: 'Cancelada',
    no_asistio: 'No asistió',
};

export const CANAL: Record<string, string> = {
    whatsapp: 'WhatsApp',
    llamada: 'Llamada',
    presencial: 'Presencial',
    facebook: 'Facebook',
    instagram: 'Instagram',
    web: 'Web',
    referido: 'Referido',
    otro: 'Otro',
};

export const ROL: Record<string, string> = {
    admin: 'Administrador',
    gerente: 'Gerente',
    asesor: 'Asesor',
};
