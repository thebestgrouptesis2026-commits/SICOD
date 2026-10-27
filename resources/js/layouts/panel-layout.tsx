import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChartColumnBig,
    FilePlus,
    House,
    Inbox,
    KeyRound,
    LayoutGrid,
    LogOut,
    Menu,
    ScrollText,
    Settings2,
    ShieldCheck,
    Timer,
    Users,
    type LucideIcon,
} from 'lucide-react';
import * as React from 'react';

import { Avisos } from '@/components/avisos';
import { Marca } from '@/components/marca';
import { SelectorMoneda } from '@/components/selector-moneda';
import { SelectorTema } from '@/components/tema';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ROL } from '@/lib/formato';
import { cn } from '@/lib/utils';
import type { Rol, SharedProps } from '@/types';

interface Enlace {
    titulo: string;
    href: string;
    icono: LucideIcon;
    roles?: Rol[];
}

const GRUPOS: { titulo: string; enlaces: Enlace[] }[] = [
    {
        titulo: 'Comercial',
        enlaces: [
            { titulo: 'Inicio', href: '/panel', icono: House },
            { titulo: 'Cotizar', href: '/panel/cotizar', icono: FilePlus },
            { titulo: 'Bandeja de leads', href: '/panel/cotizaciones', icono: Inbox },
            { titulo: 'Visitas', href: '/panel/visitas', icono: CalendarDays },
            { titulo: 'Lotes', href: '/panel/lotes', icono: LayoutGrid },
        ],
    },
    {
        titulo: 'Gerencia',
        enlaces: [
            { titulo: 'Indicadores', href: '/panel/metricas', icono: ChartColumnBig, roles: ['admin', 'gerente'] },
            { titulo: 'Parámetros', href: '/admin/parametros', icono: Settings2, roles: ['admin', 'gerente'] },
            { titulo: 'Registro pretest', href: '/admin/pretest', icono: Timer, roles: ['admin', 'gerente'] },
        ],
    },
    {
        titulo: 'Administración',
        enlaces: [
            { titulo: 'Usuarios', href: '/admin/usuarios', icono: Users, roles: ['admin'] },
            { titulo: 'Seguridad', href: '/admin/auditoria', icono: ShieldCheck, roles: ['admin'] },
        ],
    },
];

function activo(url: string, href: string) {
    const ruta = url.split('?')[0];
    return href === '/panel' ? ruta === '/panel' : ruta === href || ruta.startsWith(href + '/');
}

function Navegacion({ alNavegar }: { alNavegar?: () => void }) {
    const { url, props } = usePage<SharedProps>();
    const rol = props.auth.usuario?.rol;

    return (
        <nav className="grid gap-5" aria-label="Menú del panel">
            {GRUPOS.map((g) => {
                const enlaces = g.enlaces.filter((e) => !e.roles || (rol && e.roles.includes(rol)));
                if (!enlaces.length) return null;
                return (
                    <div key={g.titulo} className="grid gap-0.5">
                        <p className="etiqueta px-3 pb-1.5 text-[11px] text-muted-foreground">{g.titulo}</p>
                        {enlaces.map((e) => {
                            const esActivo = activo(url, e.href);
                            return (
                                <Link
                                    key={e.href}
                                    href={e.href}
                                    onClick={alNavegar}
                                    prefetch
                                    aria-current={esActivo ? 'page' : undefined}
                                    className={cn(
                                        'relative flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                        esActivo &&
                                            'bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:inset-y-2 before:-left-3 before:w-1 before:rounded-r-full before:bg-primary',
                                    )}
                                >
                                    <e.icono className={cn('size-4', esActivo ? 'text-primary' : 'text-muted-foreground')} />
                                    {e.titulo}
                                </Link>
                            );
                        })}
                    </div>
                );
            })}
        </nav>
    );
}

function MenuUsuario() {
    const { auth } = usePage<SharedProps>().props;
    const u = auth.usuario;
    if (!u) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                    <Avatar>
                        <AvatarFallback>{u.iniciales}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 leading-tight">
                        <span className="block truncate text-sm font-semibold">
                            {u.nombres.split(' ')[0]} {u.apellidos.split(' ')[0]}
                        </span>
                        <span className="block text-xs text-muted-foreground">{ROL[u.rol]}</span>
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <span className="block text-sm font-semibold">{u.nombres} {u.apellidos}</span>
                    <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/cuenta/password">
                        <KeyRound /> Cambiar contraseña
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href="/" target="_blank" rel="noopener">
                        <ScrollText /> Ver cotizador público
                    </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.post('/salir')}>
                    <LogOut /> Cerrar sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function PanelLayout({
    titulo,
    descripcion,
    acciones,
    children,
}: {
    titulo: string;
    descripcion?: React.ReactNode;
    acciones?: React.ReactNode;
    children: React.ReactNode;
}) {
    const [abierto, setAbierto] = React.useState(false);

    return (
        <TooltipProvider>
            <Head title={titulo} />
            <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
                <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-sidebar px-3 py-4 lg:flex">
                    <Link href="/panel" className="px-1.5">
                        <Marca />
                    </Link>
                    <div className="flex-1 overflow-y-auto">
                        <Navegacion />
                    </div>
                    <div className="grid gap-1 border-t pt-3">
                        <MenuUsuario />
                    </div>
                </aside>

                <div className="flex min-w-0 flex-col">
                    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-sm sm:px-6">
                        <Sheet open={abierto} onOpenChange={setAbierto}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Abrir menú">
                                    <Menu />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="gap-6 bg-sidebar px-3 py-4">
                                <SheetTitle className="px-1.5">
                                    <Marca />
                                </SheetTitle>
                                <div className="flex-1 overflow-y-auto">
                                    <Navegacion alNavegar={() => setAbierto(false)} />
                                </div>
                                <div className="border-t pt-3">
                                    <MenuUsuario />
                                </div>
                            </SheetContent>
                        </Sheet>
                        <span className="truncate text-sm font-semibold lg:hidden">{titulo}</span>
                        <div className="ml-auto flex items-center gap-2">
                            <SelectorMoneda />
                            <SelectorTema />
                        </div>
                    </header>

                    <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 pt-7 pb-16 sm:px-6 lg:px-8 lg:pt-9">
                        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-[26px] leading-tight font-extrabold sm:text-[28px]">{titulo}</h1>
                                {descripcion && <p className="mt-1 max-w-[70ch] text-[15px] text-muted-foreground">{descripcion}</p>}
                            </div>
                            {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
                        </div>
                        {children}
                    </main>
                </div>
            </div>
            <Avisos />
            <Toaster />
        </TooltipProvider>
    );
}
