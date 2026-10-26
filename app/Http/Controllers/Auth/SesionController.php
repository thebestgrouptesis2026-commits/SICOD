<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuditoriaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CU-05: Iniciar y cerrar sesion.
 */
class SesionController extends Controller
{
    public function __construct(private AuditoriaService $auditoria) {}

    public function create(): Response
    {
        return Inertia::render('auth/login');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $usuario = $request->authenticate();

        // Nuevo identificador de sesion: evita la fijacion de sesion.
        $request->session()->regenerate();

        $usuario->forceFill([
            'ultimo_acceso_at' => now(),
            'ultimo_acceso_ip' => $request->ip(),
        ])->save();

        $this->auditoria->registrar('login.exitoso', "Ingreso de {$usuario->email}", $usuario, usuarioId: $usuario->id);

        if ($usuario->debe_cambiar_password && config('sicod.forzar_cambio_password')) {
            return redirect()->route('cuenta.password');
        }

        return redirect()->intended(route('panel.inicio'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        $this->auditoria->registrar('logout', 'Cierre de sesión');

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
