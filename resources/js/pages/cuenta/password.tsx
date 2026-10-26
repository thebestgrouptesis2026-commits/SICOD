import { useForm } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';

import { Campo } from '@/components/campo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PanelLayout from '@/layouts/panel-layout';

export default function CambiarPassword({ obligatorio }: { obligatorio: boolean }) {
    const form = useForm({ password_actual: '', password: '', password_confirmation: '' });

    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        form.put('/cuenta/password', { onFinish: () => form.reset() });
    };

    const p = form.data.password;
    const reglas = [
        ['10 caracteres o más', p.length >= 10],
        ['Mayúsculas y minúsculas', /[a-z]/.test(p) && /[A-Z]/.test(p)],
        ['Al menos un número', /\d/.test(p)],
    ] as const;

    return (
        <PanelLayout
            titulo="Cambiar contraseña"
            descripcion={obligatorio ? 'Tu cuenta usa una contraseña inicial. Cámbiala para continuar; al hacerlo se cerrarán tus otras sesiones.' : 'Al cambiarla se cerrarán tus sesiones abiertas en otros equipos.'}
        >
            <Card className="max-w-xl">
                <CardContent>
                    <form onSubmit={enviar} className="grid gap-4" noValidate>
                        <Campo id="password_actual" etiqueta="Contraseña actual" error={form.errors.password_actual}>
                            <Input type="password" autoComplete="current-password" value={form.data.password_actual} onChange={(e) => form.setData('password_actual', e.target.value)} />
                        </Campo>
                        <Campo id="password" etiqueta="Nueva contraseña" error={form.errors.password}>
                            <Input type="password" autoComplete="new-password" value={p} onChange={(e) => form.setData('password', e.target.value)} />
                        </Campo>
                        <ul className="grid gap-1 text-sm">
                            {reglas.map(([texto, ok]) => (
                                <li key={texto} className={ok ? 'text-ok' : 'text-muted-foreground'}>
                                    {ok ? '✓' : '·'} {texto}
                                </li>
                            ))}
                        </ul>
                        <Campo id="password_confirmation" etiqueta="Repite la nueva contraseña" error={form.errors.password_confirmation}>
                            <Input type="password" autoComplete="new-password" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} />
                        </Campo>
                        <Button type="submit" className="w-fit" disabled={form.processing}>
                            <KeyRound /> Guardar contraseña
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </PanelLayout>
    );
}
