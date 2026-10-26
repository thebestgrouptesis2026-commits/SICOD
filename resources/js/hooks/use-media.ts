import { useEffect, useState } from 'react';

export function useMedia(consulta: string) {
    const [coincide, setCoincide] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches);

    useEffect(() => {
        const media = window.matchMedia(consulta);
        const alCambiar = () => setCoincide(media.matches);
        alCambiar();
        media.addEventListener('change', alCambiar);
        return () => media.removeEventListener('change', alCambiar);
    }, [consulta]);

    return coincide;
}
