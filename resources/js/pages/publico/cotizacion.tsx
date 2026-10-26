import { useForm } from '@inertiajs/react';
import { CalendarCheck, CircleCheck, Download, MessageCircle } from 'lucide-react';

import { Campo } from '@/components/campo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMoneda } from '@/hooks/use-moneda';
import PublicoLayout from '@/layouts/publico-layout';
import { fecha, fechaHora, m2, metros } from '@/lib/formato';

interface Props {
    cotizacion: {
        token: string;
        codigo: string;
        cliente_nombre: string;
        cliente_documento: string;
        cliente_telefono: string;
        modalidad_pago: 'contado' | 'financiado';
        tipo_cambio: number;
        precio_m2: number;
        precio_lista: number;
        descuento_pct: number;
        descuento_monto: number;
        precio_final: number;
        plazo_meses: number;
        cuota_mensual: number;
        total_financiado: number;
        emitida_at: string;
        valida_hasta: string | null;
        vigente: boolean;
        lote: { codigo: string; manzana: string; area_m2: number; frente_m: number; fondo_m: number; esquina: boolean };
        proyecto: { nombre: string; ubicacion: string | null; distrito: string | null; telefono: string | null };
        visita: { programada_para: string } | null;
    };
    whatsapp_asesor: string | null;
}

const HORAS = Array.from({ length: 19 }, (_, i) => {
    const total = 8 * 60 + i * 30;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
});

function hoy() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CotizacionPublica({ cotizacion: c, whatsapp_asesor }: Props) {
    const { fmt, fmtOtra } = useMoneda();
    const tc = c.tipo_cambio;
    const financiado = c.modalidad_pago === 'financiado';
    const form = useForm({ fecha: '', hora: '10:00', notas: '' });

    const agendar = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/cotizacion/${c.token}/visita`, { preserveScroll: true, onSuccess: () => form.reset('notas') });
    };

    return (
        <PublicoLayout titulo={`Proforma ${c.codigo}`}>
            <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="grid min-w-0 gap-6">
                    <div className="flex items-start gap-3">
                        <CircleCheck className="mt-1 size-7 shrink-0 text-ok" />
                        <div>
                            <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] leading-tight font-extrabold">Tu proforma está lista</h1>
                            <p className="mt-1 text-muted-foreground">
                                {c.cliente_nombre} · {c.codigo} · emitida el {fechaHora(c.emitida_at)}
                            </p>
                        </div>
                    </div>

                    <Card className="overflow-hidden p-0">
                        <div className="bg-primary px-6 py-6 text-primary-foreground">
                            <p className="text-sm opacity-85">{financiado ? 'Cuota mensual' : 'Precio al contado'}</p>
                            <p className="cifra mt-1 text-[clamp(2.2rem,5vw,3rem)] leading-none font-extrabold">
                                {fmt(financiado ? c.cuota_mensual : c.precio_final, true, tc)}
                                {financiado && <span className="ml-2 font-sans text-lg font-semibold opacity-80">/ mes</span>}
                            </p>
                            <p className="mt-2 text-sm opacity-90 tabular">
                                {fmtOtra(financiado ? c.cuota_mensual : c.precio_final, tc)}
                                {financiado ? ` al mes · ${c.plazo_meses} cuotas · sin cuota inicial` : ` · incluye ${c.descuento_pct}% de descuento`}
                            </p>
                        </div>
                        <dl className="grid divide-y text-[15px]">
                            {[
                                ['Lote', `${c.lote.manzana} · Lote ${c.lote.codigo.split('-').pop()} (${c.lote.esquina ? 'esquina' : 'interior'})`],
                                ['Medidas', `${metros(c.lote.frente_m)} de frente × ${metros(c.lote.fondo_m)} de fondo · ${m2(c.lote.area_m2)}`],
                                ['Precio por m²', fmt(c.precio_m2, true, tc)],
                                ['Precio de lista', fmt(c.precio_lista, true, tc)],
                                ...(financiado
                                    ? [
                                          ['Plazo', `${c.plazo_meses} meses`],
                                          ['Total a pagar', fmt(c.total_financiado, true, tc)],
                                      ]
                                    : [
                                          [`Descuento al contado (${c.descuento_pct}%)`, '− ' + fmt(c.descuento_monto, true, tc)],
                                          ['Precio final', fmt(c.precio_final, true, tc)],
                                      ]),
                                ['Tipo de cambio referencial', `S/ ${tc.toFixed(3)} por dólar`],
                            ].map(([k, v]) => (
                                <div key={k} className="flex flex-wrap justify-between gap-x-6 gap-y-0.5 px-6 py-3">
                                    <dt className="text-muted-foreground">{k}</dt>
                                    <dd className="cifra font-semibold">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </Card>

                    <div className="flex flex-wrap gap-2">
                        <Button size="lg" asChild>
                            <a href={`/cotizacion/${c.token}/pdf`}>
                                <Download /> Descargar PDF
                            </a>
                        </Button>
                        {whatsapp_asesor && (
                            <Button size="lg" variant="outline" asChild>
                                <a href={whatsapp_asesor} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle /> Hablar con un asesor
                                </a>
                            </Button>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {c.vigente ? `Válida hasta el ${fecha(c.valida_hasta)}` : 'Esta proforma ya venció; pide una nueva para confirmar precio y disponibilidad'}.
                        Documento {c.cliente_documento} · celular {c.cliente_telefono}. Guarda este enlace: es privado y solo tú lo tienes.
                    </p>
                </div>

                <Card className="self-start">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CalendarCheck className="size-5 text-primary" /> Visita el proyecto
                        </CardTitle>
                        <CardDescription>Conoce el lote en persona. Te confirmamos la hora por WhatsApp.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {c.visita && (
                            <div className="mb-4 rounded-lg bg-ok-soft px-3 py-2.5 text-sm text-ok">
                                <Badge variant="ok" className="mb-1 bg-card">Visita agendada</Badge>
                                <p className="font-semibold">{fechaHora(c.visita.programada_para)}</p>
                                <p className="text-xs opacity-90">Puedes cambiarla con el formulario.</p>
                            </div>
                        )}
                        <form onSubmit={agendar} className="grid gap-3" noValidate>
                            <Campo id="fecha" etiqueta="Fecha" error={form.errors.fecha}>
                                <Input type="date" min={hoy()} value={form.data.fecha} onChange={(e) => form.setData('fecha', e.target.value)} />
                            </Campo>
                            <div className="grid gap-1.5">
                                <Label htmlFor="hora">Hora</Label>
                                <Select value={form.data.hora} onValueChange={(v) => form.setData('hora', v)}>
                                    <SelectTrigger id="hora" className="w-full" aria-invalid={!!form.errors.hora || undefined}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {HORAS.map((h) => (
                                            <SelectItem key={h} value={h}>
                                                {h}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.hora && <p className="text-[13px] text-destructive">{form.errors.hora}</p>}
                            </div>
                            <Button type="submit" disabled={form.processing || !c.vigente}>
                                {c.visita ? 'Cambiar visita' : 'Agendar visita'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PublicoLayout>
    );
}
