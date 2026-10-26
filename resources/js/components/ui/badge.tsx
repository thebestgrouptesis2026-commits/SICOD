import { cva, type VariantProps } from 'class-variance-authority';
import { Slot as SlotPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                outline: 'text-foreground',
                ok: 'border-transparent bg-ok-soft text-ok',
                warn: 'border-transparent bg-warn-soft text-warn',
                bad: 'border-transparent bg-bad-soft text-bad',
                lock: 'border-transparent bg-lock-soft text-lock',
                muted: 'border-transparent bg-muted text-muted-foreground',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? SlotPrimitive.Slot : 'span';
    return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
