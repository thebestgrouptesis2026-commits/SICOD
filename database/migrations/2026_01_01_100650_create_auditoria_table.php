<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Bitacora de seguridad: ingresos, intentos fallidos, cambios de estado de
| lotes, cambios de parametros y de cuentas. Solo se escribe; no existe ruta
| para editarla ni borrarla.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auditoria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('evento', 60);
            $table->string('descripcion');
            $table->string('entidad_tipo', 60)->nullable();
            $table->unsignedBigInteger('entidad_id')->nullable();
            $table->json('datos')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['evento', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditoria');
    }
};
