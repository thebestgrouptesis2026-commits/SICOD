<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Publico\PlanoController;
use App\Models\Lote;
use App\Models\LoteHistorial;
use App\Models\Manzana;
use App\Models\Proyecto;
use App\Services\AuditoriaService;
use App\Services\DisponibilidadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Disponibilidad (todos los roles del panel) y CU-10 Gestionar lotes
 * (gerente y administrador).
 */
class LoteController extends Controller
{
    public function __construct(
        private DisponibilidadService $disponibilidad,
        private AuditoriaService $auditoria,
    ) {}

    public function index(Request $request): Response
    {
        $proyecto = Proyecto::with('manzanas')->find((int) $request->query('proyecto'))
            ?? Proyecto::with('manzanas')->orderBy('nombre')->firstOrFail();

        $loteIds = Lote::whereIn('manzana_id', $proyecto->manzanas->pluck('id'))->pluck('id');

        return Inertia::render('panel/lotes', [
            'proyectos' => Proyecto::orderBy('nombre')->get(['id', 'nombre']),
            'proyecto' => PlanoController::datosProyecto($proyecto),
            'manzanas' => $proyecto->manzanas->map(fn ($m) => ['id' => $m->id, 'codigo' => $m->codigo, 'nombre' => $m->nombre]),
            'lotes' => PlanoController::lotesDe($proyecto->id),
            'historial' => LoteHistorial::with(['lote', 'usuario'])
                ->whereIn('lote_id', $loteIds)
                ->latest('created_at')
                ->limit(15)
                ->get()
                ->map(fn ($h) => [
                    'id' => $h->id,
                    'lote' => $h->lote->codigo,
                    'anterior' => $h->estado_anterior,
                    'nuevo' => $h->estado_nuevo,
                    'motivo' => $h->motivo,
                    'usuario' => $h->usuario?->nombre_completo,
                    'fecha' => $h->created_at->toIso8601String(),
                ]),
            'resumen' => DB::table('v_disponibilidad')->where('proyecto_id', $proyecto->id)->first(),
            'puede_gestionar' => $request->user()->esSupervisor(),
        ]);
    }

    /**
     * El cambio de estado nunca se hace con un update directo: pasa por el
     * servicio para que quede registrado en lote_historial y la auditoria.
     * El asesor puede separar, vender o liberar; bloquear es de supervisor.
     */
    public function cambiarEstado(Request $request, Lote $lote): RedirectResponse
    {
        $permitidos = $request->user()->esSupervisor()
            ? DisponibilidadService::ESTADOS
            : ['disponible', 'reservado', 'vendido'];

        $datos = $request->validate([
            'estado' => ['required', Rule::in($permitidos)],
            'motivo' => ['nullable', 'string', 'max:200'],
        ]);

        if ($lote->estado === 'bloqueado' && ! $request->user()->esSupervisor()) {
            abort(403, 'Solo un supervisor puede desbloquear un lote.');
        }

        $this->disponibilidad->cambiarEstado(
            $lote,
            $datos['estado'],
            $datos['motivo'] ?? 'Cambio manual desde el panel',
            $request->user()->id,
            $request->ip(),
        );

        $nombres = ['disponible' => 'disponible', 'reservado' => 'separado', 'vendido' => 'vendido', 'bloqueado' => 'bloqueado'];

        return back()->with('exito', "El lote {$lote->codigo} ahora está {$nombres[$datos['estado']]}.");
    }

    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'manzana_id' => ['required', 'integer', 'exists:manzanas,id'],
            'codigo' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z0-9\-]+$/',
                Rule::unique('lotes', 'codigo')->where('manzana_id', $request->integer('manzana_id'))],
            'frente_m' => ['required', 'numeric', 'min:1', 'max:500'],
            'fondo_m' => ['required', 'numeric', 'min:1', 'max:500'],
            'precio_lista' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'esquina' => ['boolean'],
            'observacion' => ['nullable', 'string', 'max:255'],
        ], ['codigo.unique' => 'Ya existe un lote con ese código en la manzana.']);

        $datos['codigo'] = strtoupper($datos['codigo']);
        $datos['orden'] = (int) Lote::where('manzana_id', $datos['manzana_id'])->max('orden') + 1;
        $lote = Lote::create($datos);

        $this->auditoria->registrar('lote.creado', "Lote {$lote->codigo} creado", $lote);

        return back()->with('exito', "Lote {$lote->codigo} creado.");
    }

    public function update(Request $request, Lote $lote): RedirectResponse
    {
        $datos = $request->validate([
            'codigo' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z0-9\-]+$/',
                Rule::unique('lotes', 'codigo')->where('manzana_id', $lote->manzana_id)->ignore($lote->id)],
            'frente_m' => ['required', 'numeric', 'min:1', 'max:500'],
            'fondo_m' => ['required', 'numeric', 'min:1', 'max:500'],
            'precio_lista' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'esquina' => ['boolean'],
            'observacion' => ['nullable', 'string', 'max:255'],
        ]);

        $antes = $lote->only(['codigo', 'frente_m', 'fondo_m', 'precio_lista', 'esquina']);
        $datos['codigo'] = strtoupper($datos['codigo']);
        $lote->update($datos);

        $this->auditoria->registrar('lote.editado', "Lote {$lote->codigo} editado", $lote, ['antes' => $antes]);

        return back()->with('exito', "Lote {$lote->codigo} actualizado.");
    }

    public function destroy(Lote $lote): RedirectResponse
    {
        if ($lote->cotizaciones()->exists()) {
            return back()->with('error', "El lote {$lote->codigo} tiene cotizaciones. Bloquéalo en lugar de eliminarlo.");
        }

        $codigo = $lote->codigo;
        $lote->delete();

        $this->auditoria->registrar('lote.eliminado', "Lote {$codigo} eliminado");

        return back()->with('exito', "Lote {$codigo} eliminado.");
    }

    public function storeManzana(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'proyecto_id' => ['required', 'integer', 'exists:proyectos,id'],
            'codigo' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z0-9\-]+$/',
                Rule::unique('manzanas', 'codigo')->where('proyecto_id', $request->integer('proyecto_id'))],
            'nombre' => ['required', 'string', 'max:60'],
        ], ['codigo.unique' => 'Ya existe una manzana con ese código en el proyecto.']);

        $datos['codigo'] = strtoupper($datos['codigo']);
        $datos['orden'] = (int) Manzana::where('proyecto_id', $datos['proyecto_id'])->max('orden') + 1;
        $manzana = Manzana::create($datos);

        $this->auditoria->registrar('manzana.creada', "Manzana {$manzana->nombre} creada", $manzana);

        return back()->with('exito', "Manzana {$manzana->nombre} creada.");
    }
}
