<?php

namespace Tests\Feature;

use App\Http\Controllers\Panel\MetricaController;
use App\Models\Cotizacion;
use App\Models\Lote;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Flujo publico de cotizacion (Strix: idor, business_logic, mass_assignment,
 * information_disclosure, csv/formula injection).
 */
class SeguridadCotizacionTest extends TestCase
{
    private function loteDisponible(bool $esquina = false): Lote
    {
        return Lote::where('estado', 'disponible')->where('esquina', $esquina)->orderBy('id')->firstOrFail();
    }

    private function cliente(array $extra = []): array
    {
        return [
            'nombres' => 'María José',
            'apellidos' => 'Quispe Huamán',
            'tipo_documento' => 'DNI',
            'numero_documento' => '45678912',
            'telefono' => '912345678',
            'email' => 'maria@example.com',
            'modalidad_pago' => 'financiado',
            'plazo_meses' => 150,
            'consentimiento' => true,
            ...$extra,
        ];
    }

    /** Recorre el flujo completo y devuelve la cotizacion emitida. */
    private function emitir(Lote $lote, array $extra = []): Cotizacion
    {
        $token = $this->postJson('/cotizador/iniciar', ['lote_id' => $lote->id])->assertOk()->json('token');

        $this->post('/cotizador/emitir', $this->cliente(['atencion_token' => $token, 'lote_id' => $lote->id, ...$extra]))
            ->assertRedirect();

        return Cotizacion::latest('id')->firstOrFail();
    }

    public function test_precios_interior_320_esquina_330_y_contado_20_por_ciento(): void
    {
        $interior = $this->loteDisponible();
        $esquina = $this->loteDisponible(true);

        $a = $this->postJson('/cotizador/simular', ['lote_id' => $interior->id, 'modalidad_pago' => 'financiado', 'plazo_meses' => 150])->json('calculo');
        $this->assertEquals(round($interior->area_m2 * 320, 2), $a['precio_lista']);
        $this->assertEquals(0, $a['inicial_monto']);
        $this->assertEquals(round($interior->area_m2 * 320 / 150, 2), $a['cuota_mensual']);

        $b = $this->postJson('/cotizador/simular', ['lote_id' => $esquina->id, 'modalidad_pago' => 'financiado'])->json('calculo');
        $this->assertEquals(round($esquina->area_m2 * 330, 2), $b['precio_lista']);
        $this->assertEquals(150, $b['plazo_meses']);

        $c = $this->postJson('/cotizador/simular', ['lote_id' => $interior->id, 'modalidad_pago' => 'contado'])->json('calculo');
        $this->assertEquals(round($interior->area_m2 * 320 * 0.8, 2), $c['precio_final']);
    }

    public function test_el_cliente_obtiene_su_proforma_con_un_enlace_secreto(): void
    {
        Storage::fake('local');
        $cot = $this->emitir($this->loteDisponible());

        $this->assertMatchesRegularExpression('/^[A-Za-z0-9]{40}$/', $cot->token_publico);
        $this->get("/cotizacion/{$cot->token_publico}")->assertOk();
        $this->get("/cotizacion/{$cot->token_publico}/pdf")->assertOk();
        Storage::disk('local')->assertExists("proformas/{$cot->codigo}.pdf");

        // Ademas de dolares, la cotizacion congela el tipo de cambio para soles.
        $this->assertEquals(3.448, (float) $cot->tipo_cambio);
        $this->assertEquals('USD', $cot->moneda);
    }

    public function test_no_se_puede_adivinar_una_proforma_por_su_id_o_codigo(): void
    {
        $cot = $this->emitir($this->loteDisponible());

        $this->get("/cotizacion/{$cot->id}")->assertNotFound();
        $this->get("/cotizacion/{$cot->codigo}")->assertNotFound();
        $this->get('/cotizacion/'.str_repeat('a', 40))->assertNotFound();
        $this->get("/cotizacion/{$cot->token_publico}' OR '1'='1")->assertNotFound();
    }

    public function test_el_pdf_no_queda_en_la_carpeta_publica(): void
    {
        $cot = $this->emitir($this->loteDisponible());

        $this->assertFileDoesNotExist(public_path("storage/proformas/{$cot->codigo}.pdf"));
        $this->assertFileDoesNotExist(public_path("proformas/{$cot->codigo}.pdf"));
    }

    public function test_los_datos_del_cliente_se_muestran_enmascarados(): void
    {
        $cot = $this->emitir($this->loteDisponible());

        $this->get("/cotizacion/{$cot->token_publico}")
            ->assertDontSee('45678912')
            ->assertDontSee('912345678');
    }

    public function test_no_se_puede_cerrar_la_atencion_de_otra_persona(): void
    {
        $lote = $this->loteDisponible();
        $tokenAjeno = $this->postJson('/cotizador/iniciar', ['lote_id' => $lote->id])->json('token');

        // Otro navegador (sesion nueva) intenta usar ese token.
        $this->flushSession();
        $this->post('/cotizador/emitir', $this->cliente(['atencion_token' => $tokenAjeno, 'lote_id' => $lote->id]))
            ->assertSessionHas('error');

        $this->assertSame(0, Cotizacion::count());
    }

    public function test_el_cliente_no_puede_imponer_su_precio(): void
    {
        $lote = $this->loteDisponible();
        $cot = $this->emitir($lote, ['precio_final' => 1, 'precio_lista' => 1, 'descuento_pct' => 99, 'asesor_id' => 1, 'estado' => 'aceptada']);

        $this->assertEquals(round($lote->area_m2 * 320, 2), (float) $cot->precio_final);
        $this->assertNull($cot->asesor_id);
        $this->assertSame('emitida', $cot->estado);
    }

    public function test_no_se_cotiza_un_lote_vendido(): void
    {
        $vendido = Lote::where('estado', 'vendido')->firstOrFail();

        $this->postJson('/cotizador/iniciar', ['lote_id' => $vendido->id])->assertStatus(409);
    }

    public function test_el_plazo_no_puede_superar_el_maximo(): void
    {
        $lote = $this->loteDisponible();

        $this->postJson('/cotizador/simular', ['lote_id' => $lote->id, 'modalidad_pago' => 'financiado', 'plazo_meses' => 999])
            ->assertStatus(422);
    }

    public function test_un_asesor_no_ve_la_cotizacion_de_otro_asesor(): void
    {
        $duena = $this->usuario('asesor');
        $otra = $this->usuario('asesor');

        $this->actingAs($duena);
        $cot = $this->emitir($this->loteDisponible());
        $this->assertSame($duena->id, $cot->asesor_id);

        $this->actingAs($otra)->get("/panel/cotizaciones/{$cot->id}")->assertForbidden();
        $this->actingAs($otra)->get("/panel/cotizaciones/{$cot->id}/pdf")->assertForbidden();
        $this->actingAs($otra)->patch("/panel/cotizaciones/{$cot->id}/estado", ['estado' => 'aceptada'])->assertForbidden();

        $this->actingAs($this->usuario('gerente'))->get("/panel/cotizaciones/{$cot->id}")->assertOk();
    }

    public function test_un_asesor_no_puede_bloquear_lotes(): void
    {
        $lote = $this->loteDisponible();

        $this->actingAs($this->usuario('asesor'))
            ->patch("/panel/lotes/{$lote->id}/estado", ['estado' => 'bloqueado'])
            ->assertSessionHasErrors('estado');

        $this->assertSame('disponible', $lote->fresh()->estado);
    }

    public function test_el_csv_neutraliza_formulas_de_excel(): void
    {
        $this->assertSame("'=HYPERLINK(\"http://x\")", MetricaController::celdaSegura('=HYPERLINK("http://x")'));
        $this->assertSame("'+cmd", MetricaController::celdaSegura('+cmd'));
        $this->assertSame("'@SUM(A1)", MetricaController::celdaSegura('@SUM(A1)'));
        $this->assertSame('-12.5', MetricaController::celdaSegura('-12.5'));
        $this->assertSame('Quispe', MetricaController::celdaSegura('Quispe'));
    }
}
