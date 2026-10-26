import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import type { Moneda } from '@/lib/formato';
import { monto, otraMoneda } from '@/lib/formato';
import type { SharedProps } from '@/types';

const CLAVE = 'sicod-moneda';
const EVENTO = 'sicod-moneda';

/**
 * Moneda preferida para mostrar precios (dolares o soles). Se recuerda en
 * el navegador y se sincroniza entre los componentes de la pagina.
 */
export function useMoneda() {
    const { moneda } = usePage<SharedProps>().props;
    const [actual, setActual] = useState<Moneda>(() => {
        try {
            return (localStorage.getItem(CLAVE) as Moneda) || 'USD';
        } catch {
            return 'USD';
        }
    });

    useEffect(() => {
        const alCambiar = (e: Event) => setActual((e as CustomEvent<Moneda>).detail);
        window.addEventListener(EVENTO, alCambiar);
        return () => window.removeEventListener(EVENTO, alCambiar);
    }, []);

    const cambiar = useCallback((m: Moneda) => {
        try {
            localStorage.setItem(CLAVE, m);
        } catch {
            /* sin almacenamiento */
        }
        window.dispatchEvent(new CustomEvent(EVENTO, { detail: m }));
    }, []);

    const tc = moneda?.tipo_cambio ?? 1;

    return {
        moneda: actual,
        cambiar,
        tipoCambio: tc,
        fechaTipoCambio: moneda?.fecha ?? null,
        fmt: (usd: number, decimales = true, tipoCambio = tc) => monto(usd, actual, tipoCambio, decimales),
        fmtOtra: (usd: number, tipoCambio = tc) => otraMoneda(usd, actual, tipoCambio),
    };
}
