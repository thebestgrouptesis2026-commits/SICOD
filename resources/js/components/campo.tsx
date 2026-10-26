import * as React from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Etiqueta + control + mensaje de error o ayuda, con los ids enlazados. */
export function Campo({
    id,
    etiqueta,
    error,
    ayuda,
    className,
    sinClonar = false,
    children,
}: {
    id: string;
    etiqueta: React.ReactNode;
    error?: string;
    ayuda?: React.ReactNode;
    className?: string;
    /** El control ya trae su propio id (por ejemplo, un input con prefijo). */
    sinClonar?: boolean;
    children: React.ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>;
}) {
    const descripcion = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;

    return (
        <div className={cn('grid gap-1.5', className)}>
            <Label htmlFor={id}>{etiqueta}</Label>
            {sinClonar ? children : React.cloneElement(children, { id, 'aria-invalid': !!error || undefined, 'aria-describedby': descripcion })}
            {error ? (
                <p id={`${id}-error`} className="text-[13px] text-destructive">{error}</p>
            ) : ayuda ? (
                <p id={`${id}-ayuda`} className="text-[13px] text-muted-foreground">{ayuda}</p>
            ) : null}
        </div>
    );
}
