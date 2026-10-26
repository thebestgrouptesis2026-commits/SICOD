<?php

namespace App\Services;

use App\Models\Parametro;

/**
 * Soles y dolares.
 *
 * Los precios de lista se fijan en dolares (US$ 320 y US$ 330 por m2).
 * El equivalente en soles usa el tipo de cambio que registra el
 * administrador; cada cotizacion guarda el valor con el que se emitio, de
 * modo que una proforma antigua no cambia si el dolar sube o baja.
 */
class MonedaService
{
    public function tipoCambio(): float
    {
        return round((float) Parametro::obtener('tipo_cambio', config('sicod.tipo_cambio')), 4);
    }

    public function fechaTipoCambio(): ?string
    {
        $fecha = Parametro::obtener('tipo_cambio_fecha', config('sicod.tipo_cambio_fecha'));

        return $fecha ? (string) $fecha : null;
    }

    public function aSoles(float $montoUsd, ?float $tipoCambio = null): float
    {
        return round($montoUsd * ($tipoCambio ?? $this->tipoCambio()), 2);
    }

    /** @return array{tipo_cambio: float, fecha: ?string} */
    public function resumen(): array
    {
        return [
            'tipo_cambio' => $this->tipoCambio(),
            'fecha' => $this->fechaTipoCambio(),
        ];
    }
}
