<?php

use App\Http\Controllers\Admin\AuditoriaController;
use App\Http\Controllers\Admin\ParametroController;
use App\Http\Controllers\Admin\PretestController;
use App\Http\Controllers\Admin\UsuarioController;
use App\Http\Controllers\Auth\CuentaController;
use App\Http\Controllers\Auth\SesionController;
use App\Http\Controllers\Panel\CotizacionController;
use App\Http\Controllers\Panel\CotizarController;
use App\Http\Controllers\Panel\InicioController;
use App\Http\Controllers\Panel\LoteController;
use App\Http\Controllers\Panel\MetricaController;
use App\Http\Controllers\Panel\VisitaController;
use App\Http\Controllers\Publico\CotizacionPublicaController;
use App\Http\Controllers\Publico\CotizadorController;
use App\Http\Controllers\Publico\PlanoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rutas de SICOD
|--------------------------------------------------------------------------
| Cada bloque indica el caso de uso que implementa (docs/CASOS_DE_USO.md)
| y el limite de peticiones que lo protege (AppServiceProvider).
*/

// ---------------------------------------------------------------------
// Publico: el cliente cotiza sin registrarse
// ---------------------------------------------------------------------
Route::middleware('throttle:publico')->group(function () {
    Route::get('/', [PlanoController::class, 'index'])->name('plano');                          // CU-01

    // La proforma solo se abre con su enlace aleatorio de 40 caracteres.
    Route::get('/cotizacion/{token}', [CotizacionPublicaController::class, 'ver'])->name('cotizacion.ver');
    Route::get('/cotizacion/{token}/pdf', [CotizacionPublicaController::class, 'pdf'])->name('cotizacion.pdf');   // CU-03
    Route::post('/cotizacion/{token}/visita', [CotizacionPublicaController::class, 'agendarVisita'])
        ->middleware('throttle:emision')->name('cotizacion.visita');                                              // CU-04
});

Route::post('/cotizador/iniciar', [CotizadorController::class, 'iniciar'])
    ->middleware('throttle:cotizador')->name('cotizador.iniciar');
Route::post('/cotizador/simular', [CotizadorController::class, 'simular'])
    ->middleware('throttle:simulador')->name('cotizador.simular');                                   // CU-02
Route::post('/cotizador/emitir', [CotizadorController::class, 'emitir'])
    ->middleware('throttle:emision')->name('cotizador.emitir');                                      // CU-03 / CU-07

// ---------------------------------------------------------------------
// Sesion
// ---------------------------------------------------------------------
Route::middleware('guest')->group(function () {
    Route::get('/ingresar', [SesionController::class, 'create'])->name('login');                    // CU-05
    Route::post('/ingresar', [SesionController::class, 'store'])->middleware('throttle:login');
});

Route::middleware(['auth', 'rol:admin,gerente,asesor'])->group(function () {
    Route::post('/salir', [SesionController::class, 'destroy'])->name('logout');
    Route::get('/cuenta/password', [CuentaController::class, 'editPassword'])->name('cuenta.password');
    Route::put('/cuenta/password', [CuentaController::class, 'updatePassword'])
        ->middleware('throttle:login')->name('cuenta.password.update');
});

// ---------------------------------------------------------------------
// Panel comercial (asesor, gerente, admin)
// ---------------------------------------------------------------------
Route::middleware(['auth', 'rol:admin,gerente,asesor', 'password.vigente', 'throttle:panel'])
    ->prefix('panel')->name('panel.')->group(function () {
        Route::get('/', InicioController::class)->name('inicio');
        Route::get('/cotizar', CotizarController::class)->name('cotizar');                             // CU-07

        Route::get('/cotizaciones', [CotizacionController::class, 'index'])->name('cotizaciones.index');   // CU-06
        Route::get('/cotizaciones/{cotizacion}', [CotizacionController::class, 'show'])->name('cotizaciones.show');
        Route::get('/cotizaciones/{cotizacion}/pdf', [CotizacionController::class, 'pdf'])->name('cotizaciones.pdf');
        Route::post('/cotizaciones/{cotizacion}/tomar', [CotizacionController::class, 'tomar'])->name('cotizaciones.tomar');
        Route::patch('/cotizaciones/{cotizacion}/estado', [CotizacionController::class, 'actualizarEstado'])->name('cotizaciones.estado');
        Route::post('/cotizaciones/{cotizacion}/visitas', [VisitaController::class, 'store'])->name('visitas.store');

        Route::get('/visitas', [VisitaController::class, 'index'])->name('visitas.index');
        Route::patch('/visitas/{visita}', [VisitaController::class, 'update'])->name('visitas.update');       // CU-08

        Route::get('/lotes', [LoteController::class, 'index'])->name('lotes.index');
        Route::patch('/lotes/{lote}/estado', [LoteController::class, 'cambiarEstado'])->name('lotes.estado');

        // Gerencia: metricas e inventario
        Route::middleware('rol:admin,gerente')->group(function () {
            Route::get('/metricas', [MetricaController::class, 'index'])->name('metricas');                 // CU-13
            Route::get('/metricas/exportar', [MetricaController::class, 'exportarSpss'])->name('metricas.exportar'); // CU-14

            Route::post('/lotes', [LoteController::class, 'store'])->name('lotes.store');                   // CU-10
            Route::put('/lotes/{lote}', [LoteController::class, 'update'])->name('lotes.update');
            Route::delete('/lotes/{lote}', [LoteController::class, 'destroy'])->name('lotes.destroy');
            Route::post('/manzanas', [LoteController::class, 'storeManzana'])->name('manzanas.store');
        });
    });

// ---------------------------------------------------------------------
// Administracion
// ---------------------------------------------------------------------
Route::middleware(['auth', 'rol:admin,gerente', 'password.vigente', 'throttle:panel'])
    ->prefix('admin')->name('admin.')->group(function () {
        Route::get('/parametros', [ParametroController::class, 'index'])->name('parametros');          // CU-11
        Route::put('/parametros', [ParametroController::class, 'update'])->name('parametros.update');
        Route::put('/proyectos/{proyecto}', [ParametroController::class, 'updateProyecto'])->name('proyectos.update');

        Route::get('/pretest', [PretestController::class, 'index'])->name('pretest');
        Route::post('/pretest', [PretestController::class, 'store'])->name('pretest.store');
    });

// Solo el administrador gestiona cuentas y revisa la bitacora de seguridad.
Route::middleware(['auth', 'rol:admin', 'password.vigente', 'throttle:panel'])
    ->prefix('admin')->name('admin.')->group(function () {
        Route::get('/usuarios', [UsuarioController::class, 'index'])->name('usuarios');                  // CU-12
        Route::post('/usuarios', [UsuarioController::class, 'store'])->name('usuarios.store');
        Route::put('/usuarios/{usuario}', [UsuarioController::class, 'update'])->name('usuarios.update');
        Route::patch('/usuarios/{usuario}/activo', [UsuarioController::class, 'cambiarActivo'])->name('usuarios.activo');

        Route::get('/auditoria', AuditoriaController::class)->name('auditoria');
    });
