import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import type { SharedProps } from '@/types';

/** Muestra como notificacion los mensajes que el servidor deja en la sesion. */
export function Avisos() {
    const { flash } = usePage<SharedProps>().props;

    useEffect(() => {
        if (flash?.exito) toast.success(flash.exito);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.exito, flash?.error]);

    return null;
}
