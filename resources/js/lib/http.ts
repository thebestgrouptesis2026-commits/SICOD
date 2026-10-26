import axios from 'axios';

/**
 * Cliente HTTP para las llamadas JSON del cotizador. Laravel deja el token
 * CSRF en la cookie XSRF-TOKEN y axios lo envia en cada peticion.
 */
export const http = axios.create({
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
});

export function mensajeDeError(error: unknown, porDefecto = 'No se pudo completar la operación. Inténtalo otra vez.'): string {
    if (axios.isAxiosError(error)) {
        const datos = error.response?.data as { mensaje?: string; message?: string; errors?: Record<string, string[]> } | undefined;
        if (error.response?.status === 429) return 'Hiciste muchas consultas seguidas. Espera un minuto y vuelve a intentarlo.';
        if (error.response?.status === 419) return 'La página estuvo abierta mucho tiempo. Recárgala para continuar.';
        if (datos?.mensaje) return datos.mensaje;
        if (datos?.errors) return Object.values(datos.errors)[0]?.[0] ?? porDefecto;
    }
    return porDefecto;
}
