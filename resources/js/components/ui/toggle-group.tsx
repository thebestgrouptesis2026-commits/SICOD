import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Grupo de opciones excluyentes (plazos, moneda, forma de pago).
 * variante "segmento": control compacto de dos o tres opciones.
 * variante "chips": opciones sueltas, como los plazos en meses.
 */
function ToggleGroup({ className, variante = 'segmento', ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & { variante?: 'segmento' | 'chips' }) {
    return (
        <ToggleGroupPrimitive.Root
            data-slot="toggle-group"
            data-variante={variante}
            className={cn(
                'group/toggle',
                variante === 'segmento' ? 'inline-flex rounded-lg bg-muted p-[3px]' : 'flex flex-wrap gap-2',
                className,
            )}
            {...props}
        />
    );
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
    return (
        <ToggleGroupPrimitive.Item
            data-slot="toggle-group-item"
            className={cn(
                'inline-flex items-center justify-center gap-1.5 text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50',
                'group-data-[variante=segmento]/toggle:flex-1 group-data-[variante=segmento]/toggle:rounded-md group-data-[variante=segmento]/toggle:px-3 group-data-[variante=segmento]/toggle:py-1.5 group-data-[variante=segmento]/toggle:text-foreground/70 group-data-[variante=segmento]/toggle:data-[state=on]:bg-card group-data-[variante=segmento]/toggle:data-[state=on]:text-foreground group-data-[variante=segmento]/toggle:data-[state=on]:shadow-sm',
                'group-data-[variante=chips]/toggle:h-9 group-data-[variante=chips]/toggle:rounded-md group-data-[variante=chips]/toggle:border group-data-[variante=chips]/toggle:border-input group-data-[variante=chips]/toggle:bg-card group-data-[variante=chips]/toggle:px-3.5 group-data-[variante=chips]/toggle:text-foreground/75 group-data-[variante=chips]/toggle:hover:border-foreground/30 group-data-[variante=chips]/toggle:data-[state=on]:border-primary group-data-[variante=chips]/toggle:data-[state=on]:bg-primary group-data-[variante=chips]/toggle:data-[state=on]:text-primary-foreground',
                className,
            )}
            {...props}
        />
    );
}

export { ToggleGroup, ToggleGroupItem };
