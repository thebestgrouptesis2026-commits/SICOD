import { Head, Link } from '@inertiajs/react';

import { Marca } from '@/components/marca';
import { Button } from '@/components/ui/button';

const MENSAJES: Record<number, [string, string]> = {
    403: ['No tienes acceso a esta sección', 'Tu cuenta no tiene permisos para ver esta página. Si crees que es un error, habla con el administrador.'],
    404: ['No encontramos esta página', 'El enlace puede estar mal escrito o la proforma ya no existe.'],
    419: ['La página caducó', 'Estuvo abierta mucho tiempo sin actividad. Recárgala e inténtalo otra vez.'],
    429: ['Demasiadas solicitudes', 'Hiciste muchas solicitudes seguidas. Espera un minuto y vuelve a intentarlo.'],
    500: ['Algo falló de nuestro lado', 'Ya quedó registrado. Inténtalo de nuevo en unos minutos.'],
    503: ['Estamos en mantenimiento', 'Volvemos en unos minutos.'],
};

export default function PaginaError({ estado }: { estado: number }) {
    const [titulo, texto] = MENSAJES[estado] ?? MENSAJES[500];

    return (
        <>
            <Head title={titulo} />
            <div className="flex min-h-dvh flex-col px-6 py-6 sm:px-10">
                <Marca />
                <div className="mx-auto flex max-w-md flex-1 flex-col justify-center py-16">
                    <p className="cifra text-6xl font-extrabold text-primary">{estado}</p>
                    <h1 className="mt-3 text-[28px] leading-tight font-extrabold">{titulo}</h1>
                    <p className="mt-2 text-muted-foreground">{texto}</p>
                    <div className="mt-6 flex gap-2">
                        <Button asChild>
                            <Link href="/">Ir al plano de lotes</Link>
                        </Button>
                        <Button variant="outline" onClick={() => window.history.back()}>
                            Volver
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
