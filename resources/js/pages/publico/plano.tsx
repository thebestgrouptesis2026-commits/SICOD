import { router, usePoll } from '@inertiajs/react';
import { ArrowDown, BadgePercent, CalendarRange, CornerDownRight, FileText, MapPin, MousePointerClick, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Cotizador } from '@/components/cotizador';
import { Plano } from '@/components/plano';
import { Button } from '@/components/ui/button';
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
    const cuotaDesde = Number.isFinite(desdeInterior) ? desdeInterior / reglas.plazo_maximo : null;
    const total = Number(resumen?.total_lotes ?? lotes.length) || 1;

    return (
        <PublicoLayout titulo={proyecto.nombre}>
            <section className="relative overflow-hidden border-b bg-card">
                <div className="fondo-plano pointer-events-none absolute inset-0 mask-[linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden="true" />
                <div className="pointer-events-none absolute -top-40 -right-32 size-136 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

                <div className="relative mx-auto grid max-w-[1360px] gap-8 px-4 pt-10 pb-9 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:gap-12 lg:pt-14 lg:pb-12 xl:grid-cols-[minmax(0,1fr)_27rem]">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            {proyectos.length > 1 ? (
                                <Select value={String(proyecto.id)} onValueChange={(v) => router.get('/', { proyecto: v })}>
                                    <SelectTrigger size="sm" className="rounded-full bg-card" aria-label="Proyecto">
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
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-[13px] font-medium">
                                    <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                                    {proyecto.nombre} · {proyecto.ubicacion}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1 text-[13px] font-medium text-foreground">
                                <span className="relative flex size-2" aria-hidden="true">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60 motion-reduce:hidden" />
                                    <span className="relative inline-flex size-2 rounded-full bg-ok" />
                                </span>
                                Disponibilidad en tiempo real
                            </span>
                        </div>

                        <h1 className="mt-5 max-w-[16ch] text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.02] font-extrabold">
                            Elige tu lote y conoce tu cuota <span className="text-primary">al instante</span>
                        </h1>
                        <p className="mt-4 max-w-[54ch] text-base text-muted-foreground sm:text-[17px]">
                            Mira el plano real de la lotización, toca un lote libre y recibe tu proforma en PDF en menos de un minuto. Sin trámites ni esperas.
                        </p>

                        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                            <Button size="lg" asChild>
                                <a href="#plano">
                                    Ver lotes disponibles <ArrowDown />
                                </a>
                            </Button>
                            {cuotaDesde && (
                                <p className="text-sm text-muted-foreground">
                                    Cuotas desde <b className="cifra text-lg text-foreground">{fmt(cuotaDesde)}</b> al mes
                                </p>
                            )}
                        </div>

                        <ul className="mt-9 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                            {[
                                [Wallet, 'Sin cuota inicial', 'Empiezas a pagar el primer mes'],
                                [CalendarRange, `Hasta ${reglas.plazo_maximo} meses`, 'Financiamiento directo'],
                                [BadgePercent, `${reglas.descuento_contado_pct}% al contado`, 'Descuento sobre el total'],
                                [FileText, 'Proforma en PDF', 'Con enlace privado'],
                            ].map(([Icono, titulo, nota]) => {
                                const I = Icono as typeof Wallet;
                                return (
                                    <li key={titulo as string} className="flex items-start gap-3">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                                            <I className="size-4.5" aria-hidden="true" />
                                        </span>
                                        <span className="min-w-0 leading-tight">
                                            <span className="block text-sm font-semibold">{titulo as string}</span>
                                            <span className="mt-0.5 block text-xs text-muted-foreground">{nota as string}</span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="rounded-2xl border bg-card/95 p-5 shadow-raised backdrop-blur-sm sm:p-6">
                        <p className="etiqueta text-muted-foreground">Precio de lista</p>
                        <dl className="mt-3 grid grid-cols-2 gap-3">
                            {[
                                ['Lote interior', proyecto.precio_m2_interior],
                                ['Lote en esquina', proyecto.precio_m2_esquina],
                            ].map(([k, v]) => (
                                <div key={k} className="rounded-xl bg-muted px-4 py-3">
                                    <dt className="text-xs text-muted-foreground">{k}</dt>
                                    <dd className="cifra mt-0.5 text-[22px] leading-tight font-extrabold">
                                        {fmt(Number(v), false)}
                                        <span className="text-xs font-normal text-muted-foreground"> /m²</span>
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <div className="mt-5">
                            <div className="flex items-baseline justify-between gap-3 text-sm">
                                <span className="font-semibold">Lotes disponibles</span>
                                <span className="text-muted-foreground">
                                    <b className="cifra text-lg text-foreground">{conteo.disponible}</b> de {total}
                                </span>
                            </div>
                            <div
                                className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted"
                                role="img"
                                aria-label={`${conteo.disponible} disponibles, ${conteo.reservado} separados y ${conteo.vendido} vendidos de ${total} lotes`}
                            >
                                <div className="bg-ok" style={{ width: `${(conteo.disponible / total) * 100}%` }} />
                                <div className="bg-warn" style={{ width: `${(conteo.reservado / total) * 100}%` }} />
                                <div className="bg-bad" style={{ width: `${(conteo.vendido / total) * 100}%` }} />
                            </div>
                            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
                                {(['disponible', 'reservado', 'vendido'] as const).map((e) => (
                                    <li key={e} className="inline-flex items-center gap-1.5">
                                        <span className={e === 'disponible' ? 'size-2 rounded-full bg-ok' : e === 'reservado' ? 'size-2 rounded-full bg-warn' : 'size-2 rounded-full bg-bad'} />
                                        {conteo[e]} {ESTADO_LOTE[e].toLowerCase()}s
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto grid max-w-[1360px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
                <Card id="plano" className="min-w-0 scroll-mt-20 gap-4 py-4">
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
