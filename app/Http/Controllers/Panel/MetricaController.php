<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Parametro;
use App\Services\AuditoriaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CU-13 Visualizar metricas | CU-14 Exportar reporte historico
 *
 * Las cifras salen de las vistas SQL v_ind_*, no de calculos en PHP: asi
 * el jurado puede reproducir cada numero consultando la base directamente.
 */
class MetricaController extends Controller
{
    public function __construct(private AuditoriaService $auditoria) {}

    public function index(): Response
    {
        $porFase = fn (string $vista) => DB::table($vista)->get()->keyBy('fase');

        return Inertia::render('panel/metricas', [
            'tiempo' => $porFase('v_ind_tiempo'),
            'cumplimiento' => $porFase('v_ind_cumplimiento'),
            'conversion' => $porFase('v_ind_conversion'),
            'canales' => DB::table('v_kpi_canales')->orderByDesc('atenciones')->get(),
            'serie' => DB::table('v_kpi_serie_diaria')->orderBy('fecha')->get(),
            'distribucion' => DB::table('atenciones')
                ->whereNotNull('fin_at')
                ->orderBy('inicio_at')
                ->get(['fase', 'duracion_min']),
            'disponibilidad' => DB::table('v_disponibilidad')->get(),
            'sla' => (int) Parametro::obtener('sla_minutos', config('sicod.sla_minutos')),
        ]);
    }

    /**
     * CU-14: descarga la matriz de datos lista para IBM SPSS Statistics.
     */
    public function exportarSpss(Request $request): StreamedResponse
    {
        $fase = $request->validate(['fase' => ['nullable', Rule::in(['pretest', 'postest'])]])['fase'] ?? null;

        $filas = DB::table('v_export_spss')
            ->when($fase, fn ($q) => $q->where('fase', $fase))
            ->orderBy('fase')
            ->orderBy('inicio_at')
            ->get();

        $this->auditoria->registrar('metricas.exportadas', 'Exportación del dataset para SPSS', datos: ['fase' => $fase, 'filas' => $filas->count()]);

        $nombre = 'sicod_dataset_'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload(function () use ($filas) {
            $salida = fopen('php://output', 'w');
            // BOM para que Excel en Windows lea bien las tildes.
            fwrite($salida, chr(0xEF).chr(0xBB).chr(0xBF));

            if ($filas->isEmpty()) {
                fputcsv($salida, ['Sin registros cerrados todavia']);
                fclose($salida);

                return;
            }

            fputcsv($salida, array_keys((array) $filas->first()));

            foreach ($filas as $fila) {
                fputcsv($salida, array_map([self::class, 'celdaSegura'], array_values((array) $fila)));
            }

            fclose($salida);
        }, $nombre, ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'no-store, private']);
    }

    /**
     * Evita la inyeccion de formulas al abrir el CSV en Excel: un texto que
     * empieza con = + - @ se ejecutaria como formula.
     */
    public static function celdaSegura(mixed $valor): mixed
    {
        if (is_string($valor) && $valor !== '' && ! is_numeric($valor) && in_array($valor[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$valor;
        }

        return $valor;
    }
}
