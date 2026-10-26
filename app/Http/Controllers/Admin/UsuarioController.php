<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditoriaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CU-12: Gestionar cuentas (solo administrador).
 *
 * Las cuentas se desactivan, nunca se borran: sus atenciones son parte del
 * conjunto de datos del estudio.
 */
class UsuarioController extends Controller
{
    public function __construct(private AuditoriaService $auditoria) {}

    public function index(): Response
    {
        return Inertia::render('admin/usuarios', [
            'usuarios' => User::withCount('atenciones')->orderBy('nombres')->get()->map(fn (User $u) => [
                'id' => $u->id,
                'nombres' => $u->nombres,
                'apellidos' => $u->apellidos,
                'email' => $u->email,
                'telefono' => $u->telefono,
                'rol' => $u->rol,
                'activo' => (bool) $u->activo,
                'debe_cambiar_password' => (bool) $u->debe_cambiar_password,
                'ultimo_acceso_at' => $u->ultimo_acceso_at?->toIso8601String(),
                'atenciones' => $u->atenciones_count,
                'iniciales' => $u->iniciales,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'nombres' => ['required', 'string', 'max:120'],
            'apellidos' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:180', 'unique:users,email'],
            'telefono' => ['nullable', 'string', 'max:25'],
            'rol' => ['required', Rule::in(User::ROLES)],
            'password' => ['required', 'string', Password::defaults()],
        ]);

        $usuario = new User([
            'nombres' => $datos['nombres'],
            'apellidos' => $datos['apellidos'],
            'email' => mb_strtolower($datos['email']),
            'telefono' => $datos['telefono'] ?? null,
            'password' => Hash::make($datos['password']),
        ]);
        // Contrasena temporal: la persona la cambia en su primer ingreso.
        $usuario->forceFill(['rol' => $datos['rol'], 'activo' => true, 'debe_cambiar_password' => true])->save();

        $this->auditoria->registrar('usuario.creado', "Cuenta {$usuario->email} creada con rol {$usuario->rol}", $usuario);

        return back()->with('exito', "Cuenta de {$usuario->nombres} creada. Deberá cambiar su contraseña al ingresar.");
    }

    public function update(Request $request, User $usuario): RedirectResponse
    {
        $datos = $request->validate([
            'nombres' => ['required', 'string', 'max:120'],
            'apellidos' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:180', Rule::unique('users', 'email')->ignore($usuario->id)],
            'telefono' => ['nullable', 'string', 'max:25'],
            'rol' => ['required', Rule::in(User::ROLES)],
            'password' => ['nullable', 'string', Password::defaults()],
        ]);

        $esUnoMismo = $usuario->id === $request->user()->id;

        if ($esUnoMismo && $datos['rol'] !== $usuario->rol) {
            return back()->with('error', 'No puedes cambiar tu propio rol.');
        }

        if ($usuario->rol === 'admin' && $datos['rol'] !== 'admin' && $this->adminsActivos() <= 1) {
            return back()->with('error', 'Debe quedar al menos un administrador activo.');
        }

        $antes = $usuario->only(['email', 'rol']);

        $usuario->fill([
            'nombres' => $datos['nombres'],
            'apellidos' => $datos['apellidos'],
            'email' => mb_strtolower($datos['email']),
            'telefono' => $datos['telefono'] ?? null,
        ])->forceFill(['rol' => $datos['rol']]);

        $cerrarSesiones = $antes['rol'] !== $datos['rol'];

        if (! empty($datos['password'])) {
            $usuario->forceFill([
                'password' => Hash::make($datos['password']),
                'remember_token' => Str::random(60),
                'debe_cambiar_password' => ! $esUnoMismo,
            ]);
            $cerrarSesiones = true;
        }

        $usuario->save();

        if ($cerrarSesiones && ! $esUnoMismo) {
            DB::table('sessions')->where('user_id', $usuario->id)->delete();
        }

        $this->auditoria->registrar('usuario.editado', "Cuenta {$usuario->email} editada", $usuario, [
            'antes' => $antes,
            'rol' => $usuario->rol,
            'password_restablecida' => ! empty($datos['password']),
        ]);

        return back()->with('exito', "Cuenta de {$usuario->nombres} actualizada.");
    }

    public function cambiarActivo(Request $request, User $usuario): RedirectResponse
    {
        if ($usuario->id === $request->user()->id) {
            return back()->with('error', 'No puedes desactivar tu propia cuenta.');
        }

        $activar = ! $usuario->activo;

        if (! $activar && $usuario->rol === 'admin' && $this->adminsActivos() <= 1) {
            return back()->with('error', 'Debe quedar al menos un administrador activo.');
        }

        $usuario->forceFill(['activo' => $activar, 'remember_token' => Str::random(60)])->save();

        if (! $activar) {
            // La desactivacion es inmediata: se cierran sus sesiones abiertas.
            DB::table('sessions')->where('user_id', $usuario->id)->delete();
        }

        $this->auditoria->registrar($activar ? 'usuario.activado' : 'usuario.desactivado',
            "Cuenta {$usuario->email} ".($activar ? 'activada' : 'desactivada'), $usuario);

        return back()->with('exito', "Cuenta de {$usuario->nombres} ".($activar ? 'activada.' : 'desactivada.'));
    }

    private function adminsActivos(): int
    {
        return User::where('rol', 'admin')->where('activo', true)->count();
    }
}
