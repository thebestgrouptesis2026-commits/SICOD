<?php

namespace App\Services;

use App\Models\Lote;
use App\Models\Parametro;
use InvalidArgumentException;

/**
 * Calculo financiero de la proforma.
 *
 * Reglas comerciales de Inmobiliaria Constructora Taipe:
 *  - Lote interior: US$ 320 por m2. Lote en esquina: US$ 330 por m2.
 *  - Financiado: sin cuota inicial; mayormente a 150 meses, aunque el
 *    plazo puede variar (12, 108, 120...) hasta el maximo configurado.
 *  - Al contado: 20 % de descuento sobre el valor total del lote.
 *
 * Toda la aritmetica vive aqui, en el servidor. El navegador solo muestra
 * el resultado: asi la cifra que ve el cliente en pantalla es exactamente
 * la que queda almacenada y la que se imprime en el PDF.
 */
class CotizadorService
{
    public function __construct(private MonedaService $moneda) {}

    /**
     * Calcula el esquema de pago sin persistir nada. Montos en dolares.
     *
     * @return array<string, mixed>
     */
    public function calcular(
        Lote $lote,
        string $modalidad = 'financiado',
        ?int $plazoMeses = null,
        ?float $tasaAnualPct = null,
        ?float $tipoCambio = null,
    ): array {
        if (! in_array($modalidad, ['contado', 'financiado'], true)) {
            throw new InvalidArgumentException('Modalidad de pago no valida.');
        }

        $tipoCambio ??= $this->moneda->tipoCambio();
        $precioM2 = $lote->precio_m2;
        $precioLista = $lote->precio;

        if ($modalidad === 'contado') {
            $descuentoPct = $this->descuentoContado();
            $descuento = round($precioLista * $descuentoPct / 100, 2);
            $precioFinal = round($precioLista - $descuento, 2);

            return $this->conSoles([
                'modalidad_pago' => 'contado',
                'moneda' => 'USD',
                'tipo_cambio' => $tipoCambio,
                'precio_m2' => $precioM2,
                'precio_lista' => $precioLista,
                'descuento_pct' => $descuentoPct,
                'descuento_monto' => $descuento,
                'precio_final' => $precioFinal,
                'inicial_pct' => 0.0,
                'inicial_monto' => 0.0,
                'saldo' => 0.0,
                'plazo_meses' => 0,
                'tasa_anual_pct' => 0.0,
                'cuota_mensual' => 0.0,
                'total_financiado' => $precioFinal,
            ]);
        }

        $plazoMeses = $this->validarPlazo($plazoMeses ?? $this->plazoDefecto());
        $tasaAnualPct ??= (float) Parametro::obtener('tasa_anual_default', config('sicod.tasa_anual_default'));
        $saldo = $precioLista;   // sin cuota inicial
        $cuota = $this->cuotaMensual($saldo, $tasaAnualPct, $plazoMeses);

        return $this->conSoles([
            'modalidad_pago' => 'financiado',
            'moneda' => 'USD',
            'tipo_cambio' => $tipoCambio,
            'precio_m2' => $precioM2,
            'precio_lista' => $precioLista,
            'descuento_pct' => 0.0,
            'descuento_monto' => 0.0,
            'precio_final' => $precioLista,
            'inicial_pct' => 0.0,
            'inicial_monto' => 0.0,
            'saldo' => $saldo,
            'plazo_meses' => $plazoMeses,
            'tasa_anual_pct' => $tasaAnualPct,
            'cuota_mensual' => $cuota,
            // Suma real del cronograma: la ultima cuota absorbe los centavos
            // del redondeo, asi que sin interes el total es el precio exacto.
            'total_financiado' => round(array_sum(array_column($this->cronograma($saldo, $tasaAnualPct, $plazoMeses), 'pago')), 2),
        ]);
    }

    /**
     * Cuota mensual.
     *
     * Tasa 0  -> financiamiento directo sin interes: saldo / plazo.
     * Tasa > 0 -> sistema frances sobre la tasa efectiva mensual
     *             equivalente a la tasa efectiva anual indicada.
     */
    public function cuotaMensual(float $saldo, float $tasaAnualPct, int $plazoMeses): float
    {
        if ($plazoMeses <= 0) {
            return 0.0;
        }

        if ($tasaAnualPct <= 0) {
            return round($saldo / $plazoMeses, 2);
        }

        $i = pow(1 + $tasaAnualPct / 100, 1 / 12) - 1;

        return round($saldo * $i / (1 - pow(1 + $i, -$plazoMeses)), 2);
    }

    /**
     * Cronograma de pagos, para el detalle del PDF.
     *
     * @return array<int, array{cuota: int, saldo_inicial: float, interes: float,
     *                          amortizacion: float, pago: float, saldo_final: float}>
     */
    public function cronograma(float $saldo, float $tasaAnualPct, int $plazoMeses): array
    {
        if ($plazoMeses <= 0 || $saldo <= 0) {
            return [];
        }

        $i = $tasaAnualPct > 0 ? pow(1 + $tasaAnualPct / 100, 1 / 12) - 1 : 0;
        $pago = $this->cuotaMensual($saldo, $tasaAnualPct, $plazoMeses);
        $restante = $saldo;
        $filas = [];

        for ($n = 1; $n <= $plazoMeses; $n++) {
            $interes = round($restante * $i, 2);
            $amortizacion = round($pago - $interes, 2);

            // La ultima cuota absorbe los centavos del redondeo.
            if ($n === $plazoMeses) {
                $amortizacion = round($restante, 2);
                $pago = round($amortizacion + $interes, 2);
            }

            $filas[] = [
                'cuota' => $n,
                'saldo_inicial' => round($restante, 2),
                'interes' => $interes,
                'amortizacion' => $amortizacion,
                'pago' => $pago,
                'saldo_final' => round($restante - $amortizacion, 2),
            ];

            $restante = round($restante - $amortizacion, 2);
        }

        return $filas;
    }

    /** @return array<int, int> Plazos que se ofrecen como opcion rapida. */
    public function plazosDisponibles(): array
    {
        $plazos = Parametro::obtener('plazos_meses', config('sicod.plazos_meses'));
        $plazos = is_array($plazos) ? array_map('intval', $plazos) : config('sicod.plazos_meses');
        $maximo = $this->plazoMaximo();

        return array_values(array_filter($plazos, fn ($p) => $p >= 1 && $p <= $maximo));
    }

    public function plazoDefecto(): int
    {
        return min((int) Parametro::obtener('plazo_defecto', config('sicod.plazo_defecto')), $this->plazoMaximo());
    }

    public function plazoMaximo(): int
    {
        return max(1, (int) Parametro::obtener('plazo_maximo', config('sicod.plazo_maximo')));
    }

    public function descuentoContado(): float
    {
        return (float) Parametro::obtener('descuento_contado_pct', config('sicod.descuento_contado_pct'));
    }

    /** @return array<string, mixed> Reglas que el cotizador muestra al cliente. */
    public function reglas(): array
    {
        return [
            'plazos' => $this->plazosDisponibles(),
            'plazo_defecto' => $this->plazoDefecto(),
            'plazo_maximo' => $this->plazoMaximo(),
            'descuento_contado_pct' => $this->descuentoContado(),
            'tasa_anual_pct' => (float) Parametro::obtener('tasa_anual_default', config('sicod.tasa_anual_default')),
            'dias_validez' => (int) Parametro::obtener('dias_validez', config('sicod.dias_validez')),
        ];
    }

    private function validarPlazo(int $plazo): int
    {
        $maximo = $this->plazoMaximo();

        if ($plazo < 1 || $plazo > $maximo) {
            throw new InvalidArgumentException("El plazo debe estar entre 1 y {$maximo} meses.");
        }

        return $plazo;
    }

    /**
     * Agrega los equivalentes en soles de los montos principales.
     *
     * @param  array<string, mixed>  $calculo
     * @return array<string, mixed>
     */
    private function conSoles(array $calculo): array
    {
        $tc = (float) $calculo['tipo_cambio'];

        $calculo['soles'] = [
            'precio_lista' => $this->moneda->aSoles($calculo['precio_lista'], $tc),
            'descuento_monto' => $this->moneda->aSoles($calculo['descuento_monto'], $tc),
            'precio_final' => $this->moneda->aSoles($calculo['precio_final'], $tc),
            'cuota_mensual' => $this->moneda->aSoles($calculo['cuota_mensual'], $tc),
            'total_financiado' => $this->moneda->aSoles($calculo['total_financiado'], $tc),
        ];

        return $calculo;
    }
}
