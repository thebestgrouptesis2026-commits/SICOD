import { useForm } from '@inertiajs/react';
import { FileText, LoaderCircle, MessageCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Campo } from '@/components/campo';
import { EstadoLote } from '@/components/estado';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useMoneda } from '@/hooks/use-moneda';
import { CANAL, m2, metros, usd } from '@/lib/formato';
import { http, mensajeDeError } from '@/lib/http';
import { cn } from '@/lib/utils';
import type { Calculo, Lote, Proyecto, Reglas } from '@/types';

type Modalidad = 'financiado' | 'contado';

interface Formulario {
    atencion_token: string;
    lote_id: number;
    nombres: string;
    apellidos: string;
    tipo_documento: 'DNI' | 'CE' | 'PAS' | 'RUC';
    numero_documento: string;
    telefono: string;
    email: string;
    modalidad_pago: Modalidad;
    plazo_meses: number;
    canal: string;
    consentimiento: boolean;
}

/**
 * Ficha del lote y cotizador. Lo usan el cliente en la web (autoservicio)
 * y el asesor en el panel (cotizacion asistida). Los montos los calcula
 * siempre el servidor; aqui solo se muestran.
 */
export function Cotizador({
    lote,
    proyecto,
    reglas,
    modo = 'publico',
    canales,
}: {
    lote: Lote;
    proyecto: Proyecto;
    reglas: Reglas;
    modo?: 'publico' | 'asistido';
    canales?: string[];
}) {
    const { fmt, fmtOtra, moneda } = useMoneda();
    const disponible = lote.estado === 'disponible';

    const [modalidad, setModalidad] = useState<Modalidad>('financiado');
    const [plazo, setPlazo] = useState<number>(reglas.plazo_defecto);
    const [plazoOtro, setPlazoOtro] = useState('');
    const [calculo, setCalculo] = useState<Calculo | null>(null);
    const [errorCalculo, setErrorCalculo] = useState<string | null>(null);
    const [simulando, setSimulando] = useState(false);
    const [errorInicio, setErrorInicio] = useState<string | null>(null);

    const form = useForm<Formulario>({
        atencion_token: '',
        lote_id: lote.id,
        nombres: '',
        apellidos: '',
        tipo_documento: 'DNI',
        numero_documento: '',
        telefono: '',
        email: '',
        modalidad_pago: 'financiado',
        plazo_meses: reglas.plazo_defecto,
        canal: modo === 'asistido' ? 'whatsapp' : 'web',
        consentimiento: false,
    });

    const plazoEfectivo = plazoOtro ? Number(plazoOtro) : plazo;
    const plazoValido = Number.isInteger(plazoEfectivo) && plazoEfectivo >= 1 && plazoEfectivo <= reglas.plazo_maximo;

    // T0: al abrir un lote disponible se inicia la atencion en el servidor.
    useEffect(() => {
        setCalculo(null);
        setModalidad('financiado');
        setPlazo(reglas.plazo_defecto);
        setPlazoOtro('');
        setErrorInicio(null);
        form.setData((d) => ({ ...d, lote_id: lote.id, atencion_token: '' }));
        form.clearErrors();
        if (!disponible) return;

        let vigente = true;
        http.post('/cotizador/iniciar', { lote_id: lote.id, canal: modo === 'asistido' ? undefined : 'web' })
            .then(({ data }) => vigente && form.setData('atencion_token', data.token))
            .catch((e) => vigente && setErrorInicio(mensajeDeError(e)));
        return () => {
            vigente = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lote.id, disponible]);

    // Simulacion en vivo (CU-02), con una pausa breve entre cambios.
    const peticion = useRef(0);
    useEffect(() => {
        if (!disponible || (modalidad === 'financiado' && !plazoValido)) return;
        const id = ++peticion.current;
        setSimulando(true);
        const t = setTimeout(() => {
            http.post('/cotizador/simular', { lote_id: lote.id, modalidad_pago: modalidad, plazo_meses: modalidad === 'financiado' ? plazoEfectivo : undefined })
                .then(({ data }) => {
                    if (id !== peticion.current) return;
                    setCalculo(data.calculo);
                    setErrorCalculo(null);
                })
                .catch((e) => id === peticion.current && setErrorCalculo(mensajeDeError(e)))
                .finally(() => id === peticion.current && setSimulando(false));
        }, 160);
        return () => clearTimeout(t);
    }, [lote.id, disponible, modalidad, plazoEfectivo, plazoValido]);

    const emitir = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((d) => ({ ...d, modalidad_pago: modalidad, plazo_meses: plazoEfectivo, email: d.email || undefined }));
        form.post('/cotizador/emitir', { preserveScroll: true });
    };

    const wsAsesor = useMemo(() => {
        if (!proyecto.whatsapp) return null;
        const texto = `Hola, me interesa el lote ${lote.lote} de ${proyecto.nombre} (${m2(lote.area_m2)}).`;
        return `https://wa.me/${proyecto.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
    }, [lote, proyecto]);

    const tc = calculo?.tipo_cambio;

    return (
        <div className="grid gap-5">
            <header className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[26px] leading-none font-extrabold">
                        {lote.manzana} · Lote {lote.lote.split('-').pop()}
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        {lote.esquina ? 'Lote en esquina' : 'Lote interior'}
                        {lote.observacion?.includes('frente a') ? ` · ${lote.observacion.split('·').pop()?.trim()}` : ''}
                    </p>
                </div>
                <EstadoLote estado={lote.estado} />
            </header>

            <dl className="grid grid-cols-2 overflow-hidden rounded-lg bg-muted text-sm">
                {[
                    ['Frente', metros(lote.frente_m)],
                    ['Fondo', metros(lote.fondo_m)],
                    ['Área', m2(lote.area_m2)],
                    [`Precio por m² (${lote.esquina ? 'esquina' : 'interior'})`, usd(lote.precio_m2, false)],
                ].map(([k, v], i) => (
                    <div key={k} className={cn('px-3.5 py-2.5', i % 2 === 1 && 'border-l', i > 1 && 'border-t')}>
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="cifra mt-0.5 text-[15px] font-semibold">{v}</dd>
                    </div>
                ))}
            </dl>

            <div className="flex items-baseline justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                    Precio de lista
                    <span className="block text-xs">
                        {m2(lote.area_m2)} × {usd(lote.precio_m2)}
                    </span>
                </div>
                <div className="text-right">
                    <div className="cifra text-xl font-bold whitespace-nowrap">{fmt(lote.precio)}</div>
                    <div className="text-xs text-muted-foreground tabular">{fmtOtra(lote.precio)}</div>
                </div>
            </div>

            {!disponible ? (
                <div className="rounded-lg bg-muted p-4 text-sm">
                    <p className="font-semibold">Este lote no se puede cotizar.</p>
                    <p className="mt-1 text-muted-foreground">
                        Elige un lote en verde en el plano o consulta con un asesor por lotes similares en la misma manzana.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid gap-2">
                        <Label>Forma de pago</Label>
                        <ToggleGroup
                            type="single"
                            value={modalidad}
                            onValueChange={(v) => v && setModalidad(v as Modalidad)}
                            className="w-full"
                            aria-label="Forma de pago"
                        >
                            <ToggleGroupItem value="financiado">Financiado sin inicial</ToggleGroupItem>
                            <ToggleGroupItem value="contado">Al contado −{reglas.descuento_contado_pct}%</ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    {modalidad === 'financiado' && (
                        <div className="grid gap-2">
                            <Label htmlFor="plazo-otro">Plazo</Label>
                            <div className="flex flex-wrap items-center gap-2">
                                <ToggleGroup
                                    variante="chips"
                                    type="single"
                                    value={plazoOtro ? '' : String(plazo)}
                                    onValueChange={(v) => {
                                        if (!v) return;
                                        setPlazo(Number(v));
                                        setPlazoOtro('');
                                    }}
                                    aria-label="Plazo en meses"
                                >
                                    {reglas.plazos.map((p) => (
                                        <ToggleGroupItem key={p} value={String(p)} className="tabular">
                                            {p} meses
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm text-muted-foreground">Otro</span>
                                    <Input
                                        id="plazo-otro"
                                        inputMode="numeric"
                                        placeholder="meses"
                                        value={plazoOtro}
                                        onChange={(e) => setPlazoOtro(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        className="h-9 w-22"
                                        aria-invalid={!!plazoOtro && !plazoValido}
                                    />
                                </div>
                            </div>
                            {plazoOtro && !plazoValido && (
                                <p className="text-[13px] text-destructive">Escribe un plazo entre 1 y {reglas.plazo_maximo} meses.</p>
                            )}
                        </div>
                    )}

                    <div aria-live="polite" className="relative overflow-hidden rounded-xl bg-primary p-5 text-primary-foreground">
                        {errorCalculo ? (
                            <p className="text-sm">{errorCalculo}</p>
                        ) : !calculo ? (
                            <div className="grid gap-2">
                                <Skeleton className="h-4 w-28 bg-primary-foreground/20" />
                                <Skeleton className="h-10 w-52 bg-primary-foreground/20" />
                                <Skeleton className="h-4 w-40 bg-primary-foreground/20" />
                            </div>
                        ) : calculo.modalidad_pago === 'contado' ? (
                            <>
                                <p className="text-sm opacity-85">Precio al contado</p>
                                <p className="cifra mt-1 text-[38px] leading-none font-extrabold">{fmt(calculo.precio_final, true, tc)}</p>
                                <p className="mt-1 text-sm opacity-85 tabular">{fmtOtra(calculo.precio_final, tc)}</p>
                                <p className="mt-3 text-sm tabular">
                                    Ahorras {fmt(calculo.descuento_monto, true, tc)} ({calculo.descuento_pct}% sobre {fmt(calculo.precio_lista, true, tc)})
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm opacity-85">Cuota mensual</p>
                                <p className="cifra mt-1 text-[38px] leading-none font-extrabold">
                                    {fmt(calculo.cuota_mensual, true, tc)}
                                    <span className="ml-1.5 align-baseline font-sans text-base font-semibold opacity-80">/ mes</span>
                                </p>
                                <p className="mt-1 text-sm opacity-85 tabular">{fmtOtra(calculo.cuota_mensual, tc)} al mes</p>
                                <p className="mt-3 text-sm tabular">
                                    {calculo.plazo_meses} cuotas · sin cuota inicial · total {fmt(calculo.total_financiado, true, tc)}
                                    {calculo.tasa_anual_pct > 0 ? ` · TEA ${calculo.tasa_anual_pct}%` : ''}
                                </p>
                            </>
                        )}
                        {simulando && calculo && <LoaderCircle className="absolute top-4 right-4 size-4 animate-spin opacity-70" />}
                    </div>

                    <form onSubmit={emitir} className="grid gap-4" noValidate>
                        <div>
                            <h3 className="text-base font-bold">{modo === 'asistido' ? 'Datos del cliente' : 'Recibe tu proforma en PDF'}</h3>
                            {modo === 'publico' && (
                                <p className="mt-0.5 text-sm text-muted-foreground">Sin llamadas ni esperas: la descargas al instante.</p>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Campo id="nombres" etiqueta="Nombres" error={form.errors.nombres}>
                                <Input autoComplete="given-name" value={form.data.nombres} onChange={(e) => form.setData('nombres', e.target.value)} maxLength={120} />
                            </Campo>
                            <Campo id="apellidos" etiqueta="Apellidos" error={form.errors.apellidos}>
                                <Input autoComplete="family-name" value={form.data.apellidos} onChange={(e) => form.setData('apellidos', e.target.value)} maxLength={120} />
                            </Campo>
                        </div>

                        <div className="grid grid-cols-[7.5rem_1fr] gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="tipo_documento">Documento</Label>
                                <Select value={form.data.tipo_documento} onValueChange={(v) => form.setData('tipo_documento', v as Formulario['tipo_documento'])}>
                                    <SelectTrigger id="tipo_documento" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DNI">DNI</SelectItem>
                                        <SelectItem value="CE">Carné ext.</SelectItem>
                                        <SelectItem value="PAS">Pasaporte</SelectItem>
                                        <SelectItem value="RUC">RUC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Campo id="numero_documento" etiqueta="Número" error={form.errors.numero_documento}>
                                <Input
                                    inputMode={form.data.tipo_documento === 'DNI' || form.data.tipo_documento === 'RUC' ? 'numeric' : 'text'}
                                    maxLength={form.data.tipo_documento === 'DNI' ? 8 : 20}
                                    placeholder={form.data.tipo_documento === 'DNI' ? '8 dígitos' : ''}
                                    value={form.data.numero_documento}
                                    onChange={(e) =>
                                        form.setData(
                                            'numero_documento',
                                            form.data.tipo_documento === 'DNI' || form.data.tipo_documento === 'RUC' ? e.target.value.replace(/\D/g, '') : e.target.value,
                                        )
                                    }
                                />
                            </Campo>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Campo id="telefono" etiqueta="Celular" error={form.errors.telefono} sinClonar>
                                <div className="flex">
                                    <span className="grid place-items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground">+51</span>
                                    <Input
                                        id="telefono"
                                        type="tel"
                                        inputMode="numeric"
                                        autoComplete="tel-national"
                                        maxLength={9}
                                        placeholder="9XXXXXXXX"
                                        className="rounded-l-none"
                                        value={form.data.telefono}
                                        onChange={(e) => form.setData('telefono', e.target.value.replace(/\D/g, ''))}
                                        aria-invalid={!!form.errors.telefono || undefined}
                                    />
                                </div>
                            </Campo>
                            <Campo id="email" etiqueta="Correo (opcional)" error={form.errors.email}>
                                <Input type="email" autoComplete="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} maxLength={180} />
                            </Campo>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="canal">{modo === 'asistido' ? 'Canal por el que llegó' : '¿Cómo nos conociste?'}</Label>
                            <Select value={form.data.canal} onValueChange={(v) => form.setData('canal', v)}>
                                <SelectTrigger id="canal" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(canales ?? ['web', 'facebook', 'instagram', 'referido', 'otro']).map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {CANAL[c] ?? c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <div className="flex items-start gap-2.5">
                                <Checkbox
                                    id="consentimiento"
                                    checked={form.data.consentimiento}
                                    onCheckedChange={(v) => form.setData('consentimiento', v === true)}
                                    aria-invalid={!!form.errors.consentimiento || undefined}
                                    className="mt-0.5"
                                />
                                <Label htmlFor="consentimiento" className="text-[13px] leading-snug font-normal text-muted-foreground">
                                    {modo === 'asistido'
                                        ? 'El cliente autorizó el uso de sus datos para recibir esta cotización (Ley N.° 29733).'
                                        : 'Autorizo el uso de mis datos para recibir esta cotización y asesoría comercial (Ley N.° 29733).'}
                                </Label>
                            </div>
                            {form.errors.consentimiento && <p className="text-[13px] text-destructive">{form.errors.consentimiento}</p>}
                        </div>

                        {(errorInicio || form.errors.atencion_token || form.errors.lote_id || form.errors.plazo_meses) && (
                            <p role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">
                                {errorInicio ?? form.errors.atencion_token ?? form.errors.lote_id ?? form.errors.plazo_meses}
                            </p>
                        )}

                        <div className="flex gap-2">
                            <Button type="submit" size="lg" className="flex-1" disabled={form.processing || !form.data.atencion_token || !calculo}>
                                {form.processing ? <LoaderCircle className="animate-spin" /> : <FileText />}
                                {modo === 'asistido' ? 'Emitir cotización' : 'Generar mi proforma'}
                            </Button>
                            {modo === 'publico' && wsAsesor && (
                                <Button variant="outline" size="lg" asChild>
                                    <a href={wsAsesor} target="_blank" rel="noopener noreferrer" aria-label="Consultar por WhatsApp con un asesor">
                                        <MessageCircle />
                                    </a>
                                </Button>
                            )}
                        </div>

                        <p className="flex items-start gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="mt-px size-3.5 shrink-0" />
                            <span>
                                Precios en dólares{moneda === 'PEN' ? ' (en soles al tipo de cambio referencial)' : ''}. Cotización válida por {reglas.dias_validez} días,
                                sujeta a disponibilidad del lote.
                            </span>
                        </p>
                    </form>
                </>
            )}
        </div>
    );
}
