<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auditoria;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Bitacora de seguridad (solo administrador). Es de solo lectura.
 */
class AuditoriaController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filtros = $request->validate([
            'tipo' => ['nullable', 'in:seguridad,inventario,configuracion,todos'],
        ]);
        $tipo = $filtros['tipo'] ?? 'todos';

        $prefijos = [
            'seguridad' => ['login.', 'logout', 'cuenta.', 'usuario.'],
            'inventario' => ['lote.', 'manzana.'],
            'configuracion' => ['parametros.', 'proyecto.', 'metricas.', 'pretest.'],
        ];

        $registros = Auditoria::with('usuario')
            ->when($tipo !== 'todos', fn (Builder $q) => $q->where(function (Builder $q) use ($prefijos, $tipo) {
                foreach ($prefijos[$tipo] as $p) {
                    $q->orWhere('evento', 'like', $p.'%');
                }
            }))
            ->latest('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Auditoria $a) => [
                'id' => $a->id,
                'evento' => $a->evento,
                'descripcion' => $a->descripcion,
                'usuario' => $a->usuario?->nombre_completo,
                'ip' => $a->ip,
                'fecha' => $a->created_at->toIso8601String(),
            ]);

        $hace24h = now()->subDay();

        return Inertia::render('admin/auditoria', [
            'registros' => $registros,
            'filtros' => ['tipo' => $tipo],
            'alertas' => [
                'fallidos_24h' => Auditoria::where('evento', 'login.fallido')->where('created_at', '>=', $hace24h)->count(),
                'bloqueos_24h' => Auditoria::where('evento', 'login.bloqueado')->where('created_at', '>=', $hace24h)->count(),
                'ingresos_24h' => Auditoria::where('evento', 'login.exitoso')->where('created_at', '>=', $hace24h)->count(),
            ],
        ]);
    }
}
