import { router } from '@inertiajs/react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

import { Paginacion } from '@/components/paginacion';
import { Vacio } from '@/components/vacio';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import PanelLayout from '@/layouts/panel-layout';
import { fechaHora } from '@/lib/formato';
import { cn } from '@/lib/utils';
import type { Paginado } from '@/types';

interface Registro {
    id: number;
    evento: string;
    descripcion: string;
    usuario: string | null;
    ip: string | null;
    fecha: string;
}

interface Props {
    registros: Paginado<Registro>;
    filtros: { tipo: string };
    alertas: { fallidos_24h: number; bloqueos_24h: number; ingresos_24h: number };
}

const VARIANTE: Record<string, 'bad' | 'warn' | 'ok' | 'secondary'> = {
    'login.fallido': 'warn',
    'login.bloqueado': 'bad',
    'login.exitoso': 'ok',
};

export default function Auditoria({ registros, filtros, alertas }: Props) {
    const riesgo = alertas.bloqueos_24h > 0 || alertas.fallidos_24h >= 10;

    return (
        <PanelLayout
            titulo="Bitácora de seguridad"
            descripcion="Registro de solo lectura: ingresos, intentos fallidos, cambios de estado de lotes, parámetros y cuentas, con usuario, IP y hora."
        >
            <div
                className={cn(
                    'mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border px-5 py-4',
                    riesgo ? 'border-bad/40 bg-bad-soft' : 'border-ok/30 bg-ok-soft',
                )}
            >
                {riesgo ? <ShieldAlert className="size-6 text-bad" /> : <ShieldCheck className="size-6 text-ok" />}
                <p className="text-sm font-semibold">{riesgo ? 'Hay intentos de ingreso sospechosos en las últimas 24 horas.' : 'Sin actividad sospechosa en las últimas 24 horas.'}</p>
                <dl className="ml-auto flex gap-6 text-sm">
                    <div>
                        <dt className="text-xs text-muted-foreground">Ingresos</dt>
                        <dd className="cifra text-lg font-bold">{alertas.ingresos_24h}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted-foreground">Fallidos</dt>
                        <dd className="cifra text-lg font-bold">{alertas.fallidos_24h}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted-foreground">Bloqueos</dt>
                        <dd className="cifra text-lg font-bold">{alertas.bloqueos_24h}</dd>
                    </div>
                </dl>
            </div>

            <Card className="gap-0 py-0">
                <div className="overflow-x-auto border-b px-4 py-3">
                    <ToggleGroup
                        type="single"
                        value={filtros.tipo}
                        onValueChange={(v) => v && router.get('/admin/auditoria', v === 'todos' ? {} : { tipo: v }, { preserveState: true, replace: true })}
                        aria-label="Tipo de evento"
                    >
                        <ToggleGroupItem value="todos">Todo</ToggleGroupItem>
                        <ToggleGroupItem value="seguridad">Accesos y cuentas</ToggleGroupItem>
                        <ToggleGroupItem value="inventario">Inventario</ToggleGroupItem>
                        <ToggleGroupItem value="configuracion">Configuración</ToggleGroupItem>
                    </ToggleGroup>
                </div>
                {registros.data.length === 0 ? (
                    <Vacio icono={ShieldCheck} titulo="Sin eventos registrados" />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Evento</TableHead>
                                <TableHead>Detalle</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>IP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registros.data.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="whitespace-nowrap tabular">{fechaHora(r.fecha)}</TableCell>
                                    <TableCell>
                                        <Badge variant={VARIANTE[r.evento] ?? 'secondary'} className="font-mono text-[11px]">
                                            {r.evento}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[28rem]">{r.descripcion}</TableCell>
                                    <TableCell className="whitespace-nowrap">{r.usuario ?? '—'}</TableCell>
                                    <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">{r.ip ?? '—'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                <Paginacion datos={registros} nombre="eventos" />
            </Card>
        </PanelLayout>
    );
}
