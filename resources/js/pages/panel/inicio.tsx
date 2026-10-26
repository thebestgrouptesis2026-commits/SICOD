import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarDays, FilePlus, Inbox } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { EstadoVisita } from '@/components/estado';
import { Vacio } from '@/components/vacio';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMoneda } from '@/hooks/use-moneda';
import PanelLayout from '@/layouts/panel-layout';
import { CANAL, fecha, fechaHora, haceCuanto, minutos, porcentaje } from '@/lib/formato';
import { cn } from '@/lib/utils';
import type { FilaCotizacion, FilaVisita, SharedProps } from '@/types';

interface Props {
    resumen: {
        atenciones: number;
        tiempo_promedio: number;
        pct_cumplimiento: number;
        tasa_conversion: number;
        cotizaciones_hoy: number;
        leads_sin_asesor: number;
    };
    recientes: FilaCotizacion[];
    visitas: FilaVisita[];
    disponibilidad: { proyecto: string; total_lotes: number; disponibles: number; reservados: number; vendidos: number; bloqueados: number }[];
    serie: { fecha: string; atenciones: number }[];
}

function ultimos14(serie: Props['serie']) {
    const mapa = new Map(serie.map((s) => [s.fecha, Number(s.atenciones)]));
    return Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return { fecha: clave, dia: String(d.getDate()), atenciones: mapa.get(clave) ?? 0 };
    });
}

export default function Inicio({ resumen, recientes, visitas, disponibilidad, serie }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const { fmt } = useMoneda();
    const supervisor = auth.usuario?.rol !== 'asesor';
    const datos = ultimos14(serie);

    return (
        <PanelLayout
            titulo={`Hola, ${auth.usuario?.nombres.split(' ')[0]}`}
            descripcion={supervisor ? 'Resumen de toda la cartera comercial con SICOD (postest).' : 'Tus atenciones con SICOD y lo que tienes pendiente.'}
            acciones={
                <Button asChild>
                    <Link href="/panel/cotizar">
                        <FilePlus /> Nueva cotización
                    </Link>
                </Button>
            }
        >
            <div className="grid gap-6">
                <dl className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card md:grid-cols-4">
                    {[
                        ['Tiempo promedio de atención', minutos(resumen.tiempo_promedio), resumen.tiempo_promedio <= 30 ? 'dentro de la meta de 30 min' : 'por encima de la meta de 30 min', resumen.tiempo_promedio <= 30],
                        ['Atenciones dentro de 30 min', porcentaje(resumen.pct_cumplimiento), `${resumen.atenciones} atenciones medidas`, resumen.pct_cumplimiento >= 80],
                        ['Conversión a visita', porcentaje(resumen.tasa_conversion), 'atenciones que agendaron visita', null],
                        ['Cotizaciones de hoy', String(resumen.cotizaciones_hoy), fecha(new Date().toISOString(), "EEEE d 'de' MMMM"), null],
                    ].map(([titulo, valor, nota, bueno], i) => (
                        <div key={String(titulo)} className={cn('px-5 py-4', i % 2 === 1 && 'border-l', i > 1 && 'border-t md:border-t-0', i === 2 && 'md:border-l')}>
                            <dt className="text-[13px] text-muted-foreground">{titulo}</dt>
                            <dd className="cifra mt-1 text-[28px] leading-none font-extrabold">{valor}</dd>
                            <p className={cn('mt-1.5 text-xs', bueno === true ? 'text-ok' : bueno === false ? 'text-bad' : 'text-muted-foreground')}>{nota}</p>
                        </div>
                    ))}
                </dl>

                {resumen.leads_sin_asesor > 0 && (
                    <Link
                        href="/panel/cotizaciones?asesor=ninguno"
                        className="flex items-center justify-between gap-4 rounded-xl border border-warn/40 bg-warn-soft px-5 py-3.5 text-sm transition-colors hover:border-warn"
                    >
                        <span>
                            <b className="cifra">{resumen.leads_sin_asesor}</b> cotizaciones web de los últimos 30 días esperan un asesor. Tómalas para hacer el seguimiento.
                        </span>
                        <ArrowRight className="size-4 shrink-0" />
                    </Link>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Atenciones cerradas</CardTitle>
                            <CardDescription>Últimos 14 días, con cotización emitida</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={{ atenciones: { label: 'Atenciones', color: 'var(--chart-1)' } }} className="aspect-auto h-56">
                                <BarChart data={datos} margin={{ left: -18, right: 4, top: 8 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent formatoEtiqueta={(l) => `Día ${l}`} />} />
                                    <Bar dataKey="atenciones" fill="var(--color-atenciones)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Próximas visitas</CardTitle>
                            <CardAction>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/panel/visitas">Ver todas</Link>
                                </Button>
                            </CardAction>
                        </CardHeader>
                        <CardContent className="grid gap-1">
                            {visitas.length === 0 ? (
                                <Vacio icono={CalendarDays} titulo="Sin visitas pendientes">Las visitas que agenden los clientes aparecerán aquí.</Vacio>
                            ) : (
                                visitas.map((v) => (
                                    <div key={v.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted">
                                        <div className="w-12 shrink-0 text-center">
                                            <p className="text-[11px] text-muted-foreground uppercase">{fecha(v.programada_para, 'MMM')}</p>
                                            <p className="cifra text-xl leading-none font-extrabold">{fecha(v.programada_para, 'd')}</p>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">{v.cliente}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {fecha(v.programada_para, 'HH:mm')} · Lote {v.lote}
                                            </p>
                                        </div>
                                        <EstadoVisita estado={v.estado} />
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="gap-0 pb-0">
                    <CardHeader className="pb-4">
                        <CardTitle>Últimas cotizaciones</CardTitle>
                        <CardAction>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/panel/cotizaciones">
                                    Bandeja completa <ArrowRight />
                                </Link>
                            </Button>
                        </CardAction>
                    </CardHeader>
                    {recientes.length === 0 ? (
                        <Vacio icono={Inbox} titulo="Aún no hay cotizaciones">Cuando un cliente cotice desde la web o tú emitas una, aparecerá aquí.</Vacio>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Condición</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead>Canal</TableHead>
                                    <TableHead>Emitida</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recientes.map((c) => (
                                    <TableRow key={c.id} className="cursor-pointer" onClick={() => router.visit(`/panel/cotizaciones/${c.id}`)}>
                                        <TableCell>
                                            <Link href={`/panel/cotizaciones/${c.id}`} className="font-semibold hover:underline">
                                                {c.cliente_nombre}
                                            </Link>
                                            <span className="block text-xs text-muted-foreground">{c.codigo}</span>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{c.lote}</TableCell>
                                        <TableCell className="whitespace-nowrap">{c.modalidad_pago === 'contado' ? 'Contado' : `${c.plazo_meses} meses`}</TableCell>
                                        <TableCell className="cifra text-right whitespace-nowrap">
                                            {c.modalidad_pago === 'contado' ? fmt(c.precio_final, true, c.tipo_cambio) : `${fmt(c.cuota_mensual, true, c.tipo_cambio)}/mes`}
                                        </TableCell>
                                        <TableCell>{CANAL[c.canal] ?? c.canal}</TableCell>
                                        <TableCell className="whitespace-nowrap text-muted-foreground" title={fechaHora(c.emitida_at)}>
                                            {haceCuanto(c.emitida_at)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>

                {supervisor && disponibilidad.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventario</CardTitle>
                            <CardDescription>Estado de los lotes por proyecto</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5">
                            {disponibilidad.map((d) => {
                                const total = Number(d.total_lotes) || 1;
                                const partes = [
                                    ['Disponibles', Number(d.disponibles), 'bg-ok'],
                                    ['Separados', Number(d.reservados), 'bg-warn'],
                                    ['Vendidos', Number(d.vendidos), 'bg-bad'],
                                    ['Bloqueados', Number(d.bloqueados), 'bg-lock'],
                                ] as const;
                                return (
                                    <div key={d.proyecto} className="grid gap-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-semibold">{d.proyecto}</span>
                                            <span className="text-muted-foreground">{d.total_lotes} lotes</span>
                                        </div>
                                        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                                            {partes.map(([k, n, c]) => n > 0 && <div key={k} className={c} style={{ width: `${(n / total) * 100}%` }} />)}
                                        </div>
                                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                                            {partes.map(([k, n, c]) => (
                                                <span key={k} className="inline-flex items-center gap-1.5">
                                                    <span className={cn('size-2 rounded-full', c)} />
                                                    <b className="cifra text-foreground">{n}</b> {k.toLowerCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}
            </div>
        </PanelLayout>
    );
}
