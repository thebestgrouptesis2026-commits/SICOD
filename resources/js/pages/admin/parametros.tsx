import { useForm } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { useState } from 'react';

import { Campo } from '@/components/campo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PanelLayout from '@/layouts/panel-layout';
import { soles, usd } from '@/lib/formato';

interface Props {
    parametros: {
        plazos: number[];
        plazo_defecto: number;
        plazo_maximo: number;
        descuento_contado_pct: number;
        tasa_anual_pct: number;
        dias_validez: number;
        sla_minutos: number;
        dias_reserva: number;
        tipo_cambio: number;
        tipo_cambio_fecha: string | null;
    };
    proyectos: { id: number; nombre: string; precio_m2_interior: number; precio_m2_esquina: number; whatsapp: string | null; telefono: string | null }[];
}

function hoy() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Parametros({ parametros: p, proyectos }: Props) {
    const form = useForm({
        plazos: p.plazos,
        plazo_defecto: String(p.plazo_defecto),
        plazo_maximo: String(p.plazo_maximo),
        descuento_contado_pct: String(p.descuento_contado_pct),
        tasa_anual_pct: String(p.tasa_anual_pct),
        sla_minutos: String(p.sla_minutos),
        dias_validez: String(p.dias_validez),
        dias_reserva: String(p.dias_reserva),
        tipo_cambio: String(p.tipo_cambio),
        tipo_cambio_fecha: p.tipo_cambio_fecha ?? hoy(),
    });
    const [nuevoPlazo, setNuevoPlazo] = useState('');

    const agregarPlazo = () => {
        const n = parseInt(nuevoPlazo, 10);
        if (n > 0 && !form.data.plazos.includes(n)) form.setData('plazos', [...form.data.plazos, n].sort((a, b) => a - b));
        setNuevoPlazo('');
    };

    const errorPlazos = Object.entries(form.errors).find(([k]) => k.startsWith('plazos'))?.[1];
    const tc = parseFloat(form.data.tipo_cambio) || 0;

    return (
        <PanelLayout
            titulo="Parámetros comerciales"
            descripcion="Precios, plazos, descuento y tipo de cambio que usa el cotizador. Las cotizaciones ya emitidas conservan las condiciones con las que se crearon."
        >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.put('/admin/parametros', { preserveScroll: true });
                    }}
                    className="grid content-start gap-6"
                    noValidate
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Financiamiento y descuento</CardTitle>
                            <CardDescription>Sin cuota inicial. La cuota es el precio del lote entre el número de meses.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5">
                            <div className="grid gap-2">
                                <span className="text-[13px] font-semibold text-foreground/85">Plazos que se muestran como opción</span>
                                <div className="flex flex-wrap items-center gap-2">
                                    {form.data.plazos.map((pl) => (
                                        <Badge key={pl} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5 text-sm">
                                            {pl} meses
                                            <button
                                                type="button"
                                                className="rounded-full p-0.5 hover:bg-foreground/10"
                                                onClick={() => form.setData('plazos', form.data.plazos.filter((x) => x !== pl))}
                                                aria-label={`Quitar ${pl} meses`}
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </Badge>
                                    ))}
                                    <div className="flex items-center gap-1.5">
                                        <Input
                                            value={nuevoPlazo}
                                            inputMode="numeric"
                                            onChange={(e) => setNuevoPlazo(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    agregarPlazo();
                                                }
                                            }}
                                            placeholder="meses"
                                            className="h-8 w-20"
                                            aria-label="Nuevo plazo en meses"
                                        />
                                        <Button type="button" size="sm" variant="outline" onClick={agregarPlazo}>
                                            Agregar
                                        </Button>
                                    </div>
                                </div>
                                {errorPlazos && <p className="text-[13px] text-destructive">{errorPlazos}</p>}
                                <p className="text-[13px] text-muted-foreground">El cliente también puede escribir otro plazo, siempre que no supere el máximo.</p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Campo id="plazo_defecto" etiqueta="Plazo sugerido (meses)" error={form.errors.plazo_defecto}>
                                    <Input inputMode="numeric" value={form.data.plazo_defecto} onChange={(e) => form.setData('plazo_defecto', e.target.value)} />
                                </Campo>
                                <Campo id="plazo_maximo" etiqueta="Plazo máximo (meses)" error={form.errors.plazo_maximo}>
                                    <Input inputMode="numeric" value={form.data.plazo_maximo} onChange={(e) => form.setData('plazo_maximo', e.target.value)} />
                                </Campo>
                                <Campo id="descuento_contado_pct" etiqueta="Descuento al contado (%)" error={form.errors.descuento_contado_pct}>
                                    <Input inputMode="decimal" value={form.data.descuento_contado_pct} onChange={(e) => form.setData('descuento_contado_pct', e.target.value)} />
                                </Campo>
                            </div>
                            <Campo
                                id="tasa_anual_pct"
                                etiqueta="Interés anual (TEA %)"
                                error={form.errors.tasa_anual_pct}
                                ayuda="0 = financiamiento directo sin intereses, como hoy. Con un valor mayor se aplica el sistema francés."
                                className="sm:max-w-xs"
                            >
                                <Input inputMode="decimal" value={form.data.tasa_anual_pct} onChange={(e) => form.setData('tasa_anual_pct', e.target.value)} />
                            </Campo>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tipo de cambio</CardTitle>
                            <CardDescription>Soles por dólar (venta). Se usa para mostrar los precios en soles.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Campo id="tipo_cambio" etiqueta="S/ por US$ 1" error={form.errors.tipo_cambio}>
                                <Input inputMode="decimal" value={form.data.tipo_cambio} onChange={(e) => form.setData('tipo_cambio', e.target.value)} />
                            </Campo>
                            <Campo id="tipo_cambio_fecha" etiqueta="Fecha" error={form.errors.tipo_cambio_fecha}>
                                <Input type="date" max={hoy()} value={form.data.tipo_cambio_fecha} onChange={(e) => form.setData('tipo_cambio_fecha', e.target.value)} />
                            </Campo>
                            <p className="text-[13px] text-muted-foreground sm:col-span-2">
                                Ejemplo: un lote de {usd(40960)} equivale a {soles(Math.round(40960 * tc * 100) / 100)}.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Medición y vigencia</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <Campo id="sla_minutos" etiqueta="Meta de atención (min)" error={form.errors.sla_minutos} ayuda="Indicador 2 de la tesis.">
                                <Input inputMode="numeric" value={form.data.sla_minutos} onChange={(e) => form.setData('sla_minutos', e.target.value)} />
                            </Campo>
                            <Campo id="dias_validez" etiqueta="Vigencia de la proforma (días)" error={form.errors.dias_validez}>
                                <Input inputMode="numeric" value={form.data.dias_validez} onChange={(e) => form.setData('dias_validez', e.target.value)} />
                            </Campo>
                            <Campo id="dias_reserva" etiqueta="Duración de una separación (días)" error={form.errors.dias_reserva}>
                                <Input inputMode="numeric" value={form.data.dias_reserva} onChange={(e) => form.setData('dias_reserva', e.target.value)} />
                            </Campo>
                        </CardContent>
                    </Card>

                    <Button type="submit" className="w-fit" disabled={form.processing || !form.isDirty}>
                        <Save /> Guardar parámetros
                    </Button>
                </form>

                <div className="grid content-start gap-6">
                    {proyectos.map((proyecto) => (
                        <PreciosProyecto key={proyecto.id} proyecto={proyecto} tc={p.tipo_cambio} />
                    ))}
                </div>
            </div>
        </PanelLayout>
    );
}

function PreciosProyecto({ proyecto, tc }: { proyecto: Props['proyectos'][number]; tc: number }) {
    const form = useForm({
        precio_m2_interior: String(proyecto.precio_m2_interior),
        precio_m2_esquina: String(proyecto.precio_m2_esquina),
        whatsapp: proyecto.whatsapp ?? '',
        telefono: proyecto.telefono ?? '',
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>{proyecto.nombre}</CardTitle>
                <CardDescription>Precio por m² en dólares según la ubicación del lote.</CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.put(`/admin/proyectos/${proyecto.id}`, { preserveScroll: true });
                    }}
                    className="grid gap-4"
                    noValidate
                >
                    <div className="grid grid-cols-2 gap-3">
                        <Campo id={`int-${proyecto.id}`} etiqueta="Interior (US$/m²)" error={form.errors.precio_m2_interior} ayuda={soles(Number(form.data.precio_m2_interior) * tc) + '/m²'}>
                            <Input inputMode="decimal" value={form.data.precio_m2_interior} onChange={(e) => form.setData('precio_m2_interior', e.target.value)} />
                        </Campo>
                        <Campo id={`esq-${proyecto.id}`} etiqueta="Esquina (US$/m²)" error={form.errors.precio_m2_esquina} ayuda={soles(Number(form.data.precio_m2_esquina) * tc) + '/m²'}>
                            <Input inputMode="decimal" value={form.data.precio_m2_esquina} onChange={(e) => form.setData('precio_m2_esquina', e.target.value)} />
                        </Campo>
                        <Campo id={`ws-${proyecto.id}`} etiqueta="WhatsApp de ventas" error={form.errors.whatsapp}>
                            <Input inputMode="numeric" value={form.data.whatsapp} onChange={(e) => form.setData('whatsapp', e.target.value.replace(/\D/g, ''))} placeholder="51987654321" />
                        </Campo>
                        <Campo id={`tel-${proyecto.id}`} etiqueta="Teléfono visible" error={form.errors.telefono}>
                            <Input value={form.data.telefono} onChange={(e) => form.setData('telefono', e.target.value)} />
                        </Campo>
                    </div>
                    <Button type="submit" variant="outline" className="w-fit" disabled={form.processing || !form.isDirty}>
                        <Save /> Guardar precios
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
