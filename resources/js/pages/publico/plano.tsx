import { router, usePoll } from '@inertiajs/react';
import { CornerDownRight, MousePointerClick } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Cotizador } from '@/components/cotizador';
import { Plano } from '@/components/plano';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useMedia } from '@/hooks/use-media';
import { useMoneda } from '@/hooks/use-moneda';
import PublicoLayout from '@/layouts/publico-layout';
import { ESTADO_LOTE, m2 } from '@/lib/formato';
import type { Lote, Proyecto, Reglas, Resumen } from '@/types';

interface Props {
    proyectos: { id: number; nombre: string }[];
    proyecto: Proyecto;
    reglas: Reglas;
    lotes: Lote[];
    resumen: Resumen | null;
}

export default function PlanoPublico({ proyectos, proyecto, reglas, lotes, resumen }: Props) {
    const { fmt } = useMoneda();
    const escritorio = useMedia('(min-width: 1024px)');
    const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
    const [resaltado, setResaltado] = useState<Lote | null>(null);
    const [tipo, setTipo] = useState<'todos' | 'interior' | 'esquina'>('todos');
    const [soloDisponibles, setSoloDisponibles] = useState(false);

    // La disponibilidad se refresca sola: dos clientes no ven estados distintos.
    usePoll(30000, { only: ['lotes', 'resumen'] });

    const seleccionado = useMemo(() => lotes.find((l) => l.id === seleccionadoId) ?? null, [lotes, seleccionadoId]);

    useEffect(() => {
        if (seleccionadoId && !seleccionado) setSeleccionadoId(null);
    }, [seleccionado, seleccionadoId]);

    const conteo = {
        disponible: resumen?.disponibles ?? lotes.filter((l) => l.estado === 'disponible').length,
        reservado: resumen?.reservados ?? 0,
        vendido: resumen?.vendidos ?? 0,
    };

    const desdeInterior = Math.min(...lotes.filter((l) => !l.esquina && l.estado === 'disponible').map((l) => l.precio), Infinity);

    return (
        <PublicoLayout titulo={proyecto.nombre}>
            <section className="border-b bg-card">
                <div className="mx-auto grid max-w-[1360px] gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        {proyectos.length > 1 && (
                            <Select value={String(proyecto.id)} onValueChange={(v) => router.get('/', { proyecto: v })}>
                                <SelectTrigger size="sm" className="mb-3" aria-label="Proyecto">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {proyectos.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <h1 className="text-[clamp(1.75rem,3.4vw,2.6rem)] leading-[1.05] font-extrabold">
                            Elige tu lote y conoce tu cuota al instante
                        </h1>
                        <p className="mt-2 max-w-[62ch] text-[15px] text-muted-foreground">
                            {proyecto.nombre}, {proyecto.ubicacion}. Sin cuota inicial y hasta {reglas.plazo_maximo} meses para pagar;{' '}
                            {reglas.descuento_contado_pct}% de descuento si pagas al contado.
                        </p>
                    </div>
                    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border bg-border text-sm">
                        <div className="bg-card px-4 py-3">
                            <dt className="text-xs text-muted-foreground">Lote interior</dt>
                            <dd className="cifra text-lg font-bold">{fmt(proyecto.precio_m2_interior, false)}<span className="text-xs font-normal text-muted-foreground"> /m²</span></dd>
                        </div>
                        <div className="bg-card px-4 py-3">
                            <dt className="text-xs text-muted-foreground">Lote en esquina</dt>
                            <dd className="cifra text-lg font-bold">{fmt(proyecto.precio_m2_esquina, false)}<span className="text-xs font-normal text-muted-foreground"> /m²</span></dd>
                        </div>
                        <div className="bg-card px-4 py-3">
                            <dt className="text-xs text-muted-foreground">Disponibles</dt>
                            <dd className="cifra text-lg font-bold">
                                {conteo.disponible}
                                <span className="text-xs font-normal text-muted-foreground"> de {resumen?.total_lotes ?? lotes.length}</span>
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            <div className="mx-auto grid max-w-[1360px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
                <Card className="min-w-0 gap-4 py-4">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4">
                        <ToggleGroup type="single" value={tipo} onValueChange={(v) => v && setTipo(v as typeof tipo)} aria-label="Ubicación del lote">
                            <ToggleGroupItem value="todos">Todos</ToggleGroupItem>
                            <ToggleGroupItem value="interior">Interiores</ToggleGroupItem>
                            <ToggleGroupItem value="esquina">Esquinas</ToggleGroupItem>
                        </ToggleGroup>
                        <ToggleGroup
                            type="single"
                            value={soloDisponibles ? 'si' : 'no'}
                            onValueChange={(v) => v && setSoloDisponibles(v === 'si')}
                            aria-label="Mostrar"
                        >
                            <ToggleGroupItem value="no">Todo el plano</ToggleGroupItem>
                            <ToggleGroupItem value="si">Solo disponibles</ToggleGroupItem>
                        </ToggleGroup>
                        <ul className="ml-auto flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label="Leyenda">
                            {(['disponible', 'reservado', 'vendido'] as const).map((e) => (
                                <li key={e} className="inline-flex items-center gap-1.5">
                                    <span
                                        className={
                                            e === 'disponible'
                                                ? 'size-3 rounded-[3px] border-[1.5px] border-ok bg-ok-soft'
                                                : e === 'reservado'
                                                  ? 'size-3 rounded-[3px] border-[1.5px] border-warn bg-warn-soft'
                                                  : 'size-3 rounded-[3px] border-[1.5px] border-bad bg-bad-soft'
                                        }
                                    />
                                    <b className="cifra font-semibold text-foreground">{conteo[e]}</b> {ESTADO_LOTE[e].toLowerCase()}s
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="px-3">
                        <Plano
                            lotes={lotes}
                            seleccionado={seleccionadoId}
                            onSeleccionar={(l) => setSeleccionadoId(l.id)}
                            onResaltar={setResaltado}
                            atenuar={(l) => (tipo !== 'todos' && (tipo === 'esquina') !== l.esquina) || (soloDisponibles && l.estado !== 'disponible')}
                        />
                    </div>

                    <p className="flex min-h-5 flex-wrap items-center gap-x-2 px-4 text-sm text-muted-foreground" aria-live="polite">
                        {resaltado ? (
                            <>
                                <CornerDownRight className="size-4" />
                                <b className="text-foreground">{resaltado.manzana} · Lote {resaltado.lote.split('-').pop()}</b>
                                <span>{resaltado.esquina ? 'Esquina' : 'Interior'}</span>·<span>{m2(resaltado.area_m2)}</span>·
                                <b className="cifra text-foreground">{fmt(resaltado.precio, false)}</b>·<span>{ESTADO_LOTE[resaltado.estado]}</span>
                            </>
                        ) : (
                            <>
                                <MousePointerClick className="size-4" /> Toca un lote verde para ver su precio y tu cuota mensual.
                            </>
                        )}
                    </p>
                </Card>

                {escritorio ? (
                    <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto">
                        <Card className="px-5">
                            {seleccionado ? (
                                <Cotizador key={seleccionado.id} lote={seleccionado} proyecto={proyecto} reglas={reglas} />
                            ) : (
                                <ResumenReglas proyecto={proyecto} reglas={reglas} disponibles={conteo.disponible} desde={desdeInterior} />
                            )}
                        </Card>
                    </aside>
                ) : (
                    <>
                        <Card className="px-5">
                            <ResumenReglas proyecto={proyecto} reglas={reglas} disponibles={conteo.disponible} desde={desdeInterior} />
                        </Card>
                        <Sheet open={!!seleccionado} onOpenChange={(abierto) => !abierto && setSeleccionadoId(null)}>
                            <SheetContent side="bottom" className="overflow-y-auto px-5 pt-6 pb-8">
                                <SheetTitle className="sr-only">Cotizar lote</SheetTitle>
                                {seleccionado && <Cotizador key={seleccionado.id} lote={seleccionado} proyecto={proyecto} reglas={reglas} />}
                            </SheetContent>
                        </Sheet>
                    </>
                )}
            </div>
        </PublicoLayout>
    );
}

function ResumenReglas({ proyecto, reglas, disponibles, desde }: { proyecto: Proyecto; reglas: Reglas; disponibles: number; desde: number }) {
    const { fmt } = useMoneda();
    const cuotaDesde = Number.isFinite(desde) ? desde / reglas.plazo_maximo : null;

    return (
        <div className="grid gap-5">
            <div>
                <h2 className="text-[22px] leading-tight font-extrabold">Así se calcula tu precio</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    Hay <b className="text-foreground">{disponibles}</b> lotes libres. Elige uno en el plano y verás su cuota con tus datos en menos de un minuto.
                </p>
            </div>
            <dl className="divide-y overflow-hidden rounded-lg bg-muted text-[15px]">
                {[
                    ['Lote interior', `${fmt(proyecto.precio_m2_interior)} por m²`],
                    ['Lote en esquina', `${fmt(proyecto.precio_m2_esquina)} por m²`],
                    ['Cuota inicial', 'Sin inicial'],
                    ['Financiamiento', `hasta ${reglas.plazo_maximo} meses`],
                    ['Pago al contado', `${reglas.descuento_contado_pct}% de descuento`],
                ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="cifra font-semibold">{v}</dd>
                    </div>
                ))}
            </dl>
            {cuotaDesde && (
                <p className="rounded-lg border border-dashed px-4 py-3 text-sm">
                    Cuotas desde <b className="cifra text-base">{fmt(cuotaDesde)}</b> al mes en {reglas.plazo_maximo} meses, en un lote interior.
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                La cuota es el precio del lote dividido entre los meses que elijas. Los montos en soles son referenciales.
            </p>
        </div>
    );
}
