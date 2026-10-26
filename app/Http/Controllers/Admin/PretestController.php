<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Publico\CotizadorController;
use App\Http\Requests\RegistroPretestRequest;
use App\Models\Atencion;
use App\Models\Proyecto;
use App\Models\User;
use App\Services\AuditoriaService;
use App\Services\MedicionService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Carga de la fase pretest (O1).
 *
 * Transcribe la ficha de registro de tiempos del proceso manual a la misma
 * tabla que usa el sistema, para que pretest y postest sean comparables
 * sin trabajo posterior de consolidacion.
 */
class PretestController extends Controller
{
    public function __construct(
        private MedicionService $medicion,
        private AuditoriaService $auditoria,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/pretest', [
            'registros' => Atencion::with(['asesor'])
                ->where('fase', 'pretest')
                ->orderByDesc('inicio_at')
                ->paginate(20)
                ->through(fn (Atencion $a) => [
                    'id' => $a->id,
                    'codigo' => $a->codigo,
                    'canal' => $a->canal,
                    'inicio_at' => $a->inicio_at->toIso8601String(),
                    'fin_at' => $a->fin_at?->toIso8601String(),
                    'duracion_min' => (float) $a->duracion_min,
                    'cumple_sla' => (bool) $a->cumple_sla,
                    'agendo_visita' => (bool) $a->agendo_visita,
                    'asesor' => $a->asesor?->nombre_completo,
                    'observacion' => $a->observacion,
                ]),
            'asesores' => User::where('activo', true)->orderBy('nombres')->get()
                ->map(fn ($u) => ['id' => $u->id, 'nombre' => $u->nombre_completo]),
            'proyectos' => Proyecto::activos()->orderBy('nombre')->get(['id', 'nombre']),
            'canales' => CotizadorController::CANALES,
        ]);
    }

    public function store(RegistroPretestRequest $request): RedirectResponse
    {
        try {
            $atencion = $this->medicion->registrarAtencionManual($request->validated());
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['fin_at' => $e->getMessage()]);
        }

        $this->auditoria->registrar('pretest.registrado', "Registro pretest {$atencion->codigo}", $atencion);

        return back()->with('exito', "Registro {$atencion->codigo} guardado: {$atencion->duracion_min} minutos.");
    }
}
