<?php

namespace App\Http\Controllers\Publico;

use App\Http\Controllers\Controller;
use App\Models\Cotizacion;
use App\Models\Visita;
use App\Services\ProformaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Proforma vista por el cliente (CU-03, CU-04).
 *
 * Se accede solo con el enlace aleatorio que recibio el cliente. El codigo
 * correlativo (COT-2026-00001) no sirve para abrirla.
 */
class CotizacionPublicaController extends Controller
{
    public function __construct(private ProformaService $proformas) {}

    public function ver(string $token): Response
    {
        $cotizacion = $this->buscar($token);
        $cotizacion->loadMissing(['lote.manzana.proyecto', 'visitas']);
        $proyecto = $cotizacion->lote->manzana->proyecto;
        $visita = $cotizacion->visitas->whereIn('estado', ['agendada'])->sortByDesc('programada_para')->first();

        $mensaje = "Hola, tengo la proforma {$cotizacion->codigo} del lote {$cotizacion->lote->codigo} "
            ."en {$proyecto->nombre} y quisiera más información.";

        return Inertia::render('publico/cotizacion', [
            'cotizacion' => [
                'token' => $cotizacion->token_publico,
                'codigo' => $cotizacion->codigo,
                // El nombre se muestra; el documento y el celular, enmascarados.
                'cliente_nombre' => $cotizacion->cliente_nombre,
                'cliente_documento' => self::enmascarar($cotizacion->cliente_documento),
                'cliente_telefono' => self::enmascarar($cotizacion->cliente_telefono),
                'modalidad_pago' => $cotizacion->modalidad_pago,
                'tipo_cambio' => (float) $cotizacion->tipo_cambio,
                'precio_m2' => (float) $cotizacion->precio_m2,
                'precio_lista' => (float) $cotizacion->precio_lista,
                'descuento_pct' => (float) $cotizacion->descuento_pct,
                'descuento_monto' => (float) $cotizacion->descuento_monto,
                'precio_final' => (float) $cotizacion->precio_final,
                'plazo_meses' => (int) $cotizacion->plazo_meses,
                'cuota_mensual' => (float) $cotizacion->cuota_mensual,
                'total_financiado' => (float) $cotizacion->total_financiado,
                'emitida_at' => $cotizacion->emitida_at->toIso8601String(),
                'valida_hasta' => $cotizacion->valida_hasta?->toDateString(),
                'vigente' => $cotizacion->estaVigente(),
                'lote' => [
                    'codigo' => $cotizacion->lote->codigo,
                    'manzana' => $cotizacion->lote->manzana->nombre,
                    'area_m2' => (float) $cotizacion->lote->area_m2,
                    'frente_m' => (float) $cotizacion->lote->frente_m,
                    'fondo_m' => (float) $cotizacion->lote->fondo_m,
                    'esquina' => (bool) $cotizacion->lote->esquina,
                ],
                'proyecto' => [
                    'nombre' => $proyecto->nombre,
                    'ubicacion' => $proyecto->ubicacion,
                    'distrito' => $proyecto->distrito,
                    'telefono' => $proyecto->telefono,
                ],
                'visita' => $visita ? ['programada_para' => $visita->programada_para->toIso8601String()] : null,
            ],
            'whatsapp_asesor' => $proyecto->whatsapp
                ? 'https://wa.me/'.preg_replace('/\D/', '', $proyecto->whatsapp).'?text='.rawurlencode($mensaje)
                : null,
        ]);
    }

    public function pdf(string $token): StreamedResponse
    {
        return $this->proformas->descargar($this->buscar($token));
    }

    /**
     * CU-04: el cliente confirma su intencion y agenda la visita. Si ya
     * tenia una visita pendiente, se reprograma en lugar de duplicarla.
     */
    public function agendarVisita(Request $request, string $token): RedirectResponse
    {
        $cotizacion = $this->buscar($token);

        $datos = $request->validate([
            'fecha' => ['required', 'date_format:Y-m-d', 'after_or_equal:today', 'before_or_equal:'.now()->addDays(60)->toDateString()],
            'hora' => ['required', 'date_format:H:i', 'after_or_equal:08:00', 'before_or_equal:18:00'],
            'notas' => ['nullable', 'string', 'max:300'],
        ], [
            'fecha.after_or_equal' => 'Elige hoy o una fecha posterior.',
            'fecha.before_or_equal' => 'Puedes agendar como máximo con 60 días de anticipación.',
            'hora.after_or_equal' => 'Atendemos visitas de 8:00 a 18:00.',
            'hora.before_or_equal' => 'Atendemos visitas de 8:00 a 18:00.',
        ]);

        $programada = Carbon::createFromFormat('Y-m-d H:i', "{$datos['fecha']} {$datos['hora']}");

        if ($programada->isPast()) {
            return back()->withErrors(['hora' => 'Esa hora ya pasó. Elige una hora posterior.']);
        }

        $pendiente = Visita::where('cotizacion_id', $cotizacion->id)->where('estado', 'agendada')->first();

        if ($pendiente) {
            $pendiente->update(['programada_para' => $programada, 'notas' => $datos['notas'] ?? $pendiente->notas]);
        } else {
            $cotizacion->visitas()->create([
                'cliente_id' => $cotizacion->cliente_id,
                'atencion_id' => $cotizacion->atencion_id,
                'lote_id' => $cotizacion->lote_id,
                'asesor_id' => $cotizacion->asesor_id,
                'programada_para' => $programada,
                'notas' => $datos['notas'] ?? null,
            ]);
        }

        return back()->with('exito', 'Tu visita quedó agendada. Un asesor te confirmará la hora por WhatsApp.');
    }

    private function buscar(string $token): Cotizacion
    {
        // Formato invalido: 404 inmediato, sin consultar la base.
        abort_unless(preg_match('/^[A-Za-z0-9]{40}$/', $token) === 1, 404);

        return Cotizacion::where('token_publico', $token)->firstOrFail();
    }

    public static function enmascarar(?string $valor): string
    {
        $valor = (string) $valor;
        $visibles = 3;

        return strlen($valor) <= $visibles
            ? str_repeat('•', strlen($valor))
            : str_repeat('•', strlen($valor) - $visibles).substr($valor, -$visibles);
    }
}
