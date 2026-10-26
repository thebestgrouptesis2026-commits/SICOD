import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

export function Vacio({ icono: Icono, titulo, children }: { icono: LucideIcon; titulo: string; children?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-3 grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
                <Icono className="size-5" />
            </span>
            <h3 className="text-base font-bold">{titulo}</h3>
            {children && <div className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>}
        </div>
    );
}
