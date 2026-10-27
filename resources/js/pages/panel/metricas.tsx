import { Download } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PanelLayout from '@/layouts/panel-layout';
import { CANAL, fecha, minutos, porcentaje } from '@/lib/formato';
import { cn } from '@/lib/utils';

type PorFase<T> = Partial<Record<'pretest' | 'postest', T>>;

interface Props {
    tiempo: PorFase<{ n: number; media_min: number; desv_est: number | null; minimo_min: number; maximo_min: number }>;
    cumplimiento: PorFase<{ n: number; dentro_sla: number; fuera_sla: number; pct_cumplimiento: number; sla_minutos: number }>;
    conversion: PorFase<{ atenciones: number; visitas_agendadas: number; tasa_conversion: number }>;
    canales: { canal: string; atenciones: number; tiempo_promedio_min: number; tasa_conversion: number }[];
    serie: { fecha: string; fase: string; atenciones: number; tiempo_promedio_min: number; pct_cumplimiento: number }[];
    distribucion: { fase: string; duracion_min: number }[];
    sla: number;
}

const COLORES = {
    pretest: { label: 'Pretest · manual (O1)', color: 'var(--chart-2)' },
    postest: { label: 'Postest · SICOD (O2)', color: 'var(--chart-1)' },
};

function Indicador({
    titulo,
    pre,
    post,
    formato,
    mejor,
    detallePre,
    detallePost,
}: {
    titulo: string;
    pre?: number;
    post?: number;
    formato: (v: number) => string;
    mejor: 'menor' | 'mayor';
    detallePre?: string;
    detallePost?: string;
}) {
    const hayAmbos = pre !== undefined && post !== undefined;
    const diferencia = hayAmbos ? post - pre : 0;
    const mejora = hayAmbos && (mejor === 'menor' ? diferencia < 0 : diferencia > 0);
    const relativo = hayAmbos && pre !== 0 ? Math.abs(diferencia / pre) * 100 : null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-[15px]">{titulo}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Pretest · manual</p>
                        <p className="cifra text-[28px] leading-tight font-extrabold text-muted-foreground">{pre !== undefined ? formato(pre) : '—'}</p>
                        {detallePre && <p className="text-xs text-muted-foreground">{detallePre}</p>}
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Postest · SICOD</p>
                        <p className="cifra text-[28px] leading-tight font-extrabold text-primary">{post !== undefined ? formato(post) : '—'}</p>
                        {detallePost && <p className="text-xs text-muted-foreground">{detallePost}</p>}
                    </div>
                </div>
                {hayAmbos && (
                    <Badge variant={mejora ? 'ok' : 'bad'} className="text-[13px]">
                        {diferencia < 0 ? '−' : '+'}
                        {formato(Math.abs(diferencia)).replace(' %', ' puntos')}
                        {relativo !== null && titulo.startsWith('Tiempo') ? ` (${relativo.toFixed(1)} % ${diferencia < 0 ? 'menos' : 'más'})` : ''}
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
}

export default function Metricas({ tiempo, cumplimiento, conversion, canales, serie, distribucion, sla }: Props) {
    // Histograma: atenciones por rango de 10 minutos en cada fase.
    const tope = Math.max(60, ...distribucion.map((d) => Number(d.duracion_min)));
    const rangos = Array.from({ length: Math.ceil(tope / 10) }, (_, i) => ({
        rango: `${i * 10}–${i * 10 + 10}`,
        pretest: 0,
        postest: 0,
    }));
    distribucion.forEach((d) => {
        const i = Math.min(Math.floor(Number(d.duracion_min) / 10), rangos.length - 1);
        rangos[i][d.fase as 'pretest' | 'postest'] += 1;
    });

    const seriePost = serie
        .filter((s) => s.fase === 'postest')
        .map((s) => ({ fecha: fecha(s.fecha + 'T00:00:00', 'd MMM'), tiempo: Number(s.tiempo_promedio_min) }));

    const num = (v: unknown) => (v === null || v === undefined ? undefined : Number(v));

    return (
        <PanelLayout
            titulo="Indicadores del estudio"
            descripcion="Diseño preexperimental O1 – X – O2. Las cifras salen de las vistas SQL v_ind_tiempo, v_ind_cumplimiento y v_ind_conversion, calculadas con T1 − T0 de cada atención."
            acciones={
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>
                            <Download /> Exportar para SPSS
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <a href="/panel/metricas/exportar">Pretest y postest</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a href="/panel/metricas/exportar?fase=pretest">Solo pretest (O1)</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a href="/panel/metricas/exportar?fase=postest">Solo postest (O2)</a>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            }
        >
            <div className="grid grid-cols-1 gap-6">
                <div className="grid gap-6 lg:grid-cols-3">
                    <Indicador
                        titulo="Tiempo promedio de generación de cotizaciones"
                        pre={num(tiempo.pretest?.media_min)}
                        post={num(tiempo.postest?.media_min)}
                        formato={(v) => minutos(v)}
                        mejor="menor"
                        detallePre={tiempo.pretest ? `n = ${tiempo.pretest.n}${tiempo.pretest.desv_est ? ` · DE ${Number(tiempo.pretest.desv_est).toFixed(1)}` : ''}` : undefined}
                        detallePost={tiempo.postest ? `n = ${tiempo.postest.n}${tiempo.postest.desv_est ? ` · DE ${Number(tiempo.postest.desv_est).toFixed(1)}` : ''}` : undefined}
                    />
                    <Indicador
                        titulo={`Cumplimiento del tiempo de atención (≤ ${sla} min)`}
                        pre={num(cumplimiento.pretest?.pct_cumplimiento)}
                        post={num(cumplimiento.postest?.pct_cumplimiento)}
                        formato={(v) => porcentaje(v)}
                        mejor="mayor"
                        detallePre={cumplimiento.pretest ? `${cumplimiento.pretest.dentro_sla} de ${cumplimiento.pretest.n}` : undefined}
                        detallePost={cumplimiento.postest ? `${cumplimiento.postest.dentro_sla} de ${cumplimiento.postest.n}` : undefined}
                    />
                    <Indicador
                        titulo="Tasa de conversión a visitas agendadas"
                        pre={num(conversion.pretest?.tasa_conversion)}
                        post={num(conversion.postest?.tasa_conversion)}
                        formato={(v) => porcentaje(v)}
                        mejor="mayor"
                        detallePre={conversion.pretest ? `${conversion.pretest.visitas_agendadas} de ${conversion.pretest.atenciones}` : undefined}
                        detallePost={conversion.postest ? `${conversion.postest.visitas_agendadas} de ${conversion.postest.atenciones}` : undefined}
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribución del tiempo de atención</CardTitle>
                            <CardDescription>Atenciones por rango de minutos. Los rangos hasta {sla} min cumplen la meta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={COLORES} className="aspect-auto h-72">
                                <BarChart data={rangos} margin={{ left: -18, right: 8, top: 10 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="rango" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent formatoEtiqueta={(l) => `${l} minutos`} />} />
                                    <Bar dataKey="pretest" fill="var(--color-pretest)" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="postest" fill="var(--color-postest)" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                            <ChartLegend config={COLORES} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tiempo promedio por día · postest</CardTitle>
                            <CardDescription>Minutos promedio de las atenciones cerradas cada día.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {seriePost.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay atenciones del postest.</p>
                            ) : (
                                <ChartContainer config={{ tiempo: { label: 'Minutos', color: 'var(--chart-1)' } }} className="aspect-auto h-72">
                                    <LineChart data={seriePost} margin={{ left: -18, right: 8, top: 10 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                                        <YAxis tickLine={false} axisLine={false} width={40} />
                                        <ChartTooltip content={<ChartTooltipContent formatoValor={(v) => minutos(v)} />} />
                                        <ReferenceLine y={sla} stroke="var(--bad)" strokeDasharray="4 4" />
                                        <Line dataKey="tiempo" type="monotone" stroke="var(--color-tiempo)" strokeWidth={2.2} dot={{ r: 2.5 }} />
                                    </LineChart>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="gap-0 pb-0">
                    <CardHeader className="pb-4">
                        <CardTitle>Postest por canal</CardTitle>
                        <CardDescription>Compara cómo rinde cada canal de llegada con SICOD.</CardDescription>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Canal</TableHead>
                                <TableHead className="text-right">Atenciones</TableHead>
                                <TableHead className="text-right">Tiempo promedio</TableHead>
                                <TableHead className="text-right">Conversión a visita</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {canales.map((c) => (
                                <TableRow key={c.canal}>
                                    <TableCell className="font-semibold">{CANAL[c.canal] ?? c.canal}</TableCell>
                                    <TableCell className="cifra text-right">{c.atenciones}</TableCell>
                                    <TableCell className={cn('cifra text-right', Number(c.tiempo_promedio_min) > sla && 'text-bad')}>{minutos(Number(c.tiempo_promedio_min))}</TableCell>
                                    <TableCell className="cifra text-right">{porcentaje(Number(c.tasa_conversion))}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </PanelLayout>
    );
}
