<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Publico\CotizadorController;
use App\Http\Controllers\Publico\PlanoController;
use App\Models\Proyecto;
use App\Services\CotizadorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CU-07: Generar cotizacion asistida.
 *
 * Mismo motor que el cotizador publico, pero operado por el asesor cuando
 * el cliente llega por WhatsApp, telefono o de forma presencial. El canal
 * queda registrado para poder comparar tiempos entre canales.
 */
class CotizarController extends Controller
{
    public function __construct(private CotizadorService $cotizador) {}

    public function __invoke(Request $request): Response
    {
        $proyecto = Proyecto::activos()->find((int) $request->query('proyecto'))
            ?? Proyecto::activos()->orderBy('nombre')->firstOrFail();

        return Inertia::render('panel/cotizar', [
            'proyectos' => Proyecto::activos()->orderBy('nombre')->get(['id', 'nombre']),
            'proyecto' => PlanoController::datosProyecto($proyecto),
            'lotes' => PlanoController::lotesDe($proyecto->id),
            'reglas' => $this->cotizador->reglas(),
            'canales' => CotizadorController::CANALES,
        ]);
    }
}
