<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Publico\CotizacionPublicaController;
use App\Models\Cotizacion;
use App\Models\User;
use App\Services\AuditoriaService;
use App\Services\ProformaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CU-06 Consultar bandeja de leads | CU-09 Enviar la proforma por WhatsApp
 */
class CotizacionController extends Controller
{
    public function __construct(
        private ProformaService $proformas,
        private AuditoriaService $auditoria,
    ) {}

    public function index(Request $request): Response
    {
        $usuario = $request->user();

        $filtros = $request->validate([
            'q' => ['nullable', 'string', 'max:80'],
            'visita' => ['nullable', Rule::in(['sin_visita', 'agendada', 'realizada', 'no_asistio', 'cancelada'])],
            'asesor' => ['nullable', 'string', 'max:10'],
            'modalidad' => ['nullable', Rule::in(['contado', 'financiado'])],
        ]);

        $cotizaciones = Cotizacion::query()
            ->with(['lote.manzana', 'asesor', 'visitas'])
            ->tap(fn (Builder $q) => self::alcance($q, $usuario))
            ->when($filtros['q'] ?? null, function (Builder $q, string $texto) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $texto).'%';
                $q->where(fn (Builder $q) => $q
                    ->where('cliente_nombre', 'like', $like)
                    ->orWhere('cliente_documento', 'like', $like)
                    ->orWhere('codigo', 'like', $like)
                    ->orWhereHas('lote', fn (Builder $q) => $q->where('codigo', 'like', $like)));
            })
            ->when($filtros['modalidad'] ?? null, fn (Builder $q, $m) => $q->where('modalidad_pago', $m))
            ->when($filtros['visita'] ?? null, function (Builder $q, string $estado) {
                $estado === 'sin_visita'
                    ? $q->whereDoesntHave('visitas')
                    : $q->whereHas('visitas', fn (Builder $q) => $q->where('estado', $estado));
            })
            ->when($usuario->esSupervisor() ? ($filtros['asesor'] ?? null) : null, function (Builder $q, string $asesor) {
                $asesor === 'ninguno' ? $q->whereNull('asesor_id') : $q->where('asesor_id', (int) $asesor);
            })
            ->latest('emitida_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Cotizacion $c) => self::fila($c));

        return Inertia::render('panel/cotizaciones/index', [
            'cotizaciones' => $cotizaciones,
            'filtros' => $filtros,
            'asesores' => $usuario->esSupervisor()
                ? User::where('activo', true)->orderBy('nombres')->get(['id', 'nombres', 'apellidos'])
                    ->map(fn ($u) => ['id' => $u->id, 'nombre' => $u->nombre_completo])
                : [],
        ]);
    }

    public function show(Request $request, Cotizacion $cotizacion): Response
    {
        Gate::authorize('view', $cotizacion);

        $cotizacion->load(['lote.manzana.proyecto', 'asesor', 'atencion', 'visitas.asesor', 'cliente']);
        $publico = route('cotizacion.ver', $cotizacion->token_publico);
        $mensaje = "Hola {$cotizacion->cliente->nombres}, le saluda Inmobiliaria Constructora Taipe. "
            ."Aquí está su proforma {$cotizacion->codigo} del lote {$cotizacion->lote->codigo}: {$publico}";

        return Inertia::render('panel/cotizaciones/show', [
            'cotizacion' => [
                ...self::fila($cotizacion),
                'cliente_documento' => $cotizacion->cliente_documento,
                'cliente_telefono' => $cotizacion->cliente_telefono,
                'cliente_email' => $cotizacion->cliente_email,
                'estado' => $cotizacion->estado,
                'precio_m2' => (float) $cotizacion->precio_m2,
                'precio_lista' => (float) $cotizacion->precio_lista,
                'descuento_pct' => (float) $cotizacion->descuento_pct,
                'descuento_monto' => (float) $cotizacion->descuento_monto,
                'total_financiado' => (float) $cotizacion->total_financiado,
                'tipo_cambio' => (float) $cotizacion->tipo_cambio,
                'valida_hasta' => $cotizacion->valida_hasta?->toDateString(),
                'vigente' => $cotizacion->estaVigente(),
                'atencion' => [
                    'codigo' => $cotizacion->atencion->codigo,
                    'inicio_at' => $cotizacion->atencion->inicio_at->toIso8601String(),
                    'fin_at' => $cotizacion->atencion->fin_at?->toIso8601String(),
                    'duracion_min' => (float) $cotizacion->atencion->duracion_min,
                    'cumple_sla' => (bool) $cotizacion->atencion->cumple_sla,
                    'sla_minutos' => (int) $cotizacion->atencion->sla_minutos,
                    'origen' => $cotizacion->atencion->origen,
                ],
                'lote' => [
                    'id' => $cotizacion->lote->id,
                    'codigo' => $cotizacion->lote->codigo,
                    'manzana' => $cotizacion->lote->manzana->nombre,
                    'area_m2' => (float) $cotizacion->lote->area_m2,
                    'frente_m' => (float) $cotizacion->lote->frente_m,
                    'fondo_m' => (float) $cotizacion->lote->fondo_m,
                    'esquina' => (bool) $cotizacion->lote->esquina,
                    'estado' => $cotizacion->lote->estado,
                    'proyecto' => $cotizacion->lote->manzana->proyecto->nombre,
                ],
                'visitas' => $cotizacion->visitas->sortByDesc('programada_para')->values()
                    ->map(fn ($v) => VisitaController::fila($v)),
            ],
            'enlaces' => [
                'publico' => $publico,
                'whatsapp' => 'https://wa.me/51'.$cotizacion->cliente_telefono.'?text='.rawurlencode($mensaje),
            ],
            'permisos' => [
                'actualizar' => Gate::allows('update', $cotizacion),
                'tomar' => Gate::allows('tomar', $cotizacion),
            ],
        ]);
    }

    /**
     * Un asesor toma un lead que llego por la web sin asesor asignado.
     * Se usa una actualizacion condicional para que dos asesores no lo
     * tomen a la vez.
     */
    public function tomar(Request $request, Cotizacion $cotizacion): RedirectResponse
    {
        Gate::authorize('tomar', $cotizacion);

        $usuario = $request->user();

        $tomado = DB::transaction(function () use ($cotizacion, $usuario) {
            $filas = Cotizacion::whereKey($cotizacion->id)->whereNull('asesor_id')->update(['asesor_id' => $usuario->id]);

            if ($filas === 0) {
                return false;
            }

            $cotizacion->atencion()->whereNull('asesor_id')->update(['asesor_id' => $usuario->id]);
            $cotizacion->visitas()->whereNull('asesor_id')->update(['asesor_id' => $usuario->id]);
            $cotizacion->cliente()->whereNull('asesor_id')->update(['asesor_id' => $usuario->id]);

            return true;
        });

        if (! $tomado) {
            return back()->with('error', 'Otro asesor tomó este lead hace un momento.');
        }

        $this->auditoria->registrar('cotizacion.tomada', "Lead {$cotizacion->codigo} asignado a {$usuario->email}", $cotizacion);

        return back()->with('exito', "Tomaste el lead {$cotizacion->codigo}.");
    }

    public function actualizarEstado(Request $request, Cotizacion $cotizacion): RedirectResponse
    {
        Gate::authorize('update', $cotizacion);

        $datos = $request->validate([
            'estado' => ['required', Rule::in(['emitida', 'aceptada', 'rechazada', 'vencida'])],
        ]);

        $cotizacion->update($datos);

        return back()->with('exito', "Cotización {$cotizacion->codigo} marcada como {$datos['estado']}.");
    }

    public function pdf(Cotizacion $cotizacion): StreamedResponse
    {
        Gate::authorize('view', $cotizacion);

        return $this->proformas->descargar($cotizacion);
    }

    /** Alcance de la cartera segun el rol (evita IDOR en los listados). */
    public static function alcance(Builder $q, User $usuario): Builder
    {
        return $q->when(! $usuario->esSupervisor(), fn (Builder $q) => $q->where(
            fn (Builder $q) => $q->where('asesor_id', $usuario->id)->orWhereNull('asesor_id')
        ));
    }

    /** @return array<string, mixed> */
    public static function fila(Cotizacion $c): array
    {
        $visita = $c->relationLoaded('visitas') ? $c->visitas->sortByDesc('programada_para')->first() : null;

        return [
            'id' => $c->id,
            'codigo' => $c->codigo,
            'cliente_nombre' => $c->cliente_nombre,
            'cliente_documento_mascara' => CotizacionPublicaController::enmascarar($c->cliente_documento),
            'canal' => $c->canal,
            'lote' => $c->relationLoaded('lote') ? $c->lote->codigo : null,
            'manzana' => $c->relationLoaded('lote') && $c->lote->relationLoaded('manzana') ? $c->lote->manzana->nombre : null,
            'modalidad_pago' => $c->modalidad_pago,
            'plazo_meses' => (int) $c->plazo_meses,
            'cuota_mensual' => (float) $c->cuota_mensual,
            'precio_final' => (float) $c->precio_final,
            'tipo_cambio' => (float) $c->tipo_cambio,
            'emitida_at' => $c->emitida_at->toIso8601String(),
            'asesor' => $c->relationLoaded('asesor') ? $c->asesor?->nombre_completo : null,
            'asesor_id' => $c->asesor_id,
            'visita' => $visita ? ['estado' => $visita->estado, 'programada_para' => $visita->programada_para->toIso8601String()] : null,
        ];
    }
}
