import { useCallback, useEffect, useState } from 'react';

export type Tema = 'claro' | 'oscuro' | 'sistema';

function leer(): Tema {
    try {
        return (localStorage.getItem('sicod-tema') as Tema) || 'sistema';
    } catch {
        return 'sistema';
    }
}

function aplicar(tema: Tema) {
    const oscuro = tema === 'oscuro' || (tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', oscuro);
    return oscuro;
}

export function useTema() {
    const [tema, setTemaEstado] = useState<Tema>(() => (typeof window === 'undefined' ? 'sistema' : leer()));
    const [oscuro, setOscuro] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

    useEffect(() => {
        setOscuro(aplicar(tema));
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const alCambiar = () => tema === 'sistema' && setOscuro(aplicar('sistema'));
        media.addEventListener('change', alCambiar);
        return () => media.removeEventListener('change', alCambiar);
    }, [tema]);

    const setTema = useCallback((t: Tema) => {
        try {
            localStorage.setItem('sicod-tema', t);
        } catch {
            /* almacenamiento bloqueado: el tema dura la sesion */
        }
        setTemaEstado(t);
    }, []);

    return { tema, setTema, oscuro };
}
