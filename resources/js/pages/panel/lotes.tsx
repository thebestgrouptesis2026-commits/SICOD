import { router, useForm, usePage } from '@inertiajs/react';
import { History, Map as MapIcon, Pencil, Plus, Rows3, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Campo } from '@/components/campo';
import { EstadoLote } from '@/components/estado';
import { Plano } from '@/components/plano';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useMoneda } from '@/hooks/use-moneda';
import PanelLayout from '@/layouts/panel-layout';
import { ESTADO_LOTE, fechaHora, m2, metros } from '@/lib/formato';
import { cn } from '@/lib/utils';
import type { EstadoLote as TEstado, Lote, Proyecto, Resumen, SharedProps } from '@/types';

interface Props {
    proyectos: { id: number; nombre: string }[];
    proyecto: Proyecto;
    manzanas: { id: number; codigo: string; nombre: string }[];
    lotes: Lote[];
    historial: { id: number; lote: string; anterior: string | null; nuevo: string; motivo: string | null; usuario: string | null; fecha: string }[];
    resumen: Resumen | null;
    puede_gestionar: boolean;
}

export default function Lotes({ proyectos, proyecto, manzanas, lotes, historial, resumen, puede_gestionar }: Props) {
    const { auth } = usePage<SharedProps>().props;
    const { fmt } = useMoneda();
    const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
    const [filtroMz, setFiltroMz] = useState('todas');
    const seleccionado = useMemo(() => lotes.find((l) => l.id === seleccionadoId) ?? null, [lotes, seleccionadoId]);
    const supervisor = auth.usuario?.rol !== 'asesor';

    const visibles = lotes.filter((l) => filtroMz === 'todas' || l.manzana_codigo === filtroMz);

    return (
        <PanelLayout
            titulo="Lotes y disponibilidad"
            descripcion="Cada cambio de estado se refleja al instante en el plano público y queda registrado con fecha, usuario e IP."
            acciones={
                puede_gestionar && (
                    <>
                        <NuevaManzana proyectoId={proyecto.id} />
                        <FormLote manzanas={manzanas} />
                    </>
                )
            }
        >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                <Tabs defaultValue="plano" className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <TabsList>
                            <TabsTrigger value="plano">
                                <MapIcon /> Plano
                            </TabsTrigger>
                            <TabsTrigger value="tabla">
                                <Rows3 /> Tabla
                            </TabsTrigger>
                        </TabsList>
                        {proyectos.length > 1 && (
                            <Select value={String(proyecto.id)} onValueChange={(v) => router.get('/panel/lotes', { proyecto: v })}>
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
                        {resumen && (
                            <p className="ml-auto text-sm text-muted-foreground">
                                <b className="cifra text-ok">{resumen.disponibles}</b> disponibles · <b className="cifra text-warn">{resumen.reservados}</b> separados ·{' '}
                                <b className="cifra text-bad">{resumen.vendidos}</b> vendidos
                                {Number(resumen.bloqueados) > 0 && (
                                    <>
                                        {' '}· <b className="cifra text-lock">{resumen.bloqueados}</b> bloqueados
                                    </>
                                )}
                            </p>
                        )}
                    </div>

                    <TabsContent value="plano">
                        <Card className="py-3">
                            <div className="px-3">
                                <Plano lotes={lotes} seleccionado={seleccionadoId} onSeleccionar={(l) => setSeleccionadoId(l.id)} />
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tabla">
                        <Card className="gap-0 py-0">
                            <div className="border-b px-4 py-3">
                                <ToggleGroup type="single" value={filtroMz} onValueChange={(v) => v && setFiltroMz(v)} aria-label="Manzana">
                                    <ToggleGroupItem value="todas">Todas</ToggleGroupItem>
                                    {manzanas.map((m) => (
                                        <ToggleGroupItem key={m.id} value={m.codigo}>
                                            {m.nombre}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Lote</TableHead>
                                        <TableHead>Ubicación</TableHead>
                                        <TableHead className="text-right">Área</TableHead>
                                        <TableHead className="text-right">Precio de lista</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibles.map((l) => (
                                        <TableRow key={l.id} data-state={l.id === seleccionadoId ? 'selected' : undefined} className="cursor-pointer" onClick={() => setSeleccionadoId(l.id)}>
                                            <TableCell className="font-semibold">{l.lote}</TableCell>
                                            <TableCell>{l.esquina ? 'Esquina' : 'Interior'}</TableCell>
                                            <TableCell className="cifra text-right">{m2(l.area_m2)}</TableCell>
                                            <TableCell className="cifra text-right">{fmt(l.precio)}</TableCell>
                                            <TableCell>
                                                <EstadoLote estado={l.estado} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="grid content-start gap-6 xl:sticky xl:top-20">
                    <Card>
                        {seleccionado ? (
                            <PanelLote key={seleccionado.id} lote={seleccionado} supervisor={supervisor} puedeGestionar={puede_gestionar} manzanas={manzanas} />
                        ) : (
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Elige un lote en el plano o en la tabla para cambiar su estado.</p>
                            </CardContent>
                        )}
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="size-4 text-primary" /> Últimos cambios
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {historial.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aún no hay cambios de estado.</p>
                            ) : (
                                <ol className="grid gap-3">
                                    {historial.map((h) => (
                                        <li key={h.id} className="text-sm">
                                            <p>
                                                <b>{h.lote}</b>: {ESTADO_LOTE[h.anterior ?? ''] ?? '—'} → <b>{ESTADO_LOTE[h.nuevo] ?? h.nuevo}</b>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {fechaHora(h.fecha)} · {h.usuario ?? 'Sistema'}
                                                {h.motivo ? ` · ${h.motivo}` : ''}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PanelLayout>
    );
}

function PanelLote({ lote, supervisor, puedeGestionar, manzanas }: { lote: Lote; supervisor: boolean; puedeGestionar: boolean; manzanas: Props['manzanas'] }) {
    const { fmt } = useMoneda();
    const form = useForm<{ estado: TEstado; motivo: string }>({ estado: lote.estado, motivo: '' });
    const estados: TEstado[] = supervisor ? ['disponible', 'reservado', 'vendido', 'bloqueado'] : ['disponible', 'reservado', 'vendido'];
    const bloqueadoParaAsesor = !supervisor && lote.estado === 'bloqueado';

    const guardar = (e: React.FormEvent) => {
        e.preventDefault();
        form.patch(`/panel/lotes/${lote.id}/estado`, { preserveScroll: true, onSuccess: () => form.setData('motivo', '') });
    };

    return (
        <>
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 text-xl">
                    {lote.manzana} · Lote {lote.lote.split('-').pop()}
                    <EstadoLote estado={lote.estado} />
                </CardTitle>
                <CardDescription>
                    {lote.esquina ? 'Esquina' : 'Interior'} · {metros(lote.frente_m)} × {metros(lote.fondo_m)} · {m2(lote.area_m2)} · {fmt(lote.precio)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={guardar} className="grid gap-4" key={lote.id}>
                    <div className="grid gap-2">
                        <Label>Nuevo estado</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {estados.map((e) => (
                                <button
                                    type="button"
                                    key={e}
                                    disabled={bloqueadoParaAsesor}
                                    onClick={() => form.setData('estado', e)}
                                    aria-pressed={form.data.estado === e}
                                    className={cn(
                                        'rounded-md border px-3 py-2 text-left text-sm font-semibold transition-colors disabled:opacity-50',
                                        form.data.estado === e ? 'border-primary bg-accent text-accent-foreground' : 'hover:border-foreground/30',
                                    )}
                                >
                                    {ESTADO_LOTE[e]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Campo id="motivo" etiqueta="Motivo (queda en el historial)" error={form.errors.motivo ?? form.errors.estado}>
                        <Input value={form.data.motivo} onChange={(e) => form.setData('motivo', e.target.value)} maxLength={200} placeholder="Ej. Separación con voucher 0045" />
                    </Campo>
                    <Button type="submit" disabled={form.processing || form.data.estado === lote.estado || bloqueadoParaAsesor}>
                        Guardar estado
                    </Button>
                    {bloqueadoParaAsesor && <p className="text-xs text-muted-foreground">Solo un supervisor puede desbloquear este lote.</p>}
                </form>

                {puedeGestionar && (
                    <div className="mt-5 flex gap-2 border-t pt-4">
                        <FormLote manzanas={manzanas} lote={lote} />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                    <Trash2 /> Eliminar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar el lote {lote.lote}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Solo se puede eliminar si no tiene cotizaciones. Si ya fue cotizado, bloquéalo en lugar de eliminarlo.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => router.delete(`/panel/lotes/${lote.id}`, { preserveScroll: true })}>
                                        Eliminar lote
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardContent>
        </>
    );
}

function FormLote({ manzanas, lote }: { manzanas: Props['manzanas']; lote?: Lote }) {
    const [abierto, setAbierto] = useState(false);
    const form = useForm({
        manzana_id: String(lote?.manzana_id ?? manzanas[0]?.id ?? ''),
        codigo: lote?.lote ?? '',
        frente_m: String(lote?.frente_m ?? '8'),
        fondo_m: String(lote?.fondo_m ?? '16'),
        precio_lista: '',
        esquina: lote?.esquina ?? false,
        observacion: lote?.observacion ?? '',
    });

    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        const opciones = { preserveScroll: true, onSuccess: () => setAbierto(false) };
        form.transform((d) => ({ ...d, precio_lista: d.precio_lista || null }));
        if (lote) form.put(`/panel/lotes/${lote.id}`, opciones);
        else form.post('/panel/lotes', opciones);
    };

    return (
        <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild>
                {lote ? (
                    <Button variant="outline" size="sm">
                        <Pencil /> Editar medidas
                    </Button>
                ) : (
                    <Button>
                        <Plus /> Nuevo lote
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{lote ? `Editar lote ${lote.lote}` : 'Nuevo lote'}</DialogTitle>
                    <DialogDescription>El área se calcula sola (frente × fondo). Deja el precio vacío para usar el precio por m² del proyecto.</DialogDescription>
                </DialogHeader>
                <form onSubmit={enviar} className="grid gap-4" noValidate>
                    <div className="grid grid-cols-2 gap-3">
                        {!lote && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="manzana_id">Manzana</Label>
                                <Select value={form.data.manzana_id} onValueChange={(v) => form.setData('manzana_id', v)}>
                                    <SelectTrigger id="manzana_id" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {manzanas.map((m) => (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Campo id="codigo" etiqueta="Código" error={form.errors.codigo}>
                            <Input value={form.data.codigo} onChange={(e) => form.setData('codigo', e.target.value.toUpperCase())} placeholder="A-17" maxLength={20} />
                        </Campo>
                        <Campo id="frente_m" etiqueta="Frente (m)" error={form.errors.frente_m}>
                            <Input inputMode="decimal" value={form.data.frente_m} onChange={(e) => form.setData('frente_m', e.target.value)} />
                        </Campo>
                        <Campo id="fondo_m" etiqueta="Fondo (m)" error={form.errors.fondo_m}>
                            <Input inputMode="decimal" value={form.data.fondo_m} onChange={(e) => form.setData('fondo_m', e.target.value)} />
                        </Campo>
                        <Campo id="precio_lista" etiqueta="Precio fijo US$ (opcional)" error={form.errors.precio_lista}>
                            <Input inputMode="decimal" value={form.data.precio_lista} onChange={(e) => form.setData('precio_lista', e.target.value)} placeholder="Automático" />
                        </Campo>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Checkbox id="esquina" checked={form.data.esquina} onCheckedChange={(v) => form.setData('esquina', v === true)} />
                        <Label htmlFor="esquina" className="font-normal">Lote en esquina (usa el precio por m² de esquina)</Label>
                    </div>
                    <Campo id="observacion" etiqueta="Observación" error={form.errors.observacion}>
                        <Input value={form.data.observacion} onChange={(e) => form.setData('observacion', e.target.value)} maxLength={255} placeholder="Interior · frente a Calle Los Pinos" />
                    </Campo>
                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>
                            {lote ? 'Guardar cambios' : 'Crear lote'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function NuevaManzana({ proyectoId }: { proyectoId: number }) {
    const [abierto, setAbierto] = useState(false);
    const form = useForm({ proyecto_id: proyectoId, codigo: '', nombre: '' });

    return (
        <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus /> Manzana
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Nueva manzana</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post('/panel/manzanas', { preserveScroll: true, onSuccess: () => setAbierto(false) });
                    }}
                    className="grid gap-4"
                    noValidate
                >
                    <Campo id="mz-codigo" etiqueta="Código" error={form.errors.codigo}>
                        <Input
                            value={form.data.codigo}
                            onChange={(e) => {
                                const c = e.target.value.toUpperCase();
                                form.setData((d) => ({ ...d, codigo: c, nombre: c ? `Mz. ${c}` : '' }));
                            }}
                            placeholder="E"
                            maxLength={20}
                        />
                    </Campo>
                    <Campo id="mz-nombre" etiqueta="Nombre" error={form.errors.nombre}>
                        <Input value={form.data.nombre} onChange={(e) => form.setData('nombre', e.target.value)} maxLength={60} />
                    </Campo>
                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>
                            Crear manzana
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
