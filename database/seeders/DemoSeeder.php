<?php

namespace Database\Seeders;

use App\Models\Atencion;
use App\Models\Cliente;
use App\Models\Cotizacion;
use App\Models\Lote;
use App\Models\Parametro;
use App\Models\Proyecto;
use App\Models\User;
use App\Models\Visita;
use App\Services\CotizadorService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * DATOS FICTICIOS - NO EJECUTAR EN PRODUCCION
 *
 * Genera 24 atenciones de pretest y 24 de postest (con su cotizacion)
 * unicamente para que el panel tenga algo que mostrar durante el
 * desarrollo y la demostracion del sistema.
 *
 * Los datos del Capitulo III deben provenir solo de:
 *   - pretest: formulario de carga en /admin/pretest (ficha de observacion)
 *   - postest: uso real del cotizador
 *
 * Para limpiar: php artisan sicod:limpiar-demo
 */
class DemoSeeder extends Seeder
{
    private const NOMBRES = [
        ['Rosa Elena', 'Quispe Huamán'], ['Juan Carlos', 'Mamani Ccori'], ['Lucía Fernanda', 'Torres Ríos'],
        ['Pedro Alonso', 'Huanca Rojas'], ['María del Pilar', 'Salazar Vega'], ['Wilmer', 'Yupanqui Condori'],
        ['Karina Isabel', 'Paredes Luna'], ['Óscar Raúl', 'Chávez Pinedo'], ['Ana Lucía', 'Flores Ramos'],
        ['Luis Miguel', 'Cárdenas Soto'], ['Gloria', 'Ccahuana Villa'], ['Diego Armando', 'Ruiz Paucar'],
    ];

    public function run(): void
    {
        $proyecto = Proyecto::firstOrFail();
        $asesores = User::where('rol', 'asesor')->pluck('id')->all();
        $sla = (int) Parametro::obtener('sla_minutos', 30);
        $canales = ['whatsapp', 'llamada', 'presencial', 'facebook', 'web', 'referido'];
        $cotizador = app(CotizadorService::class);
        $lotes = Lote::with('manzana.proyecto')->where('estado', 'disponible')->orderBy('id')->get();
        $correlativo = 1;
        $cotCorrelativo = 1;

        // --- PRETEST (O1): proceso manual, tiempos altos y dispersos ------
        for ($i = 1; $i <= 24; $i++) {
            $cliente = $this->cliente($i, $asesores, $canales);
            $inicio = Carbon::parse('2026-09-07 09:00:00')->addDays(intdiv($i, 2))->addMinutes(($i * 37) % 300);
            $duracion = 28 + (($i * 17) % 62);   // 28 a 89 minutos

            $this->atencion($correlativo++, $cliente, $proyecto, $asesores[$i % max(1, count($asesores))] ?? null,
                $canales[$i % count($canales)], 'pretest', 'manual', $inicio, $duracion, $sla, $i % 3 === 0);
        }

        // --- POSTEST (O2): con SICOD, tiempos bajos y concentrados --------
        for ($i = 1; $i <= 24; $i++) {
            $cliente = $this->cliente($i + 24, $asesores, $canales);
            $inicio = now()->subDays(24 - $i)->setTime(9, 0)->addMinutes(($i * 41) % 480);
            $duracion = 3 + (($i * 7) % 24);     // 3 a 26 minutos
            $autoservicio = $i % 3 === 0;
            $asesor = $autoservicio ? null : ($asesores[$i % max(1, count($asesores))] ?? null);
            $canal = $autoservicio ? 'web' : $canales[$i % count($canales)];
            $agendo = $i % 2 === 0 || $i % 5 === 0;

            $atencion = $this->atencion($correlativo++, $cliente, $proyecto, $asesor, $canal,
                'postest', 'sistema', $inicio, $duracion, $sla, false);

            $lote = $lotes[($i * 5) % $lotes->count()];
            $modalidad = $i % 4 === 0 ? 'contado' : 'financiado';
            $plazo = [150, 150, 120, 108, 150, 12][$i % 6];
            $calculo = $cotizador->calcular($lote, $modalidad, $modalidad === 'financiado' ? $plazo : null);
            unset($calculo['soles']);

            $cotizacion = Cotizacion::create([
                ...$calculo,
                'codigo' => sprintf('COT-%s-%05d', now()->format('Y'), $cotCorrelativo++),
                'atencion_id' => $atencion->id,
                'lote_id' => $lote->id,
                'cliente_id' => $cliente->id,
                'asesor_id' => $asesor,
                'cliente_nombre' => trim($cliente->nombres.' '.$cliente->apellidos),
                'cliente_documento' => $cliente->numero_documento,
                'cliente_telefono' => $cliente->telefono,
                'canal' => $canal,
                'estado' => 'emitida',
                'valida_hasta' => $atencion->fin_at->copy()->addDays(7)->toDateString(),
                'emitida_at' => $atencion->fin_at,
            ]);

            if ($agendo) {
                $programada = $atencion->fin_at->copy()->addDays(3)->setTime(10 + $i % 6, 0);

                Visita::create([
                    'cliente_id' => $cliente->id,
                    'atencion_id' => $atencion->id,
                    'cotizacion_id' => $cotizacion->id,
                    'lote_id' => $lote->id,
                    'asesor_id' => $asesor,
                    'programada_para' => $programada,
                    'estado' => $programada->isPast() ? ($i % 4 === 0 ? 'no_asistio' : 'realizada') : 'agendada',
                    'notas' => 'DEMO',
                ]);
            }
        }

        $this->command?->warn('48 atenciones DEMO creadas (24 pretest + 24 postest). Bórralas antes de tomar datos reales: php artisan sicod:limpiar-demo');
    }

    private function cliente(int $i, array $asesores, array $canales): Cliente
    {
        [$nombres, $apellidos] = self::NOMBRES[$i % count(self::NOMBRES)];

        $cliente = Cliente::firstOrNew(['tipo_documento' => 'DNI', 'numero_documento' => (string) (45000000 + $i * 137)]);
        $cliente->fill([
            'nombres' => $nombres,
            'apellidos' => $apellidos,
            'telefono' => '9'.str_pad((string) (10000000 + $i * 7919), 8, '0', STR_PAD_LEFT),
            'canal_origen' => $canales[$i % count($canales)],
            'asesor_id' => $asesores ? $asesores[$i % count($asesores)] : null,
            'consentimiento_datos' => true,
            'notas' => 'DEMO',
        ])->save();

        return $cliente;
    }

    private function atencion(
        int $correlativo, Cliente $cliente, Proyecto $proyecto, ?int $asesorId, string $canal,
        string $fase, string $origen, Carbon $inicio, int $duracion, int $sla, bool $convirtio,
    ): Atencion {
        return Atencion::create([
            'codigo' => sprintf('ATN-%s-%05d', now()->format('Y'), $correlativo),
            'cliente_id' => $cliente->id,
            'asesor_id' => $asesorId,
            'proyecto_id' => $proyecto->id,
            'canal' => $canal,
            'fase' => $fase,
            'origen' => $origen,
            'inicio_at' => $inicio,
            'fin_at' => $inicio->copy()->addMinutes($duracion),
            'sla_minutos' => $sla,
            'duracion_seg' => $duracion * 60,
            'duracion_min' => $duracion,
            'cumple_sla' => $duracion <= $sla,
            'genero_cotizacion' => true,
            'agendo_visita' => $convirtio,
            'observacion' => 'DEMO',
        ]);
    }
}
