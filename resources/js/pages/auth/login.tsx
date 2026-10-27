import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ChartColumnBig, FileText, LayoutGrid, LoaderCircle, LockKeyhole } from 'lucide-react';

import { Avisos } from '@/components/avisos';
import { Campo } from '@/components/campo';
import { Marca } from '@/components/marca';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';

/** Fondo de la columna derecha: una manzana del plano, en trazo. */
function ManzanaDecorativa() {
    const anchos = [9, 8, 8, 8, 8, 8, 8, 9];
    const vendidos = new Set([2, 3, 11, 14]);
    const separados = new Set([8, 13]);
    let x = 0;
    const norte = anchos.map((w, i) => {
        const r = { x, w, i };
        x += w;
        return r;
    });
    x = 0;
    const sur = [...anchos].reverse().map((w, i) => {
        const r = { x, w, i: 15 - i };
        x += w;
        return r;
    });
    const clase = (i: number) =>
        vendidos.has(i) ? 'fill-primary-foreground/25' : separados.has(i) ? 'fill-primary-foreground/45' : 'fill-primary-foreground/10';

    return (
        <svg viewBox="-4 -4 74 40" className="w-full" aria-hidden="true">
            {norte.map((l) => (
                <rect key={`n${l.i}`} x={l.x + 0.25} y={0.25} width={l.w - 0.5} height={15.5} rx={0.6} className={clase(l.i)} stroke="currentColor" strokeOpacity={0.35} strokeWidth={0.3} />
            ))}
            {sur.map((l) => (
                <rect key={`s${l.i}`} x={l.x + 0.25} y={16.25} width={l.w - 0.5} height={15.5} rx={0.6} className={clase(l.i)} stroke="currentColor" strokeOpacity={0.35} strokeWidth={0.3} />
            ))}
        </svg>
    );
}

export default function Login() {
    const form = useForm({ email: '', password: '', recordarme: false });

    const enviar = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/ingresar', { onFinish: () => form.reset('password') });
    };

    return (
        <>
            <Head title="Ingresar" />
            <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                <div className="flex flex-col px-6 py-6 sm:px-10">
                    <div className="flex items-center justify-between">
                        <Marca />
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/">
                                <ArrowLeft /> Ver lotes
                            </Link>
                        </Button>
                    </div>

                    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
                        <h1 className="text-[30px] leading-tight font-extrabold">Ingresa al panel comercial</h1>
                        <p className="mt-1.5 text-muted-foreground">Para asesores, gerencia y administración de Inmobiliaria Taipe.</p>

                        <form onSubmit={enviar} className="mt-8 grid gap-4" noValidate>
                            <Campo id="email" etiqueta="Correo" error={form.errors.email}>
                                <Input
                                    type="email"
                                    autoComplete="username"
                                    autoFocus
                                    placeholder="nombre@taipe.pe"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                />
                            </Campo>
                            <Campo id="password" etiqueta="Contraseña" error={form.errors.password}>
                                <Input type="password" autoComplete="current-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                            </Campo>
                            <div className="flex items-center gap-2.5">
                                <Checkbox id="recordarme" checked={form.data.recordarme} onCheckedChange={(v) => form.setData('recordarme', v === true)} />
                                <Label htmlFor="recordarme" className="font-normal text-muted-foreground">
                                    Mantener la sesión en este equipo
                                </Label>
                            </div>
                            <Button type="submit" size="lg" className="mt-2" disabled={form.processing}>
                                {form.processing ? <LoaderCircle className="animate-spin" /> : <LockKeyhole />}
                                Ingresar
                            </Button>
                        </form>

                        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                            Tras varios intentos fallidos, la cuenta se bloquea 15 minutos. Si olvidaste tu contraseña, pide al administrador que la restablezca.
                        </p>
                    </div>
                </div>

                <div className="relative hidden flex-col justify-between gap-8 overflow-hidden bg-primary p-12 text-primary-foreground lg:flex xl:px-16">
                    <div
                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-size-[32px_32px] opacity-[0.06]"
                        aria-hidden="true"
                    />
                    <div className="pointer-events-none absolute -right-24 -bottom-24 size-112 rounded-full bg-primary-foreground/10 blur-3xl" aria-hidden="true" />

                    <div className="relative">
                        <p className="etiqueta opacity-75">Panel comercial</p>
                        <p className="mt-3 max-w-md font-display text-[36px] leading-[1.06] font-extrabold [font-stretch:112%]">
                            Disponibilidad real y proformas en minutos, no en una hora.
                        </p>
                        <ul className="mt-8 grid max-w-md gap-4">
                            {[
                                [LayoutGrid, 'Estado de cada lote al día, sin hojas de cálculo'],
                                [FileText, 'Proforma en PDF con la cuota calculada al instante'],
                                [ChartColumnBig, 'Indicadores de atención medidos solos, listos para SPSS'],
                            ].map(([Icono, texto]) => {
                                const I = Icono as typeof FileText;
                                return (
                                    <li key={texto as string} className="flex items-center gap-3 text-[15px]">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-foreground/12 ring-1 ring-primary-foreground/15">
                                            <I className="size-4.5" aria-hidden="true" />
                                        </span>
                                        {texto as string}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="relative w-full max-w-md rounded-2xl bg-primary-foreground/8 p-5 ring-1 ring-primary-foreground/15">
                        <ManzanaDecorativa />
                        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs opacity-85" aria-hidden="true">
                            <li className="inline-flex items-center gap-1.5">
                                <span className="size-2.5 rounded-sm bg-primary-foreground/10 ring-1 ring-primary-foreground/40" /> Disponible
                            </li>
                            <li className="inline-flex items-center gap-1.5">
                                <span className="size-2.5 rounded-sm bg-primary-foreground/45" /> Separado
                            </li>
                            <li className="inline-flex items-center gap-1.5">
                                <span className="size-2.5 rounded-sm bg-primary-foreground/25" /> Vendido
                            </li>
                        </ul>
                    </div>

                    <p className="relative text-sm opacity-80">Inmobiliaria Constructora Taipe S.A.C. · RUC 20502902637</p>
                </div>
            </div>
            <Avisos />
            <Toaster />
        </>
    );
}
