<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ParametroSeeder::class,
            UsuarioSeeder::class,
            ProyectoSeeder::class,
        ]);

        $this->command?->info('Datos base cargados. Para datos de demostración: php artisan db:seed --class=DemoSeeder');
    }
}
