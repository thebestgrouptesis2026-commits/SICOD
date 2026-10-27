<?php

use App\Http\Middleware\CabecerasSeguridad;
use App\Http\Middleware\ForzarCambioPassword;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\VerificarRol;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            CabecerasSeguridad::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Los proxies de confianza (TRUSTED_PROXIES) se registran en
        // AppServiceProvider: aqui el .env todavia no esta cargado.

        $middleware->alias([
            'rol' => VerificarRol::class,
            'password.vigente' => ForzarCambioPassword::class,
        ]);

        $middleware->redirectGuestsTo(fn () => route('login'));
        $middleware->redirectUsersTo(fn () => route('panel.inicio'));
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Paginas de error con el mismo diseno del sistema. En produccion
        // nunca se muestra la traza ni el mensaje interno de la excepcion.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $estado = $response->getStatusCode();

            if (app()->environment(['local', 'testing']) && $estado === 500) {
                return $response;
            }

            if (in_array($estado, [403, 404, 419, 429, 500, 503], true)) {
                return Inertia::render('error', ['estado' => $estado])
                    ->toResponse($request)
                    ->setStatusCode($estado);
            }

            return $response;
        });
    })->create();
