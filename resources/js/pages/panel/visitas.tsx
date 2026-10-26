import { router } from '@inertiajs/react';
import { CalendarDays, MessageCircle } from 'lucide-react';

import { Paginacion } from '@/components/paginacion';
import { Vacio } from '@/components/vacio';
import { EstadoVisita } from '@/components/estado';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import PanelLayout from '@/layouts/panel-layout';
import { ESTADO_VISITA, fecha, hora } from '@/lib/formato';
import type { FilaVisita, Paginado } from '@/types';

interface Props {
    visitas: Paginado<FilaVisita>;
    filtros: { periodo: 'proximas' | 'pasadas' | 'todas'; estado: string | null };
}

function agruparPorDia(visitas: FilaVisita[]) {
    const grupos = new Map<string, FilaVisita[]>();
    visitas.forEach((v) => {
        const dia = v.programada_para.slice(0, 10);
        grupos.set(dia, [...(grupos.get(dia) ?? []), v]);
    });
    return [...grupos.entries()];
}

export default function Visitas({ visitas, filtros }: Props) {
    const filtrar = (cambios: Partial<Props['filtros']>) => {
        const datos = { ...filtros, ...cambios };
        router.get('/panel/visitas', Object.fromEntries(Object.entries(datos).filter(([, v]) => v && v !== 'todos')), { preserveState: true, replace: true });
    };

    return (
        <PanelLayout titulo="Visitas al proyecto" descripcion="Confirma las visitas por WhatsApp y registra si el cliente asistió.">
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <ToggleGroup type="single" value={filtros.periodo} onValueChange={(v) => v && filtrar({ periodo: v as Props['filtros']['periodo'] })} aria-label="Periodo">
                    <ToggleGroupItem value="proximas">Próximas</ToggleGroupItem>
                    <ToggleGroupItem value="pasadas">Pasadas</ToggleGroupItem>
                    <ToggleGroupItem value="todas">Todas</ToggleGroupItem>
                </ToggleGroup>
                <Select value={filtros.estado ?? 'todos'} onValueChange={(v) => filtrar({ estado: v === 'todos' ? null : v })}>
                    <SelectTrigger size="sm" aria-label="Estado">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todo estado</SelectItem>
                        {Object.entries(ESTADO_VISITA).map(([k, t]) => (
                            <SelectItem key={k} value={k}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="gap-0 py-0">
                {visitas.data.length === 0 ? (
                    <Vacio icono={CalendarDays} titulo="No hay visitas en este periodo">
                        Cuando un cliente agende desde su proforma, o tú desde la cotización, aparecerá aquí.
                    </Vacio>
                ) : (
                    agruparPorDia(visitas.data).map(([dia, lista]) => (
                        <section key={dia} className="border-b last:border-b-0">
                            <h2 className="bg-muted/60 px-5 py-2 font-sans text-xs font-semibold text-muted-foreground capitalize [font-stretch:100%]">
                                {fecha(dia + 'T00:00:00', "EEEE d 'de' MMMM yyyy")}
                            </h2>
                            <ul className="divide-y">
                                {lista.map((v) => (
                                    <li key={v.id} className="grid gap-3 px-5 py-3 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center">
                                        <span className="cifra text-lg font-bold">{hora(v.programada_para)}</span>
                                        <div className="min-w-0">
                                            <p className="font-semibold">{v.cliente}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Lote {v.lote}
                                                {v.cotizacion && (
                                                    <>
                                                        {' · '}
                                                        <button className="hover:underline" onClick={() => v.cotizacion_id && router.visit(`/panel/cotizaciones/${v.cotizacion_id}`)}>
                                                            {v.cotizacion}
                                                        </button>
                                                    </>
                                                )}
                                                {v.asesor ? ` · ${v.asesor}` : ''}
                                            </p>
                                            {v.notas && v.notas !== 'DEMO' && <p className="mt-0.5 text-sm text-muted-foreground italic">“{v.notas}”</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {v.telefono && (
                                                <Button variant="ghost" size="icon-sm" asChild>
                                                    <a
                                                        href={`https://wa.me/51${v.telefono}?text=${encodeURIComponent(`Hola ${v.cliente?.split(' ')[0] ?? ''}, le escribimos de Inmobiliaria Taipe para confirmar su visita del ${fecha(v.programada_para, "d 'de' MMMM 'a las' HH:mm")}.`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={`Confirmar por WhatsApp con ${v.cliente}`}
                                                    >
                                                        <MessageCircle />
                                                    </a>
                                                </Button>
                                            )}
                                            {v.puede_editar ? (
                                                <Select value={v.estado} onValueChange={(estado) => router.patch(`/panel/visitas/${v.id}`, { estado }, { preserveScroll: true })}>
                                                    <SelectTrigger size="sm" className="w-36" aria-label="Estado de la visita">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(ESTADO_VISITA).map(([k, t]) => (
                                                            <SelectItem key={k} value={k}>
                                                                {t}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <EstadoVisita estado={v.estado} />
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))
                )}
                <Paginacion datos={visitas} nombre="visitas" />
            </Card>
        </PanelLayout>
    );
}
