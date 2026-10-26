<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuditoriaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class CuentaController extends Controller
{
    public function __construct(private AuditoriaService $auditoria) {}

    public function editPassword(Request $request): Response
    {
        return Inertia::render('cuenta/password', [
            'obligatorio' => (bool) $request->user()->debe_cambiar_password,
        ]);
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $usuario = $request->user();

        $datos = $request->validate([
            'password_actual' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', 'different:password_actual', Password::defaults()],
        ], [
            'password_actual.current_password' => 'La contraseña actual no es correcta.',
            'password.different' => 'La nueva contraseña debe ser distinta de la actual.',
        ]);

        $usuario->forceFill([
            'password' => Hash::make($datos['password']),
            'remember_token' => Str::random(60),
            'debe_cambiar_password' => false,
            'password_cambiado_at' => now(),
        ])->save();

        // Cierra las sesiones abiertas en otros equipos.
        DB::table('sessions')->where('user_id', $usuario->id)
            ->where('id', '!=', $request->session()->getId())->delete();

        $request->session()->regenerate();

        $this->auditoria->registrar('cuenta.password', 'Cambio de contraseña', $usuario);

        return redirect()->route('panel.inicio')->with('exito', 'Tu contraseña se actualizó.');
    }
}
