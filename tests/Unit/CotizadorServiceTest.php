<?php

namespace Tests\Unit;

use App\Services\CotizadorService;
use App\Services\MonedaService;
use PHPUnit\Framework\TestCase;

/**
 * Pruebas puras del motor financiero: no tocan la base de datos.
 */
class CotizadorServiceTest extends TestCase
{
    private CotizadorService $cotizador;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cotizador = new CotizadorService(new MonedaService);
    }

    public function test_sin_interes_divide_el_precio_entre_el_plazo(): void
    {
        // Lote interior de 128 m2 a US$ 320 = US$ 40 960.
        $this->assertEquals(273.07, $this->cotizador->cuotaMensual(40960, 0, 150));
        $this->assertEquals(341.33, $this->cotizador->cuotaMensual(40960, 0, 120));
        $this->assertEquals(379.26, $this->cotizador->cuotaMensual(40960, 0, 108));
        $this->assertEquals(3413.33, $this->cotizador->cuotaMensual(40960, 0, 12));
    }

    public function test_el_cronograma_suma_exactamente_el_precio(): void
    {
        $cronograma = $this->cotizador->cronograma(40960, 0, 150);

        $this->assertCount(150, $cronograma);
        $this->assertEqualsWithDelta(40960.00, array_sum(array_column($cronograma, 'pago')), 0.001);
        $this->assertEquals(0.0, end($cronograma)['saldo_final']);
    }

    public function test_con_interes_aplica_el_sistema_frances(): void
    {
        $sinInteres = $this->cotizador->cuotaMensual(40960, 0, 120);
        $conInteres = $this->cotizador->cuotaMensual(40960, 12, 120);

        $this->assertGreaterThan($sinInteres, $conInteres);
    }

    public function test_plazo_cero_no_genera_cuota(): void
    {
        $this->assertEquals(0.0, $this->cotizador->cuotaMensual(40960, 0, 0));
        $this->assertSame([], $this->cotizador->cronograma(40960, 0, 0));
    }
}
