import { Maximize2, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Lote } from '@/types';

/*
 * Plano de lotizacion dibujado a escala a partir de los datos de cada lote
 * (frente, fondo, orden y manzana). Si los lotes traen su poligono real en
 * `geometria.points`, se dibuja ese trazo en lugar del esquema automatico.
 */

const ESCALA = 5.7; // px por metro
const CALLE = 12; // ancho de calle en metros
const PARQUE = 24; // franja de parque entre filas de manzanas
const MARGEN = 20;

type Rect = { x: number; y: number; w: number; h: number };
type LoteDibujado = Lote & { rect?: Rect; puntos?: string; centro: { x: number; y: number } };

interface Diseno {
    ancho: number;
    alto: number;
    lotes: LoteDibujado[];
    calles: (Rect & { nombre?: string; vertical?: boolean })[];
    parques: Rect[];
    manzanas: { codigo: string; x: number; y: number }[];
    /** Centro horizontal de cada columna de manzanas, para rotular calles. */
    columnas: number[];
}

function numeroLote(codigo: string) {
    const partes = codigo.split('-');
    return partes[partes.length - 1];
}

function calleDe(observacion: string | null): string | undefined {
    const m = observacion?.match(/frente a (.+)$/i);
    return m?.[1];
}

function disenoPorPoligonos(lotes: Lote[]): Diseno {
    const pts = lotes.flatMap((l) => (l.geometria?.points ?? '').trim().split(/\s+/).map((p) => p.split(',').map(Number)));
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    return {
        ancho: Math.max(...xs) - minX + MARGEN * 2,
        alto: Math.max(...ys) - minY + MARGEN * 2,
        calles: [],
        parques: [],
        manzanas: [],
        columnas: [],
        lotes: lotes.map((l) => {
            const p = (l.geometria?.points ?? '').trim().split(/\s+/).map((s) => s.split(',').map(Number));
            const puntos = p.map(([x, y]) => `${x - minX + MARGEN},${y - minY + MARGEN}`).join(' ');
            const cx = p.reduce((a, [x]) => a + x, 0) / p.length - minX + MARGEN;
            const cy = p.reduce((a, [, y]) => a + y, 0) / p.length - minY + MARGEN;
            return { ...l, puntos, centro: { x: cx, y: cy } };
        }),
    };
}

function disenoAutomatico(lotes: Lote[]): Diseno {
    const porManzana = new Map<string, Lote[]>();
    lotes.forEach((l) => {
        const lista = porManzana.get(l.manzana_codigo) ?? [];
        lista.push(l);
        porManzana.set(l.manzana_codigo, lista);
    });

    // Cada manzana: dos filas espalda con espalda. La primera mitad va al
    // norte de izquierda a derecha; la segunda, al sur de derecha a izquierda.
    const bloques = [...porManzana.entries()].map(([codigo, ls]) => {
        const ordenados = [...ls].sort((a, b) => a.orden - b.orden);
        const mitad = Math.ceil(ordenados.length / 2);
        const norte = ordenados.slice(0, mitad);
        const sur = ordenados.slice(mitad).reverse();
        const anchoNorte = norte.reduce((s, l) => s + l.frente_m, 0);
        const anchoSur = sur.reduce((s, l) => s + l.frente_m, 0);
        const fondoNorte = Math.max(...norte.map((l) => l.fondo_m), 0);
        const fondoSur = Math.max(...sur.map((l) => l.fondo_m), 0);
        return { codigo, norte, sur, ancho: Math.max(anchoNorte, anchoSur), alto: fondoNorte + fondoSur, fondoNorte };
    });

    const columnas = bloques.length > 1 ? 2 : 1;
    const filas: (typeof bloques)[] = [];
    for (let i = 0; i < bloques.length; i += columnas) filas.push(bloques.slice(i, i + columnas));

    const anchoColumna = Array.from({ length: columnas }, (_, c) => Math.max(...filas.map((f) => f[c]?.ancho ?? 0)));
    const anchoTotal = CALLE + anchoColumna.reduce((s, w) => s + w + CALLE, 0);

    const resultado: LoteDibujado[] = [];
    const calles: Diseno['calles'] = [];
    const parques: Rect[] = [];
    const manzanas: Diseno['manzanas'] = [];

    let y = 0;
    filas.forEach((fila, iFila) => {
        const altoFila = Math.max(...fila.map((b) => b.alto));
        const nombreNorte = calleDe(fila[0]?.norte[0]?.observacion ?? null);
        const nombreSur = calleDe(fila[0]?.sur[0]?.observacion ?? null);

        // Calle al norte de la fila.
        calles.push({ x: 0, y, w: anchoTotal, h: CALLE, nombre: nombreNorte });
        y += CALLE;

        let x = CALLE;
        fila.forEach((b, c) => {
            let cx = x;
            b.norte.forEach((l) => {
                const rect = { x: cx, y, w: l.frente_m, h: l.fondo_m };
                resultado.push({ ...l, rect, centro: { x: cx + l.frente_m / 2, y: y + l.fondo_m / 2 } });
                cx += l.frente_m;
            });
            cx = x;
            b.sur.forEach((l) => {
                const rect = { x: cx, y: y + b.fondoNorte, w: l.frente_m, h: l.fondo_m };
                resultado.push({ ...l, rect, centro: { x: cx + l.frente_m / 2, y: y + b.fondoNorte + l.fondo_m / 2 } });
                cx += l.frente_m;
            });
            manzanas.push({ codigo: b.codigo, x: x + b.ancho / 2, y: y + b.fondoNorte });
            x += anchoColumna[c] + CALLE;
        });

        y += altoFila;
        calles.push({ x: 0, y, w: anchoTotal, h: CALLE, nombre: nombreSur });
        y += CALLE;

        // Parque entre la primera y la segunda fila de manzanas.
        if (iFila === 0 && filas.length > 1) {
            parques.push({ x: CALLE, y, w: anchoTotal - CALLE * 2, h: PARQUE });
            y += PARQUE;
        }
    });

    // Calles verticales entre columnas y en los bordes.
    let vx = 0;
    calles.push({ x: vx, y: 0, w: CALLE, h: y, vertical: true });
    anchoColumna.forEach((w) => {
        vx += CALLE + w;
        calles.push({ x: vx, y: 0, w: CALLE, h: y, vertical: true });
    });

    const centros: number[] = [];
    let cxCol = CALLE;
    anchoColumna.forEach((w) => {
        centros.push(cxCol + w / 2);
        cxCol += w + CALLE;
    });

    const escalar = (r: Rect): Rect => ({ x: MARGEN + r.x * ESCALA, y: MARGEN + r.y * ESCALA, w: r.w * ESCALA, h: r.h * ESCALA });

    return {
        ancho: anchoTotal * ESCALA + MARGEN * 2,
        alto: y * ESCALA + MARGEN * 2,
        lotes: resultado.map((l) => ({
            ...l,
            rect: l.rect ? escalar(l.rect) : undefined,
            centro: { x: MARGEN + l.centro.x * ESCALA, y: MARGEN + l.centro.y * ESCALA },
        })),
        calles: calles.map((c) => ({ ...escalar(c), nombre: c.nombre, vertical: c.vertical })),
        parques: parques.map(escalar),
        manzanas: manzanas.map((m) => ({ codigo: m.codigo, x: MARGEN + m.x * ESCALA, y: MARGEN + m.y * ESCALA })),
        columnas: centros.map((c) => MARGEN + c * ESCALA),
    };
}

const CLASE_ESTADO: Record<string, string> = {
    disponible: 'fill-ok-soft stroke-ok cursor-pointer',
    reservado: 'fill-warn-soft stroke-warn cursor-pointer',
    vendido: 'fill-bad-soft stroke-bad cursor-pointer',
    bloqueado: 'fill-lock-soft stroke-lock cursor-pointer',
};

export function Plano({
    lotes,
    seleccionado,
    atenuar,
    onSeleccionar,
    onResaltar,
    className,
}: {
    lotes: Lote[];
    seleccionado?: number | null;
    atenuar?: (lote: Lote) => boolean;
    onSeleccionar?: (lote: Lote) => void;
    onResaltar?: (lote: Lote | null) => void;
    className?: string;
}) {
    const diseno = useMemo(() => {
        const conPoligono = lotes.length > 0 && lotes.every((l) => l.geometria?.points);
        return conPoligono ? disenoPorPoligonos(lotes) : disenoAutomatico(lotes);
    }, [lotes]);

    const base = useMemo(() => ({ x: 0, y: 0, w: diseno.ancho, h: diseno.alto }), [diseno]);
    const [vista, setVista] = useState(base);
    useEffect(() => setVista(base), [base]);

    const caja = useRef<HTMLDivElement>(null);
    const arrastre = useRef<{ x: number; y: number; vx: number; vy: number; movio: boolean } | null>(null);
    const ampliado = vista.w < base.w - 1;

    const limitar = (v: typeof vista) => ({
        ...v,
        x: Math.min(Math.max(v.x, 0), base.w - v.w),
        y: Math.min(Math.max(v.y, 0), base.h - v.h),
    });

    const zoom = (factor: number) =>
        setVista((v) => {
            const w = Math.min(base.w, Math.max(base.w / 4, v.w / factor));
            const h = (w * base.h) / base.w;
            return limitar({ w, h, x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2 });
        });

    const alPresionar = (e: React.PointerEvent) => {
        if (!ampliado) return;
        arrastre.current = { x: e.clientX, y: e.clientY, vx: vista.x, vy: vista.y, movio: false };
    };
    const alMover = (e: React.PointerEvent) => {
        const a = arrastre.current;
        if (!a || !caja.current) return;
        const k = vista.w / caja.current.getBoundingClientRect().width;
        const dx = e.clientX - a.x;
        const dy = e.clientY - a.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) a.movio = true;
        setVista((v) => limitar({ ...v, x: a.vx - dx * k, y: a.vy - dy * k }));
    };
    const alSoltar = () => {
        setTimeout(() => (arrastre.current = null), 0);
    };
    const elegir = (l: Lote) => {
        if (arrastre.current?.movio) return;
        onSeleccionar?.(l);
    };

    return (
        <div className={cn('min-w-0', className)}>
            <div className="mb-2 flex justify-end gap-1">
                <Button type="button" variant="outline" size="icon-sm" onClick={() => zoom(1.4)} aria-label="Acercar plano">
                    <Plus />
                </Button>
                <Button type="button" variant="outline" size="icon-sm" onClick={() => zoom(1 / 1.4)} aria-label="Alejar plano" disabled={!ampliado}>
                    <Minus />
                </Button>
                <Button type="button" variant="outline" size="icon-sm" onClick={() => setVista(base)} aria-label="Ver plano completo" disabled={!ampliado}>
                    <Maximize2 />
                </Button>
            </div>

            <div
                ref={caja}
                className={cn('overflow-x-auto rounded-lg border bg-(--plan-ground)', ampliado && 'cursor-grab touch-none active:cursor-grabbing')}
                onPointerDown={alPresionar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerLeave={alSoltar}
            >
                <svg
                    viewBox={`${vista.x} ${vista.y} ${vista.w} ${vista.h}`}
                    className="block h-auto w-full min-w-[720px] select-none"
                    role="group"
                    aria-label="Plano de lotización. Cada lote es un botón con su estado."
                >
                    {diseno.calles.map((c, i) => (
                        <rect key={`c${i}`} x={c.x} y={c.y} width={c.w} height={c.h} className="fill-(--plan-street)" />
                    ))}
                    {diseno.calles
                        .filter((c) => c.nombre && !c.vertical)
                        .flatMap((c, i) =>
                            diseno.columnas.map((x, k) => (
                                <text key={`n${i}-${k}`} x={x} y={c.y + c.h / 2 + 3.5} textAnchor="middle" className="pointer-events-none fill-(--plan-text) text-[10.5px] italic">
                                    {c.nombre}
                                </text>
                            )),
                        )}

                    {diseno.parques.map((p, i) => (
                        <g key={`p${i}`}>
                            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={3} className="fill-(--plan-park)" />
                            {Array.from({ length: Math.floor(p.w / 40) }, (_, k) => (
                                <circle key={k} cx={p.x + 20 + k * 40} cy={p.y + 14} r={6.5} className="fill-(--plan-tree)" />
                            ))}
                            {Array.from({ length: Math.floor(p.w / 40) }, (_, k) => (
                                <circle key={`b${k}`} cx={p.x + 20 + k * 40} cy={p.y + p.h - 14} r={6.5} className="fill-(--plan-tree)" />
                            ))}
                            <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 4} textAnchor="middle" className="fill-(--plan-text) text-[12px] italic">
                                Parque y área de recreación
                            </text>
                            <g transform={`translate(${p.x + p.w - 30} ${p.y + p.h / 2 - 16})`} aria-hidden="true">
                                <path d="M0 10 l6 18 l-6 -5 l-6 5 z" className="fill-(--plan-text)" />
                                <text x={0} y={6} textAnchor="middle" className="fill-(--plan-text) font-display text-[10px] font-bold">N</text>
                            </g>
                        </g>
                    ))}

                    {diseno.lotes.map((l) => {
                        const tenue = atenuar?.(l);
                        const activo = seleccionado === l.id;
                        const textoClaro = l.estado === 'disponible';
                        return (
                            <g
                                key={l.id}
                                role="button"
                                tabIndex={0}
                                aria-label={`Lote ${l.lote}, ${l.esquina ? 'esquina' : 'interior'}, ${l.area_m2} metros cuadrados, ${l.estado === 'reservado' ? 'separado' : l.estado}`}
                                aria-pressed={activo}
                                className={cn('group outline-none transition-opacity', tenue && 'opacity-25')}
                                onClick={() => elegir(l)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSeleccionar?.(l);
                                    }
                                }}
                                onPointerEnter={() => onResaltar?.(l)}
                                onFocus={() => onResaltar?.(l)}
                            >
                                {l.rect ? (
                                    <rect
                                        x={l.rect.x + 0.6}
                                        y={l.rect.y + 0.6}
                                        width={l.rect.w - 1.2}
                                        height={l.rect.h - 1.2}
                                        rx={1.5}
                                        className={cn(
                                            'stroke-[1.2] transition-[fill,stroke-width] group-focus-visible:stroke-ring group-focus-visible:stroke-[3]',
                                            CLASE_ESTADO[l.estado],
                                            textoClaro && 'group-hover:fill-ok',
                                            activo && 'stroke-foreground stroke-[3.2]',
                                        )}
                                    />
                                ) : (
                                    <polygon
                                        points={l.puntos}
                                        className={cn('stroke-[1.2]', CLASE_ESTADO[l.estado], activo && 'stroke-foreground stroke-[3.2]')}
                                    />
                                )}
                                <text
                                    x={l.centro.x}
                                    y={l.centro.y - 2}
                                    textAnchor="middle"
                                    className={cn('pointer-events-none fill-foreground text-[11px] font-bold', textoClaro && 'group-hover:fill-white', !textoClaro && 'opacity-70')}
                                >
                                    {numeroLote(l.lote)}
                                </text>
                                <text
                                    x={l.centro.x}
                                    y={l.centro.y + 11}
                                    textAnchor="middle"
                                    className={cn('pointer-events-none fill-muted-foreground text-[8.5px]', textoClaro && 'group-hover:fill-white/85', !textoClaro && 'opacity-70')}
                                >
                                    {Math.round(l.area_m2)} m²
                                </text>
                            </g>
                        );
                    })}

                    {diseno.manzanas.map((m) => (
                        <g key={m.codigo} className="pointer-events-none">
                            <rect x={m.x - 24} y={m.y - 8} width={48} height={16} rx={3} className="fill-(--plan-ground)" />
                            <text x={m.x} y={m.y + 4.5} textAnchor="middle" className="fill-(--plan-text) font-display text-[12px] font-extrabold [font-stretch:120%]">
                                MZ. {m.codigo}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}
