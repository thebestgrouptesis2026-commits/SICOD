<?php

namespace App\Http\Middleware;

use App\Services\MonedaService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Datos compartidos con todas las pantallas. Solo se envia lo que la
     * interfaz necesita: nunca el modelo User completo.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $usuario = $request->user();

        return [
            ...parent::share($request),
            'app' => [
                'nombre' => config('app.name'),
                'empresa' => 'Inmobiliaria Constructora Taipe S.A.C.',
            ],
            'auth' => [
                'usuario' => $usuario ? [
                    'id' => $usuario->id,
                    'nombres' => $usuario->nombres,
                    'apellidos' => $usuario->apellidos,
                    'email' => $usuario->email,
                    'rol' => $usuario->rol,
                    'iniciales' => $usuario->iniciales,
                ] : null,
            ],
            'moneda' => fn () => app(MonedaService::class)->resumen(),
            'flash' => [
                'exito' => fn () => $request->session()->get('exito'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
