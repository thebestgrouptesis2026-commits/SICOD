<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proyectos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 30)->unique();
            $table->string('nombre');
            $table->string('ubicacion')->nullable();
            $table->string('distrito', 80)->nullable();
            $table->string('provincia', 80)->nullable();
            // Los precios de lista se fijan en dolares; el equivalente en soles
            // se calcula con el tipo de cambio vigente (parametro tipo_cambio).
            $table->char('moneda', 3)->default('USD');
            $table->decimal('precio_m2_interior', 12, 2)->comment('Precio por m2 de un lote interior');
            $table->decimal('precio_m2_esquina', 12, 2)->comment('Precio por m2 de un lote en esquina');
            $table->string('telefono', 25)->nullable();
            $table->string('whatsapp', 25)->nullable();
            $table->json('amenidades')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('manzanas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proyecto_id')->constrained('proyectos')->cascadeOnDelete();
            $table->string('codigo', 20);
            $table->string('nombre', 60);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->timestamps();

            $table->unique(['proyecto_id', 'codigo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manzanas');
        Schema::dropIfExists('proyectos');
    }
};
