<?php

namespace Tests\Feature;

use App\Models\Auditoria;
use App\Models\User;
use Tests\TestCase;

/**
 * Autenticacion y control de acceso por rol (Strix: authentication,
 * broken_function_level_authorization, information_disclosure).
 */
class SeguridadAccesoTest extends TestCase
{
    public function test_el_panel_exige_iniciar_sesion(): void
    {
        $this->get('/panel')->assertRedirect('/ingresar');
        $this->get('/admin/usuarios')->assertRedirect('/ingresar');
        $this->get('/panel/metricas/exportar')->assertRedirect('/ingresar');
    }

    public function test_ingreso_correcto_queda_auditado(): void
    {
        $u = $this->usuario('asesor', ['email' => 'asesor@test.pe']);

        $this->post('/ingresar', ['email' => 'asesor@test.pe', 'password' => 'Clave-Segura-2026'])
            ->assertRedirect('/panel');

        $this->assertAuthenticatedAs($u);
        $this->assertTrue(Auditoria::where('evento', 'login.exitoso')->exists());
    }

    public function test_el_error_de_ingreso_no_revela_si_el_correo_existe(): void
    {
        $this->usuario('asesor', ['email' => 'real@test.pe']);

        $existe = $this->post('/ingresar', ['email' => 'real@test.pe', 'password' => 'incorrecta'])->getSession()->get('errors')->first('email');
        $this->flushSession();
        $noExiste = $this->post('/ingresar', ['email' => 'nadie@test.pe', 'password' => 'incorrecta'])->getSession()->get('errors')->first('email');

        $this->assertSame($existe, $noExiste);
        $this->assertGuest();
    }

    public function test_fuerza_bruta_bloquea_la_cuenta(): void
    {
        $this->usuario('admin', ['email' => 'admin@test.pe']);

        for ($i = 0; $i < 5; $i++) {
            $this->post('/ingresar', ['email' => 'admin@test.pe', 'password' => "mala-$i"]);
        }

        // Aun con la contrasena correcta, el sexto intento se rechaza.
        $respuesta = $this->post('/ingresar', ['email' => 'admin@test.pe', 'password' => 'Clave-Segura-2026']);

        $this->assertContains($respuesta->status(), [302, 429]);
        $this->assertGuest();
    }

    public function test_una_cuenta_desactivada_no_puede_ingresar(): void
    {
        User::factory()->inactivo()->create(['email' => 'baja@test.pe']);

        $this->post('/ingresar', ['email' => 'baja@test.pe', 'password' => 'Clave-Segura-2026']);

        $this->assertGuest();
    }

    public function test_la_contrasena_inicial_debe_cambiarse(): void
    {
        $u = User::factory()->conPasswordInicial()->create();

        $this->actingAs($u)->get('/panel')->assertRedirect('/cuenta/password');
    }

    public function test_el_asesor_no_entra_a_paginas_de_gerencia_ni_administracion(): void
    {
        $asesor = $this->usuario('asesor');

        foreach (['/panel/metricas', '/panel/metricas/exportar', '/admin/parametros', '/admin/pretest', '/admin/usuarios', '/admin/auditoria'] as $url) {
            $this->actingAs($asesor)->get($url)->assertForbidden();
        }

        $this->actingAs($asesor)->put('/admin/parametros', ['tipo_cambio' => 1])->assertForbidden();
        $this->actingAs($asesor)->post('/admin/usuarios', [])->assertForbidden();
    }

    public function test_el_gerente_no_administra_cuentas(): void
    {
        $gerente = $this->usuario('gerente');

        $this->actingAs($gerente)->get('/panel/metricas')->assertOk();
        $this->actingAs($gerente)->get('/admin/parametros')->assertOk();
        $this->actingAs($gerente)->get('/admin/usuarios')->assertForbidden();
        $this->actingAs($gerente)->get('/admin/auditoria')->assertForbidden();
    }

    public function test_el_administrador_accede_a_todo(): void
    {
        $admin = $this->usuario('admin');

        foreach (['/panel', '/panel/cotizaciones', '/panel/lotes', '/panel/metricas', '/admin/parametros', '/admin/usuarios', '/admin/auditoria'] as $url) {
            $this->actingAs($admin)->get($url)->assertOk();
        }
    }

    public function test_nadie_puede_auto_asignarse_el_rol_de_administrador(): void
    {
        $admin = $this->usuario('admin');

        // 'rol' y 'activo' no son asignables en masa: el controlador los fija explicitamente.
        $this->assertNotContains('rol', (new User)->getFillable());
        $this->assertNotContains('activo', (new User)->getFillable());

        $this->actingAs($admin)->post('/admin/usuarios', [
            'nombres' => 'Nueva', 'apellidos' => 'Asesora', 'email' => 'nueva@test.pe',
            'rol' => 'superadmin', 'password' => 'Clave-Segura-2026',
        ])->assertSessionHasErrors('rol');
    }

    public function test_cabeceras_de_seguridad(): void
    {
        $r = $this->get('/');

        $r->assertOk();
        $r->assertHeader('X-Frame-Options', 'DENY');
        $r->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertStringContainsString("frame-ancestors 'none'", $r->headers->get('Content-Security-Policy'));
        $this->assertStringContainsString("object-src 'none'", $r->headers->get('Content-Security-Policy'));
        $this->assertNotNull($r->headers->get('Referrer-Policy'));
    }

    public function test_los_errores_no_exponen_detalles_internos(): void
    {
        $this->get('/no-existe-esta-ruta')->assertNotFound()->assertDontSee('vendor/laravel');
    }
}
