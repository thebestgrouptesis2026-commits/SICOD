<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Mientras la cuenta tenga la contrasena inicial (o una asignada por el
 * administrador), solo puede entrar a la pantalla para cambiarla.
 */
class ForzarCambioPassword
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if ($usuario && $usuario->debe_cambiar_password && config('sicod.forzar_cambio_password')) {
            return redirect()->route('cuenta.password')
                ->with('error', 'Por seguridad, cambia tu contraseña antes de continuar.');
        }

        return $next($request);
    }
}
