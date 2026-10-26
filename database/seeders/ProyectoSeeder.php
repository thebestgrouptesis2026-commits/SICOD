<?php

namespace Database\Seeders;

use App\Models\Lote;
use App\Models\Manzana;
use App\Models\Proyecto;
use Illuminate\Database\Seeder;

/**
 * Proyecto de ejemplo. Reemplazar por el plano real de la empresa:
 * manzanas, frentes y fondos de cada lote.
 */
class ProyectoSeeder extends Seeder
{
    public function run(): void
    {
        $proyecto = Proyecto::updateOrCreate(
            ['codigo' => 'TAIPE-E1'],
            [
                'nombre' => 'Proyecto Taipe · Etapa I',
                'ubicacion' => 'Lima, Perú',
                'distrito' => 'Lima',
                'provincia' => 'Lima',
                'moneda' => 'USD',
                'precio_m2_interior' => 320.00,
                'precio_m2_esquina' => 330.00,
                'telefono' => '+51 987 654 321',
                'whatsapp' => '51987654321',
                'amenidades' => ['agua' => true, 'luz' => true, 'pistas' => true, 'parque' => true],
                'activo' => true,
            ]
        );

        // 4 manzanas de 16 lotes en dos filas espalda con espalda.
        // Los lotes en los extremos de cada fila son esquinas.
        $manzanas = [
            ['codigo' => 'A', 'fondo' => 16.0],
            ['codigo' => 'B', 'fondo' => 16.0],
            ['codigo' => 'C', 'fondo' => 17.5],
            ['codigo' => 'D', 'fondo' => 17.5],
        ];
        $frentes = [9, 8, 8, 8, 8, 8, 8, 9];
        $calles = [
            'A' => ['Calle Los Pinos', 'Calle Las Lomas'],
            'B' => ['Calle Los Pinos', 'Calle Las Lomas'],
            'C' => ['Calle Los Olivos', 'Calle Las Retamas'],
            'D' => ['Calle Los Olivos', 'Calle Las Retamas'],
        ];

        $vendidos = ['A-03', 'A-04', 'A-12', 'B-01', 'B-06', 'B-07', 'C-02', 'C-10', 'C-11', 'D-05', 'D-14', 'D-16'];
        $reservados = ['A-09', 'B-11', 'C-05', 'D-02', 'D-08'];

        foreach ($manzanas as $indice => $mz) {
            $manzana = Manzana::updateOrCreate(
                ['proyecto_id' => $proyecto->id, 'codigo' => $mz['codigo']],
                ['nombre' => 'Mz. '.$mz['codigo'], 'orden' => $indice + 1]
            );

            for ($n = 1; $n <= 16; $n++) {
                $posicion = ($n - 1) % 8;            // 0..7 dentro de la fila
                $fila = $n <= 8 ? 0 : 1;             // 0 = norte, 1 = sur
                // La fila sur se numera de derecha a izquierda.
                $frente = $frentes[$fila === 0 ? $posicion : 7 - $posicion];
                $esquina = in_array($posicion, [0, 7], true);
                $codigo = sprintf('%s-%02d', $mz['codigo'], $n);

                $lote = Lote::updateOrCreate(
                    ['manzana_id' => $manzana->id, 'codigo' => $codigo],
                    [
                        'frente_m' => $frente,
                        'fondo_m' => $mz['fondo'],
                        'esquina' => $esquina,
                        'observacion' => ($esquina ? 'Esquina' : 'Interior').' · frente a '.$calles[$mz['codigo']][$fila],
                        'orden' => $n,
                    ]
                );

                $lote->forceFill(['estado' => match (true) {
                    in_array($codigo, $vendidos, true) => 'vendido',
                    in_array($codigo, $reservados, true) => 'reservado',
                    default => 'disponible',
                }])->save();
            }
        }

        $this->command?->info('Proyecto "Proyecto Taipe · Etapa I" cargado con 4 manzanas y 64 lotes.');
    }
}
