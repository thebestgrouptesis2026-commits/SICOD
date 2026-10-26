<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class VerificarRol
{
    /**
     * Uso en rutas: ->middleware('rol:admin,gerente')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $usuario = $request->user();

        // Una cuenta desactivada pierde la sesion en su siguiente peticion,
        // aunque la tuviera abierta.
        if (! $usuario || ! $usuario->activo) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->with('error', 'Tu cuenta no está activa.');
        }

        if ($roles && ! in_array($usuario->rol, $roles, true)) {
            abort(403, 'Tu cuenta no tiene acceso a esta sección.');
        }

        return $next($request);
    }
}
