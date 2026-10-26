<?php

namespace App\Http\Controllers\Publico;

use App\Http\Controllers\Controller;
use App\Models\Proyecto;
use App\Services\CotizadorService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CU-01: Consultar plano interactivo.
 *
 * Es la puerta de entrada publica. No exige registro: el cliente ve la
 * disponibilidad real antes de entregar ningun dato personal.
 */
class PlanoController extends Controller
{
    public function __construct(private CotizadorService $cotizador) {}

    public function index(Request $request): Response
    {
        $proyectos = Proyecto::activos()->orderBy('nombre')->get(['id', 'nombre']);

        $proyecto = $request->filled('proyecto')
            ? Proyecto::activos()->find((int) $request->query('proyecto'))
            : Proyecto::activos()->orderBy('nombre')->first();

        abort_if($proyecto === null, 404);

        return Inertia::render('publico/plano', [
            'proyectos' => $proyectos,
            'proyecto' => $this->datosProyecto($proyecto),
            'reglas' => $this->cotizador->reglas(),
            // Se recarga sola cada 30 s (usePoll) para que dos clientes no
            // vean estados contradictorios del mismo lote.
            'lotes' => fn () => self::lotesDe($proyecto->id),
            'resumen' => fn () => DB::table('v_disponibilidad')->where('proyecto_id', $proyecto->id)->first(),
        ]);
    }

    /**
     * Solo los campos que el plano necesita: nada de historial ni notas internas.
     */
    public static function lotesDe(int $proyectoId, bool $soloDisponibles = false): Collection
    {
        return DB::table('v_lotes')
            ->where('proyecto_id', $proyectoId)
            ->when($soloDisponibles, fn ($q) => $q->where('estado', 'disponible'))
            ->orderBy('manzana_orden')
            ->orderBy('orden')
            ->get([
                'id', 'lote', 'manzana_id', 'manzana_codigo', 'manzana', 'frente_m', 'fondo_m',
                'area_m2', 'precio_m2', 'precio', 'estado', 'esquina', 'observacion', 'geometria', 'orden',
            ])
            ->map(function ($l) {
                $l->esquina = (bool) $l->esquina;
                $l->frente_m = (float) $l->frente_m;
                $l->fondo_m = (float) $l->fondo_m;
                $l->area_m2 = (float) $l->area_m2;
                $l->precio_m2 = (float) $l->precio_m2;
                $l->precio = (float) $l->precio;
                $l->geometria = $l->geometria ? json_decode($l->geometria, true) : null;

                return $l;
            });
    }

    /** @return array<string, mixed> */
    public static function datosProyecto(Proyecto $proyecto): array
    {
        return [
            'id' => $proyecto->id,
            'nombre' => $proyecto->nombre,
            'ubicacion' => $proyecto->ubicacion,
            'distrito' => $proyecto->distrito,
            'provincia' => $proyecto->provincia,
            'moneda' => $proyecto->moneda,
            'precio_m2_interior' => (float) $proyecto->precio_m2_interior,
            'precio_m2_esquina' => (float) $proyecto->precio_m2_esquina,
            'telefono' => $proyecto->telefono,
            'whatsapp' => $proyecto->whatsapp,
            'amenidades' => $proyecto->amenidades ?? [],
        ];
    }
}
