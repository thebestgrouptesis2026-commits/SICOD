<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Cotizacion;
use App\Models\Visita;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CU-04 Agendar visita (desde el panel) | CU-08 Cambiar estado de visita
 */
class VisitaController extends Controller
{
    public const ESTADOS = ['agendada', 'realizada', 'cancelada', 'no_asistio'];

    public function index(Request $request): Response
    {
        $usuario = $request->user();

        $filtros = $request->validate([
            'periodo' => ['nullable', Rule::in(['proximas', 'pasadas', 'todas'])],
            'estado' => ['nullable', Rule::in(self::ESTADOS)],
        ]);
        $periodo = $filtros['periodo'] ?? 'proximas';

        $visitas = Visita::with(['cliente', 'lote', 'cotizacion', 'asesor'])
            ->when(! $usuario->esSupervisor(), fn (Builder $q) => $q->where('asesor_id', $usuario->id))
            ->when($periodo === 'proximas', fn (Builder $q) => $q->where('programada_para', '>=', now()->startOfDay())->orderBy('programada_para'))
            ->when($periodo === 'pasadas', fn (Builder $q) => $q->where('programada_para', '<', now()->startOfDay())->orderByDesc('programada_para'))
            ->when($periodo === 'todas', fn (Builder $q) => $q->orderByDesc('programada_para'))
            ->when($filtros['estado'] ?? null, fn (Builder $q, $e) => $q->where('estado', $e))
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Visita $v) => self::fila($v));

        return Inertia::render('panel/visitas', [
            'visitas' => $visitas,
            'filtros' => ['periodo' => $periodo, 'estado' => $filtros['estado'] ?? null],
        ]);
    }

    public function store(Request $request, Cotizacion $cotizacion): RedirectResponse
    {
        Gate::authorize('update', $cotizacion);

        $datos = $this->validarFecha($request);

        $cotizacion->visitas()->create([
            'cliente_id' => $cotizacion->cliente_id,
            'atencion_id' => $cotizacion->atencion_id,
            'lote_id' => $cotizacion->lote_id,
            'asesor_id' => $cotizacion->asesor_id ?? $request->user()->id,
            'programada_para' => $datos['programada_para'],
            'notas' => $datos['notas'] ?? null,
        ]);

        return back()->with('exito', 'Visita agendada.');
    }

    public function update(Request $request, Visita $visita): RedirectResponse
    {
        Gate::authorize('update', $visita);

        $datos = $request->validate([
            'estado' => ['required', Rule::in(self::ESTADOS)],
            'notas' => ['nullable', 'string', 'max:500'],
            'fecha' => ['nullable', 'date_format:Y-m-d'],
            'hora' => ['nullable', 'required_with:fecha', 'date_format:H:i'],
        ]);

        $cambios = ['estado' => $datos['estado'], 'notas' => $datos['notas'] ?? $visita->notas];

        if (! empty($datos['fecha'])) {
            $cambios['programada_para'] = Carbon::createFromFormat('Y-m-d H:i', "{$datos['fecha']} {$datos['hora']}");
        }

        $visita->update($cambios);

        return back()->with('exito', 'Visita actualizada.');
    }

    /** @return array{programada_para: Carbon, notas: ?string} */
    private function validarFecha(Request $request): array
    {
        $datos = $request->validate([
            'fecha' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'hora' => ['required', 'date_format:H:i'],
            'notas' => ['nullable', 'string', 'max:500'],
        ]);

        return [
            'programada_para' => Carbon::createFromFormat('Y-m-d H:i', "{$datos['fecha']} {$datos['hora']}"),
            'notas' => $datos['notas'] ?? null,
        ];
    }

    /** @return array<string, mixed> */
    public static function fila(Visita $v): array
    {
        return [
            'id' => $v->id,
            'estado' => $v->estado,
            'programada_para' => $v->programada_para->toIso8601String(),
            'notas' => $v->notas,
            'cliente' => $v->relationLoaded('cliente') && $v->cliente
                ? trim($v->cliente->nombres.' '.$v->cliente->apellidos) : null,
            'telefono' => $v->relationLoaded('cliente') ? $v->cliente?->telefono : null,
            'lote' => $v->relationLoaded('lote') ? $v->lote?->codigo : null,
            'cotizacion_id' => $v->cotizacion_id,
            'cotizacion' => $v->relationLoaded('cotizacion') ? $v->cotizacion?->codigo : null,
            'asesor' => $v->relationLoaded('asesor') ? $v->asesor?->nombre_completo : null,
            'puede_editar' => request()->user()?->can('update', $v) ?? false,
        ];
    }
}
