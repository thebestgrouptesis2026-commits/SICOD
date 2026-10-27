<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        $cuentas = [
            ['nombres' => 'Marcelo Zacarias', 'apellidos' => 'Leguia Medina',    'email' => 'admin@taipe.pe',    'rol' => 'admin'],
            ['nombres' => 'Jhon Walter',      'apellidos' => 'Mosquera Espinoza', 'email' => 'gerencia@taipe.pe', 'rol' => 'gerente'],
            ['nombres' => 'Joseph Piero',     'apellidos' => 'Mauricio Quispe',  'email' => 'asesor1@taipe.pe',  'rol' => 'asesor'],
        ];

        foreach ($cuentas as $i => $cuenta) {
            $usuario = User::firstOrNew(['email' => $cuenta['email']]);

            $usuario->fill([
                'nombres' => $cuenta['nombres'],
                'apellidos' => $cuenta['apellidos'],
                'telefono' => '98765432'.$i,
            ]);

            // La contrasena inicial solo se fija al crear la cuenta; volver a
            // correr el seeder no reinicia una contrasena ya cambiada.
            if (! $usuario->exists) {
                $usuario->forceFill([
                    'password' => Hash::make(config('sicod.password_inicial')),
                    'debe_cambiar_password' => true,
                ]);
            }

            $usuario->forceFill(['rol' => $cuenta['rol'], 'activo' => true])->save();
        }

        // No se imprime una contrasena propia: en un servidor queda en los logs.
        $this->command?->warn(config('sicod.password_inicial') === 'sicod2026'
            ? 'Contraseña inicial: sicod2026. El sistema pedirá cambiarla en el primer ingreso.'
            : 'Contraseña inicial: la definida en SICOD_PASSWORD_INICIAL. El sistema pedirá cambiarla en el primer ingreso.');
    }
}
