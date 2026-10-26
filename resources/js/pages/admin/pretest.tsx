import { useForm } from '@inertiajs/react';
import { ClipboardList, Plus } from 'lucide-react';

import { Campo } from '@/components/campo';
import { Paginacion } from '@/components/paginacion';
import { Vacio } from '@/components/vacio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PanelLayout from '@/layouts/panel-layout';
import { CANAL, fechaHora, minutos } from '@/lib/formato';
import type { Paginado } from '@/types';

interface Registro {
    id: number;
    codigo: string;
    canal: string;
    inicio_at: string;
    fin_at: string | null;
    duracion_min: number;
    cumple_sla: boolean;
    agendo_visita: boolean;
    asesor: string | null;
    observacion: string | null;
}

interface Props {
    registros: Paginado<Registro>;
    asesores: { id: number; nombre: string }[];
    proyectos: { id: number; nombre: string }[];
    canales: string[];
}

const SIN = 'ninguno';

export default function Pretest({ registros, asesores, proyectos, canales }: Props) {
    const form = useForm({
        canal: 'whatsapp',
        asesor_id: SIN,
        proyecto_id: String(proyectos[0]?.id ?? SIN),
        inicio_at: '',
        fin_at: '',
        genero_cotizacion: true,
        agendo_visita: false,
        observacion: '',
    });

    const inicio = form.data.inicio_at ? new Date(form.data.inicio_at).getTime() : 0;
    const fin = form.data.fin_at ? new Date(form.data.fin_at).getTime() : 0;
    const duracion = inicio && fin && fin >= inicio ? (fin - inicio) / 60000 : null;

    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            asesor_id: d.asesor_id === SIN ? null : Number(d.asesor_id),
            proyecto_id: d.proyecto_id === SIN ? null : Number(d.proyecto_id),
        }));
        form.post('/admin/pretest', { preserveScroll: true, onSuccess: () => form.reset('inicio_at', 'fin_at', 'observacion') });
    };

    return (
        <PanelLayout
            titulo="Registro del pretest (O1)"
            descripcion="Transcribe aquí cada atención de la ficha de registro de tiempos del proceso manual. Se guarda en la misma tabla que el postest para que ambas fases sean comparables."
        >
            <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
                <Card className="self-start">
                    <CardHeader>
                        <CardTitle>Nueva atención manual</CardTitle>
                        <CardDescription>Hora de la consulta (T0) y hora de entrega de la proforma (T1).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={enviar} className="grid gap-4" noValidate>
                            <Campo id="inicio_at" etiqueta="T0 · inicio" error={form.errors.inicio_at}>
                                <Input type="datetime-local" value={form.data.inicio_at} onChange={(e) => form.setData('inicio_at', e.target.value)} />
                            </Campo>
                            <Campo id="fin_at" etiqueta="T1 · proforma entregada" error={form.errors.fin_at}>
                                <Input type="datetime-local" value={form.data.fin_at} onChange={(e) => form.setData('fin_at', e.target.value)} />
                            </Campo>
                            {duracion !== null && (
                                <p className="rounded-md bg-muted px-3 py-2 text-sm">
                                    Duración: <b className="cifra">{minutos(duracion)}</b>
                                </p>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="canal">Canal</Label>
                                    <Select value={form.data.canal} onValueChange={(v) => form.setData('canal', v)}>
                                        <SelectTrigger id="canal" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {canales.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {CANAL[c] ?? c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="asesor_id">Asesor</Label>
                                    <Select value={form.data.asesor_id} onValueChange={(v) => form.setData('asesor_id', v)}>
                                        <SelectTrigger id="asesor_id" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={SIN}>Sin registrar</SelectItem>
                                            {asesores.map((a) => (
                                                <SelectItem key={a.id} value={String(a.id)}>
                                                    {a.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2.5">
                                <div className="flex items-center gap-2.5">
                                    <Checkbox id="genero" checked={form.data.genero_cotizacion} onCheckedChange={(v) => form.setData('genero_cotizacion', v === true)} />
                                    <Label htmlFor="genero" className="font-normal">Se entregó la cotización</Label>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Checkbox id="agendo" checked={form.data.agendo_visita} onCheckedChange={(v) => form.setData('agendo_visita', v === true)} />
                                    <Label htmlFor="agendo" className="font-normal">El cliente agendó una visita</Label>
                                </div>
                            </div>
                            <Campo id="observacion" etiqueta="Observación (opcional)" error={form.errors.observacion}>
                                <Input value={form.data.observacion} onChange={(e) => form.setData('observacion', e.target.value)} maxLength={255} />
                            </Campo>
                            <Button type="submit" disabled={form.processing}>
                                <Plus /> Registrar atención
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="gap-0 py-0">
                    {registros.data.length === 0 ? (
                        <Vacio icono={ClipboardList} titulo="Aún no hay registros del pretest">
                            La tesis trabaja con 24 atenciones del proceso manual. Regístralas con el formulario.
                        </Vacio>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Registro</TableHead>
                                    <TableHead>T0</TableHead>
                                    <TableHead className="text-right">Duración</TableHead>
                                    <TableHead>Meta</TableHead>
                                    <TableHead>Visita</TableHead>
                                    <TableHead>Canal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {registros.data.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <span className="font-semibold">{r.codigo}</span>
                                            {r.observacion === 'DEMO' && <Badge variant="muted" className="ml-2">Demo</Badge>}
                                            <span className="block text-xs text-muted-foreground">{r.asesor ?? 'Sin asesor'}</span>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{fechaHora(r.inicio_at)}</TableCell>
                                        <TableCell className="cifra text-right">{minutos(r.duracion_min)}</TableCell>
                                        <TableCell>
                                            <Badge variant={r.cumple_sla ? 'ok' : 'bad'}>{r.cumple_sla ? 'Cumple' : 'No cumple'}</Badge>
                                        </TableCell>
                                        <TableCell>{r.agendo_visita ? 'Sí' : 'No'}</TableCell>
                                        <TableCell>{CANAL[r.canal] ?? r.canal}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    <Paginacion datos={registros} nombre="registros" />
                </Card>
            </div>
        </PanelLayout>
    );
}
