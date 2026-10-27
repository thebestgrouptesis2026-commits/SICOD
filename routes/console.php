<?php

use App\Models\User;
use App\Services\DisponibilidadService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

// Libera automaticamente los lotes cuya reserva vencio.
Schedule::call(fn () => app(DisponibilidadService::class)->liberarReservasVencidas())->dailyAt('00:30');

// Borra la bitacora de seguridad con mas de un año (Ley 29733: conservar
// datos solo el tiempo necesario).
Schedule::call(fn () => DB::table('auditoria')->where('created_at', '<', now()->subYear())->delete())->monthly();

// Carga los datos base solo en una instalacion nueva. Los seeders
// reescriben parametros y estados de lotes, asi que no deben volver a
// correr en cada despliegue.
Artisan::command('sicod:instalar', function () {
    if (User::query()->exists()) {
        $this->info('SICOD ya tiene datos; no se siembra nada.');

        return;
    }

    if (app()->isProduction() && config('sicod.password_inicial') === 'sicod2026') {
        $this->error('Define SICOD_PASSWORD_INICIAL: la contraseña por defecto es pública y no se usa en producción.');

        return 1;
    }

    $this->call('db:seed', ['--force' => true]);
})->purpose('Siembra los datos base si la base de datos está vacía (para despliegues)');

Artisan::command('sicod:limpiar-demo', function () {
    if (! $this->confirm('Se borrarán todas las atenciones, cotizaciones, visitas y clientes marcados como DEMO. ¿Continuar?')) {
        return;
    }

    DB::transaction(function () {
        $atenciones = DB::table('atenciones')->where('observacion', 'DEMO')->pluck('id');
        DB::table('visitas')->whereIn('atencion_id', $atenciones)->delete();
        DB::table('cotizaciones')->whereIn('atencion_id', $atenciones)->delete();
        DB::table('atenciones')->whereIn('id', $atenciones)->delete();
        DB::table('clientes')->where('notas', 'DEMO')->whereNotExists(
            fn ($q) => $q->from('cotizaciones')->whereColumn('cotizaciones.cliente_id', 'clientes.id')
        )->delete();
    });

    $this->info('Datos de demostración eliminados.');
})->purpose('Elimina los datos ficticios del DemoSeeder antes de tomar datos reales');
