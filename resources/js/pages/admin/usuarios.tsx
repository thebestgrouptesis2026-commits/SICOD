import { router, useForm, usePage } from '@inertiajs/react';
import { Pencil, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { Campo } from '@/components/campo';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PanelLayout from '@/layouts/panel-layout';
import { haceCuanto, ROL } from '@/lib/formato';
import type { Rol, SharedProps } from '@/types';

interface Cuenta {
    id: number;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string | null;
    rol: Rol;
    activo: boolean;
    debe_cambiar_password: boolean;
    ultimo_acceso_at: string | null;
    atenciones: number;
    iniciales: string;
}

export default function Usuarios({ usuarios }: { usuarios: Cuenta[] }) {
    const { auth } = usePage<SharedProps>().props;

    return (
        <PanelLayout
            titulo="Usuarios"
            descripcion="Las cuentas no se borran: se desactivan, porque sus atenciones forman parte de los datos del estudio. Al desactivar una cuenta se cierran sus sesiones abiertas."
            acciones={<FormUsuario />}
        >
            <Card className="gap-0 py-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Persona</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Atenciones</TableHead>
                            <TableHead>Último ingreso</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usuarios.map((u) => {
                            const esUnoMismo = u.id === auth.usuario?.id;
                            return (
                                <TableRow key={u.id} className={u.activo ? '' : 'opacity-60'}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{u.iniciales}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">
                                                    {u.nombres} {u.apellidos} {esUnoMismo && <span className="font-normal text-muted-foreground">(tú)</span>}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{ROL[u.rol]}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1.5">
                                            <Badge variant={u.activo ? 'ok' : 'muted'}>{u.activo ? 'Activa' : 'Desactivada'}</Badge>
                                            {u.debe_cambiar_password && <Badge variant="warn">Contraseña temporal</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="cifra text-right">{u.atenciones}</TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">{u.ultimo_acceso_at ? haceCuanto(u.ultimo_acceso_at) : 'Nunca'}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1.5">
                                            <FormUsuario usuario={u} />
                                            {!esUnoMismo && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            {u.activo ? 'Desactivar' : 'Activar'}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                {u.activo ? 'Desactivar' : 'Activar'} la cuenta de {u.nombres}
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {u.activo
                                                                    ? 'Ya no podrá ingresar y se cerrarán sus sesiones abiertas. Sus atenciones se conservan.'
                                                                    : 'Podrá volver a ingresar con su contraseña actual.'}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => router.patch(`/admin/usuarios/${u.id}/activo`, {}, { preserveScroll: true })}>
                                                                {u.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>
        </PanelLayout>
    );
}

function FormUsuario({ usuario }: { usuario?: Cuenta }) {
    const [abierto, setAbierto] = useState(false);
    const form = useForm({
        nombres: usuario?.nombres ?? '',
        apellidos: usuario?.apellidos ?? '',
        email: usuario?.email ?? '',
        telefono: usuario?.telefono ?? '',
        rol: usuario?.rol ?? ('asesor' as Rol),
        password: '',
    });

    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        const opciones = {
            preserveScroll: true,
            onSuccess: () => {
                setAbierto(false);
                if (!usuario) form.reset();
                else form.setData('password', '');
            },
        };
        if (usuario) form.put(`/admin/usuarios/${usuario.id}`, opciones);
        else form.post('/admin/usuarios', opciones);
    };

    return (
        <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild>
                {usuario ? (
                    <Button variant="ghost" size="icon-sm" aria-label={`Editar a ${usuario.nombres}`}>
                        <Pencil />
                    </Button>
                ) : (
                    <Button>
                        <UserPlus /> Nueva cuenta
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{usuario ? `Editar a ${usuario.nombres}` : 'Nueva cuenta'}</DialogTitle>
                    <DialogDescription>
                        {usuario
                            ? 'Si escribes una contraseña nueva, la persona deberá cambiarla al ingresar y se cerrarán sus sesiones.'
                            : 'La contraseña es temporal: el sistema pedirá cambiarla en el primer ingreso.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={enviar} className="grid gap-4" noValidate>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Campo id={`nombres-${usuario?.id ?? 'n'}`} etiqueta="Nombres" error={form.errors.nombres}>
                            <Input value={form.data.nombres} onChange={(e) => form.setData('nombres', e.target.value)} />
                        </Campo>
                        <Campo id={`apellidos-${usuario?.id ?? 'n'}`} etiqueta="Apellidos" error={form.errors.apellidos}>
                            <Input value={form.data.apellidos} onChange={(e) => form.setData('apellidos', e.target.value)} />
                        </Campo>
                        <Campo id={`email-${usuario?.id ?? 'n'}`} etiqueta="Correo" error={form.errors.email}>
                            <Input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                        </Campo>
                        <Campo id={`tel-${usuario?.id ?? 'n'}`} etiqueta="Celular" error={form.errors.telefono}>
                            <Input value={form.data.telefono} onChange={(e) => form.setData('telefono', e.target.value)} />
                        </Campo>
                        <div className="grid gap-1.5">
                            <Label htmlFor={`rol-${usuario?.id ?? 'n'}`}>Rol</Label>
                            <Select value={form.data.rol} onValueChange={(v) => form.setData('rol', v as Rol)}>
                                <SelectTrigger id={`rol-${usuario?.id ?? 'n'}`} className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asesor">Asesor · cotiza y gestiona sus leads</SelectItem>
                                    <SelectItem value="gerente">Gerente · ve toda la cartera e indicadores</SelectItem>
                                    <SelectItem value="admin">Administrador · además cuentas y seguridad</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.errors.rol && <p className="text-[13px] text-destructive">{form.errors.rol}</p>}
                        </div>
                        <Campo
                            id={`pass-${usuario?.id ?? 'n'}`}
                            etiqueta={usuario ? 'Nueva contraseña (opcional)' : 'Contraseña temporal'}
                            error={form.errors.password}
                            ayuda="10 caracteres, mayúsculas, minúsculas y números."
                        >
                            <Input type="password" autoComplete="new-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                        </Campo>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>
                            {usuario ? 'Guardar cambios' : 'Crear cuenta'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
