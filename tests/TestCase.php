<?php

namespace Tests;

use App\Models\User;
use Database\Seeders\ParametroSeeder;
use Database\Seeders\ProyectoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed([ParametroSeeder::class, ProyectoSeeder::class]);
    }

    protected function usuario(string $rol = 'asesor', array $extra = []): User
    {
        return User::factory()->rol($rol)->create($extra);
    }
}
