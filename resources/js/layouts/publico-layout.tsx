import { Head, Link, usePage } from '@inertiajs/react';
import { LogIn } from 'lucide-react';
import * as React from 'react';

import { Avisos } from '@/components/avisos';
import { Marca } from '@/components/marca';
import { SelectorMoneda } from '@/components/selector-moneda';
import { SelectorTema } from '@/components/tema';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { fecha } from '@/lib/formato';
import type { SharedProps } from '@/types';

export default function PublicoLayout({ titulo, children }: { titulo?: string; children: React.ReactNode }) {
    const { auth, moneda } = usePage<SharedProps>().props;

    return (
        <TooltipProvider>
            <Head title={titulo} />
            <div className="flex min-h-dvh flex-col">
                <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur-sm">
                    <div className="mx-auto flex h-16 max-w-[1360px] items-center gap-3 px-4 sm:px-6">
                        <Link href="/" aria-label="Inicio">
                            <Marca />
                        </Link>
                        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                            <SelectorMoneda />
                            <SelectorTema />
                            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                                <Link href={auth.usuario ? '/panel' : '/ingresar'}>
                                    <LogIn />
                                    {auth.usuario ? 'Ir al panel' : 'Acceso asesores'}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="flex-1">{children}</main>

                <footer className="border-t bg-card">
                    <div className="mx-auto grid max-w-[1360px] gap-3 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-[1fr_auto] sm:px-6">
                        <div>
                            <p className="font-semibold text-foreground">Inmobiliaria Constructora Taipe S.A.C.</p>
                            <p>RUC 20502902637 · Habilitación urbana y venta de lotes en Lima</p>
                        </div>
                        <p className="sm:text-right">
                            Precios de lista en dólares americanos.
                            <br />
                            Tipo de cambio referencial S/ {moneda.tipo_cambio.toFixed(3)}
                            {moneda.fecha ? ` (${fecha(moneda.fecha)})` : ''}.
                        </p>
                    </div>
                </footer>
            </div>
            <Avisos />
            <Toaster />
        </TooltipProvider>
    );
}
