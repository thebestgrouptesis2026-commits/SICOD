import { cn } from '@/lib/utils';

/** Isotipo: cuatro lotes de una manzana; el ultimo, por vender. */
export function Isotipo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" className={cn('size-8 shrink-0', className)} aria-hidden="true">
            <rect width="32" height="32" rx="7" className="fill-primary" />
            <path d="M8 8h7v7H8zM17 8h7v7h-7zM8 17h7v7H8z" className="fill-primary-foreground" />
            <path d="M17.8 17.8h5.4v5.4h-5.4z" fill="none" className="stroke-primary-foreground" strokeWidth="1.6" />
        </svg>
    );
}

export function Marca({ subtitulo = true, className }: { subtitulo?: boolean; className?: string }) {
    return (
        <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
            <Isotipo />
            <span className="min-w-0 leading-tight">
                <span className="block font-display text-[17px] font-extrabold tracking-wide [font-stretch:118%]">SICOD</span>
                {subtitulo && <span className="block truncate text-xs text-muted-foreground">Inmobiliaria Constructora Taipe</span>}
            </span>
        </span>
    );
}
