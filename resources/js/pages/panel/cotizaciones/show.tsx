import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CalendarPlus, Copy, Download, Hand, MessageCircle, Timer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Campo } from '@/components/campo';
import { EstadoLote, EstadoVisita } from '@/components/estado';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMoneda } from '@/hooks/use-moneda';
import PanelLayout from '@/layouts/panel-layout';
import { CANAL, ESTADO_VISITA, fecha, fechaHora, hora, m2, metros, minutos } from '@/lib/formato';
import type { FilaCotizacion, FilaVisita } from '@/types';

interface Detalle extends Omit<FilaCotizacion, 'lote'> {
    cliente_documento: string;
    cliente_telefono: string;
    cliente_email: string | null;
    estado: string;
    precio_m2: number;
    precio_lista: number;
    descuento_pct: number;
    descuento_monto: number;
    total_financiado: number;
    valida_hasta: string | null;
    vigente: boolean;
    atencion: { codigo: string; inicio_at: string; fin_at: string | null; duracion_min: number; cumple_sla: boolean; sla_minutos: number; origen: string };
    lote: { id: number; codigo: string; manzana: string; area_m2: number; frente_m: number; fondo_m: number; esquina: boolean; estado: string; proyecto: string };
    visitas: FilaVisita[];
}

interface Props {
    cotizacion: Detalle;
    enlaces: { publico: string; whatsapp: string };
    permisos: { actualizar: boolean; tomar: boolean };
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-0.5 py-2.5 text-[15px]">
            <dt className="text-muted-foreground">{etiqueta}</dt>
            <dd className="text-right font-semibold">{children}</dd>
        </div>
    );
}

export default function DetalleCotizacion({ cotizacion: c, enlaces, permisos }: Props) {
    const { fmt, fmtOtra } = useMoneda();
    const tc = c.tipo_cambio;
    const financiado = c.modalidad_pago === 'financiado';

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(enlaces.publico);
            toast.success('Enlace de la proforma copiado.');
        } catch {
            toast.error('No se pudo copiar. Selecciona el enlace en la ficha del cliente.');
        }
    };

    return (
        <PanelLayout
            titulo={c.cliente_nombre}
            descripcion={
                <>
                    {c.codigo} · emitida el {fechaHora(c.emitida_at)} · {CANAL[c.canal] ?? c.canal}
                    {!c.vigente && <Badge variant="muted" className="ml-2">Vencida</Badge>}
                </>
            }
            acciones={
                <>
                    <Button variant="ghost" asChild>
                        <Link href="/panel/cotizaciones">
                            <ArrowLeft /> Bandeja
                        </Link>
                    </Button>
                    {permisos.tomar && (
                        <Button onClick={() => router.post(`/panel/cotizaciones/${c.id}/tomar`, {}, { preserveScroll: true })}>
                            <Hand /> Tomar este lead
                        </Button>
                    )}
                    <Button variant="outline" asChild>
                        <a href={`/panel/cotizaciones/${c.id}/pdf`}>
                            <Download /> PDF
                        </a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a href={enlaces.whatsapp} target="_blank" rel="noopener noreferrer">
                            <MessageCircle /> Enviar por WhatsApp
                        </a>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={copiar} aria-label="Copiar enlace de la proforma">
                        <Copy />
                    </Button>
                </>
            }
        >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <div className="grid content-start gap-6">
                    <Card className="overflow-hidden py-0">
                        <div className="flex flex-wrap items-end justify-between gap-4 bg-primary px-6 py-5 text-primary-foreground">
                            <div>
                                <p className="text-sm opacity-85">{financiado ? 'Cuota mensual' : 'Precio al contado'}</p>
                                <p className="cifra mt-1 text-[38px] leading-none font-extrabold">
                                    {fmt(financiado ? c.cuota_mensual : c.precio_final, true, tc)}
                                    {financiado && <span className="ml-1.5 font-sans text-base font-semibold opacity-80">/ mes</span>}
                                </p>
                                <p className="mt-1 text-sm opacity-85 tabular">{fmtOtra(financiado ? c.cuota_mensual : c.precio_final, tc)}</p>
                            </div>
                            <p className="text-sm opacity-90">{financiado ? `${c.plazo_meses} cuotas · sin inicial` : `Incluye ${c.descuento_pct}% de descuento`}</p>
                        </div>
                        <dl className="divide-y px-6 pb-2">
                            <Fila etiqueta="Precio por m²">{fmt(c.precio_m2, true, tc)}</Fila>
                            <Fila etiqueta="Precio de lista">{fmt(c.precio_lista, true, tc)}</Fila>
                            {!financiado && <Fila etiqueta={`Descuento al contado (${c.descuento_pct}%)`}>− {fmt(c.descuento_monto, true, tc)}</Fila>}
                            <Fila etiqueta={financiado ? 'Total a pagar' : 'Precio final'}>{fmt(financiado ? c.total_financiado : c.precio_final, true, tc)}</Fila>
                            <Fila etiqueta="Tipo de cambio usado">S/ {tc.toFixed(3)}</Fila>
                            <Fila etiqueta="Válida hasta">{fecha(c.valida_hasta)}</Fila>
                            <Fila etiqueta="Estado de la cotización">
                                {permisos.actualizar ? (
                                    <Select value={c.estado} onValueChange={(v) => router.patch(`/panel/cotizaciones/${c.id}/estado`, { estado: v }, { preserveScroll: true })}>
                                        <SelectTrigger size="sm" className="ml-auto">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="emitida">Emitida</SelectItem>
                                            <SelectItem value="aceptada">Aceptada</SelectItem>
                                            <SelectItem value="rechazada">Rechazada</SelectItem>
                                            <SelectItem value="vencida">Vencida</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="capitalize">{c.estado}</span>
                                )}
                            </Fila>
                        </dl>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between gap-3">
                                {c.lote.manzana} · Lote {c.lote.codigo.split('-').pop()}
                                <EstadoLote estado={c.lote.estado} />
                            </CardTitle>
                            <CardDescription>{c.lote.proyecto}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                                {[
                                    ['Ubicación', c.lote.esquina ? 'Esquina' : 'Interior'],
                                    ['Frente', metros(c.lote.frente_m)],
                                    ['Fondo', metros(c.lote.fondo_m)],
                                    ['Área', m2(c.lote.area_m2)],
                                ].map(([k, v]) => (
                                    <div key={k}>
                                        <dt className="text-xs text-muted-foreground">{k}</dt>
                                        <dd className="cifra font-semibold">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p className="mt-4 text-sm text-muted-foreground">
                                Para separar o vender el lote, cambia su estado en{' '}
                                <Link href="/panel/lotes" className="font-semibold text-primary hover:underline">
                                    Lotes
                                </Link>
                                .
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid content-start gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Timer className="size-4 text-primary" /> Tiempo de atención
                            </CardTitle>
                            <CardDescription>
                                {c.atencion.codigo} · {c.atencion.origen === 'sistema' ? 'cronometrado por SICOD' : 'registro manual'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between gap-4">
                                <p className="cifra text-[34px] leading-none font-extrabold">{minutos(c.atencion.duracion_min)}</p>
                                <Badge variant={c.atencion.cumple_sla ? 'ok' : 'bad'}>
                                    {c.atencion.cumple_sla ? 'Dentro' : 'Fuera'} de la meta de {c.atencion.sla_minutos} min
                                </Badge>
                            </div>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-xs text-muted-foreground">T0 · solicitud</dt>
                                    <dd className="cifra font-semibold">{fechaHora(c.atencion.inicio_at)}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">T1 · proforma emitida</dt>
                                    <dd className="cifra font-semibold">{fechaHora(c.atencion.fin_at)}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contacto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="divide-y">
                                <Fila etiqueta="Documento">{c.cliente_documento}</Fila>
                                <Fila etiqueta="Celular">
                                    <a href={`tel:+51${c.cliente_telefono}`} className="hover:underline">+51 {c.cliente_telefono}</a>
                                </Fila>
                                {c.cliente_email && <Fila etiqueta="Correo">{c.cliente_email}</Fila>}
                                <Fila etiqueta="Asesor">{c.asesor ?? <Badge variant="warn">Sin asesor</Badge>}</Fila>
                            </dl>
                            <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs break-all text-muted-foreground">{enlaces.publico}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Visitas</CardTitle>
                            {permisos.actualizar && (
                                <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                                    <AgendarVisita cotizacionId={c.id} />
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {c.visitas.length === 0 ? (
                                <p className="text-sm text-muted-foreground">El cliente aún no agenda una visita al proyecto.</p>
                            ) : (
                                c.visitas.map((v) => (
                                    <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                                        <div>
                                            <p className="text-sm font-semibold">{fecha(v.programada_para, "EEEE d 'de' MMMM")}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {hora(v.programada_para)} {v.asesor ? `· ${v.asesor}` : ''}
                                            </p>
                                        </div>
                                        {v.puede_editar ? (
                                            <Select value={v.estado} onValueChange={(estado) => router.patch(`/panel/visitas/${v.id}`, { estado }, { preserveScroll: true })}>
                                                <SelectTrigger size="sm" aria-label="Estado de la visita">
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
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PanelLayout>
    );
}

function AgendarVisita({ cotizacionId }: { cotizacionId: number }) {
    const [abierto, setAbierto] = useState(false);
    const form = useForm({ fecha: '', hora: '10:00', notas: '' });

    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/panel/cotizaciones/${cotizacionId}/visitas`, {
            preserveScroll: true,
            onSuccess: () => {
                setAbierto(false);
                form.reset();
            },
        });
    };

    return (
        <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <CalendarPlus /> Agendar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agendar visita al proyecto</DialogTitle>
                    <DialogDescription>Queda registrada en la atención y cuenta para la tasa de conversión.</DialogDescription>
                </DialogHeader>
                <form onSubmit={enviar} className="grid gap-4" noValidate>
                    <div className="grid grid-cols-2 gap-3">
                        <Campo id="v-fecha" etiqueta="Fecha" error={form.errors.fecha}>
                            <Input type="date" value={form.data.fecha} onChange={(e) => form.setData('fecha', e.target.value)} />
                        </Campo>
                        <Campo id="v-hora" etiqueta="Hora" error={form.errors.hora}>
                            <Input type="time" step={1800} value={form.data.hora} onChange={(e) => form.setData('hora', e.target.value)} />
                        </Campo>
                    </div>
                    <Campo id="v-notas" etiqueta="Notas (opcional)" error={form.errors.notas}>
                        <Textarea value={form.data.notas} onChange={(e) => form.setData('notas', e.target.value)} maxLength={500} />
                    </Campo>
                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>
                            Agendar visita
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
