import { Link, router, usePage } from '@inertiajs/react';
import { Download, Inbox, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { EstadoVisita } from '@/components/estado';
import { Paginacion } from '@/components/paginacion';
import { Vacio } from '@/components/vacio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMoneda } from '@/hooks/use-moneda';
import PanelLayout from '@/layouts/panel-layout';
import { CANAL, fechaHora, haceCuanto } from '@/lib/formato';
import type { FilaCotizacion, Paginado, SharedProps } from '@/types';

interface Props {
    cotizaciones: Paginado<FilaCotizacion>;
    filtros: { q?: string; visita?: string; asesor?: string; modalidad?: string };
    asesores: { id: number; nombre: string }[];
}

const TODOS = 'todos';

export default function Bandeja({ cotizaciones, filtros, asesores }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const { fmt } = useMoneda();
    const supervisor = auth.usuario?.rol !== 'asesor';
    const [q, setQ] = useState(filtros.q ?? '');
    const primera = useRef(true);

    const filtrar = (cambios: Partial<Props['filtros']>) => {
        const datos = { ...filtros, q, ...cambios };
        const limpio = Object.fromEntries(Object.entries(datos).filter(([, v]) => v && v !== TODOS));
        router.get('/panel/cotizaciones', limpio, { preserveState: true, preserveScroll: true, replace: true });
    };

    useEffect(() => {
        if (primera.current) {
            primera.current = false;
            return;
        }
        const t = setTimeout(() => filtrar({ q }), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    return (
        <PanelLayout
            titulo="Bandeja de leads"
            descripcion={
                supervisor
                    ? 'Todas las cotizaciones emitidas, desde la web y por los asesores.'
                    : 'Tus cotizaciones y los leads web que aún no tienen asesor.'
            }
            acciones={
                supervisor && (
                    <Button variant="outline" asChild>
                        <a href="/panel/metricas/exportar">
                            <Download /> Exportar CSV
                        </a>
                    </Button>
                )
            }
        >
            <Card className="gap-0 py-0">
                <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                    <div className="relative min-w-56 flex-1 sm:max-w-80">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cliente, DNI, código o lote" className="h-9 pl-9" aria-label="Buscar" />
                    </div>
                    <Select value={filtros.visita ?? TODOS} onValueChange={(v) => filtrar({ visita: v })}>
                        <SelectTrigger size="sm" aria-label="Visita">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Toda visita</SelectItem>
                            <SelectItem value="sin_visita">Sin visita</SelectItem>
                            <SelectItem value="agendada">Agendada</SelectItem>
                            <SelectItem value="realizada">Realizada</SelectItem>
                            <SelectItem value="no_asistio">No asistió</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filtros.modalidad ?? TODOS} onValueChange={(v) => filtrar({ modalidad: v })}>
                        <SelectTrigger size="sm" aria-label="Forma de pago">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TODOS}>Toda forma de pago</SelectItem>
                            <SelectItem value="financiado">Financiado</SelectItem>
                            <SelectItem value="contado">Contado</SelectItem>
                        </SelectContent>
                    </Select>
                    {supervisor && (
                        <Select value={filtros.asesor ?? TODOS} onValueChange={(v) => filtrar({ asesor: v })}>
                            <SelectTrigger size="sm" aria-label="Asesor">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TODOS}>Todos los asesores</SelectItem>
                                <SelectItem value="ninguno">Sin asesor (web)</SelectItem>
                                {asesores.map((a) => (
                                    <SelectItem key={a.id} value={String(a.id)}>
                                        {a.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {cotizaciones.data.length === 0 ? (
                    <Vacio icono={Inbox} titulo="No hay cotizaciones con esos filtros">
                        Prueba con otro nombre, DNI o estado de visita.
                    </Vacio>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Lote</TableHead>
                                <TableHead>Condición</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead>Visita</TableHead>
                                <TableHead>Asesor</TableHead>
                                <TableHead>Emitida</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cotizaciones.data.map((c) => (
                                <TableRow key={c.id} className="cursor-pointer" onClick={() => router.visit(`/panel/cotizaciones/${c.id}`)}>
                                    <TableCell>
                                        <Link href={`/panel/cotizaciones/${c.id}`} className="font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
                                            {c.cliente_nombre}
                                        </Link>
                                        <span className="block text-xs text-muted-foreground tabular">
                                            {c.codigo} · Doc. {c.cliente_documento_mascara}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {c.lote}
                                        <span className="block text-xs text-muted-foreground">{CANAL[c.canal] ?? c.canal}</span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">{c.modalidad_pago === 'contado' ? 'Contado' : `${c.plazo_meses} meses`}</TableCell>
                                    <TableCell className="cifra text-right whitespace-nowrap">
                                        {c.modalidad_pago === 'contado' ? fmt(c.precio_final, true, c.tipo_cambio) : `${fmt(c.cuota_mensual, true, c.tipo_cambio)}/mes`}
                                    </TableCell>
                                    <TableCell>
                                        <EstadoVisita estado={c.visita?.estado} />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {c.asesor ?? <Badge variant="warn">Sin asesor</Badge>}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground" title={fechaHora(c.emitida_at)}>
                                        {haceCuanto(c.emitida_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                <Paginacion datos={cotizaciones} nombre="cotizaciones" />
            </Card>
        </PanelLayout>
    );
}
