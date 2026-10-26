import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Paginado } from '@/types';

export function Paginacion<T>({ datos, nombre = 'registros' }: { datos: Paginado<T>; nombre?: string }) {
    if (datos.last_page <= 1) {
        return datos.total > 0 ? <p className="px-5 py-3 text-xs text-muted-foreground">{datos.total} {nombre}</p> : null;
    }

    const anterior = datos.links[0]?.url;
    const siguiente = datos.links[datos.links.length - 1]?.url;

    return (
        <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
            <span className="tabular">
                {datos.from}–{datos.to} de {datos.total} {nombre}
            </span>
            <div className="flex gap-1.5">
                <Button variant="outline" size="icon-sm" asChild={!!anterior} disabled={!anterior} aria-label="Página anterior">
                    {anterior ? (
                        <Link href={anterior} preserveScroll preserveState>
                            <ChevronLeft />
                        </Link>
                    ) : (
                        <ChevronLeft />
                    )}
                </Button>
                <Button variant="outline" size="icon-sm" asChild={!!siguiente} disabled={!siguiente} aria-label="Página siguiente">
                    {siguiente ? (
                        <Link href={siguiente} preserveScroll preserveState>
                            <ChevronRight />
                        </Link>
                    ) : (
                        <ChevronRight />
                    )}
                </Button>
            </div>
        </div>
    );
}
