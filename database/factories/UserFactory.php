<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'nombres' => fake()->firstName(),
            'apellidos' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'telefono' => '9'.fake()->numerify('########'),
            'password' => 'Clave-Segura-2026',
            'remember_token' => Str::random(10),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (User $usuario) {
            $usuario->forceFill([
                'rol' => $usuario->rol ?? 'asesor',
                'activo' => $usuario->activo ?? true,
                'debe_cambiar_password' => $usuario->debe_cambiar_password ?? false,
            ]);
        });
    }

    public function rol(string $rol): static
    {
        return $this->afterMaking(fn (User $u) => $u->forceFill(['rol' => $rol]));
    }

    public function inactivo(): static
    {
        return $this->afterMaking(fn (User $u) => $u->forceFill(['activo' => false]));
    }

    public function conPasswordInicial(): static
    {
        return $this->afterMaking(fn (User $u) => $u->forceFill(['debe_cambiar_password' => true]));
    }
}
