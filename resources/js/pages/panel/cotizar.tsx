import { router } from '@inertiajs/react';
import { MousePointerClick, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Cotizador } from '@/components/cotizador';
import { Plano } from '@/components/plano';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import PanelLayout from '@/layouts/panel-layout';
import type { Lote, Proyecto, Reglas } from '@/types';

interface Props {
    proyectos: { id: number; nombre: string }[];
    proyecto: Proyecto;
    lotes: Lote[];
    reglas: Reglas;
    canales: string[];
}

export default function CotizarAsistido({ proyectos, proyecto, lotes, reglas, canales }: Props) {
    const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [tipo, setTipo] = useState<'todos' | 'interior' | 'esquina'>('todos');
    const seleccionado = useMemo(() => lotes.find((l) => l.id === seleccionadoId) ?? null, [lotes, seleccionadoId]);

    const termino = busqueda.trim().toUpperCase().replace(/\s+/g, '');
    const buscar = (e: React.FormEvent) => {
        e.preventDefault();
        const encontrado = lotes.find((l) => l.lote.toUpperCase() === termino || l.lote.toUpperCase().replace('-', '') === termino);
        if (encontrado) setSeleccionadoId(encontrado.id);
    };

    return (
        <PanelLayout
            titulo="Cotización asistida"
            descripcion="Para clientes que escriben por WhatsApp, llaman o vienen a la oficina. El tiempo de atención empieza al elegir el lote y termina al emitir la proforma."
        >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_27rem]">
                <Card className="min-w-0 gap-4 py-4">
                    <div className="flex flex-wrap items-center gap-3 px-4">
                        {proyectos.length > 1 && (
                            <Select value={String(proyecto.id)} onValueChange={(v) => router.get('/panel/cotizar', { proyecto: v })}>
                                <SelectTrigger size="sm" aria-label="Proyecto">
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
                        <form onSubmit={buscar} className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Ir al lote, p. ej. B-05"
                                className="h-9 w-52 pl-9"
                                aria-label="Buscar lote por código"
                            />
                        </form>
                        <ToggleGroup type="single" value={tipo} onValueChange={(v) => v && setTipo(v as typeof tipo)} aria-label="Ubicación">
                            <ToggleGroupItem value="todos">Todos</ToggleGroupItem>
                            <ToggleGroupItem value="interior">Interiores</ToggleGroupItem>
                            <ToggleGroupItem value="esquina">Esquinas</ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                    <div className="px-3">
                        <Plano
                            lotes={lotes}
                            seleccionado={seleccionadoId}
                            onSeleccionar={(l) => setSeleccionadoId(l.id)}
                            atenuar={(l) => (tipo !== 'todos' && (tipo === 'esquina') !== l.esquina) || (!!termino && !l.lote.toUpperCase().replace('-', '').includes(termino.replace('-', '')))}
                        />
                    </div>
                </Card>

                <aside className="xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:self-start xl:overflow-y-auto">
                    <Card className="px-5">
                        {seleccionado ? (
                            <Cotizador key={seleccionado.id} lote={seleccionado} proyecto={proyecto} reglas={reglas} modo="asistido" canales={canales} />
                        ) : (
                            <div className="flex flex-col items-center py-10 text-center">
                                <span className="mb-3 grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
                                    <MousePointerClick className="size-5" />
                                </span>
                                <h2 className="text-lg font-bold">Elige el lote que pidió el cliente</h2>
                                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                                    Tócalo en el plano o escribe su código. Verás la cuota al instante y podrás emitir la proforma.
                                </p>
                            </div>
                        )}
                    </Card>
                </aside>
            </div>
        </PanelLayout>
    );
}
