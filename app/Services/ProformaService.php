<?php

namespace App\Services;

use App\Models\Cotizacion;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Genera y almacena la proforma en PDF.
 *
 * Se guarda en el disco privado (storage/app/private), fuera de /public:
 * solo se entrega despues de validar el enlace del cliente o los permisos
 * del usuario del panel.
 */
class ProformaService
{
    public function __construct(private CotizadorService $cotizador) {}

    public function generar(Cotizacion $cotizacion): string
    {
        $cotizacion->loadMissing(['lote.manzana.proyecto', 'asesor']);

        $cronograma = $this->cotizador->cronograma(
            (float) $cotizacion->saldo,
            (float) $cotizacion->tasa_anual_pct,
            (int) $cotizacion->plazo_meses,
        );

        $pdf = Pdf::loadView('pdf.proforma', [
            'cotizacion' => $cotizacion,
            'proyecto' => $cotizacion->lote->manzana->proyecto,
            'cronograma' => array_slice($cronograma, 0, 12),
            'totalCuotas' => count($cronograma),
            'ultimaCuota' => $cronograma ? end($cronograma)['pago'] : null,
        ])->setPaper('a4')->setOption([
            // dompdf no debe leer archivos locales ni descargar recursos externos.
            'isRemoteEnabled' => false,
            'isPhpEnabled' => false,
            'isFontSubsettingEnabled' => true,
            'chroot' => resource_path('views/pdf'),
        ]);

        $ruta = "proformas/{$cotizacion->codigo}.pdf";
        Storage::disk('local')->put($ruta, $pdf->output());

        $cotizacion->forceFill(['pdf_path' => $ruta])->save();

        return $ruta;
    }

    public function descargar(Cotizacion $cotizacion): StreamedResponse
    {
        if (! $cotizacion->pdf_path || ! Storage::disk('local')->exists($cotizacion->pdf_path)) {
            $this->generar($cotizacion);
        }

        return Storage::disk('local')->download(
            $cotizacion->pdf_path,
            "Proforma-{$cotizacion->codigo}.pdf",
            ['Cache-Control' => 'no-store, private', 'X-Robots-Tag' => 'noindex'],
        );
    }
}
