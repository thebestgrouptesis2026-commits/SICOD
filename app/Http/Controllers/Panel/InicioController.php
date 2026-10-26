<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Atencion;
use App\Models\Cotizacion;
use App\Models\User;
use App\Models\Visita;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Inicio del panel: resumen del dia para el asesor y de la cartera para
 * el gerente y el administrador.
 */
class InicioController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $usuario = $request->user();
        $alcance = fn ($q) => $q->when(! $usuario->esSupervisor(), fn ($q) => $q->where('asesor_id', $usuario->id));

        $base = Atencion::cerradas()->postest()->tap($alcance);

        $leadsSinAsesor = Cotizacion::whereNull('asesor_id')->where('emitida_at', '>=', now()->subDays(30))->count();

        return Inertia::render('panel/inicio', [
            'resumen' => [
                'atenciones' => (clone $base)->count(),
                'tiempo_promedio' => round((float) (clone $base)->avg('duracion_min'), 2),
                'pct_cumplimiento' => round((float) (clone $base)->selectRaw('AVG(CASE WHEN cumple_sla = 1 THEN 100.0 ELSE 0 END) AS v')->value('v'), 1),
                'tasa_conversion' => round((float) (clone $base)->selectRaw('AVG(CASE WHEN agendo_visita = 1 THEN 100.0 ELSE 0 END) AS v')->value('v'), 1),
                'cotizaciones_hoy' => Cotizacion::tap($alcance)->whereDate('emitida_at', today())->count(),
                'leads_sin_asesor' => $leadsSinAsesor,
            ],
            'recientes' => Cotizacion::with(['lote.manzana'])
                ->when(! $usuario->esSupervisor(), fn ($q) => $q->where(fn ($q) => $q->where('asesor_id', $usuario->id)->orWhereNull('asesor_id')))
                ->latest('emitida_at')
                ->limit(8)
                ->get()
                ->map(fn (Cotizacion $c) => CotizacionController::fila($c)),
            'visitas' => Visita::with(['cliente', 'lote'])
                ->where('estado', 'agendada')
                ->where('programada_para', '>=', now()->startOfDay())
                ->tap($alcance)
                ->orderBy('programada_para')
                ->limit(6)
                ->get()
                ->map(fn (Visita $v) => VisitaController::fila($v)),
            'disponibilidad' => DB::table('v_disponibilidad')->get(),
            'serie' => DB::table('atenciones')
                ->selectRaw('DATE(fin_at) AS fecha, COUNT(*) AS atenciones')
                ->whereNotNull('fin_at')
                ->where('fase', 'postest')
                ->where('fin_at', '>=', now()->subDays(13)->startOfDay())
                ->when(! $usuario->esSupervisor(), fn ($q) => $q->where('asesor_id', $usuario->id))
                ->groupByRaw('DATE(fin_at)')
                ->orderBy('fecha')
                ->get(),
        ]);
    }
}
