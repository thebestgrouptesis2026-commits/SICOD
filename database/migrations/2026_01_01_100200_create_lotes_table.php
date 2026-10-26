<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manzana_id')->constrained('manzanas')->cascadeOnDelete();
            $table->string('codigo', 20);
            $table->decimal('frente_m', 6, 2);
            $table->decimal('fondo_m', 6, 2);
            $table->decimal('area_m2', 10, 2);
            $table->decimal('precio_lista', 12, 2)->nullable()
                  ->comment('Precio fijo en USD. Si es NULL: area_m2 x precio por m2 del proyecto (interior o esquina)');
            $table->enum('estado', ['disponible', 'reservado', 'vendido', 'bloqueado'])->default('disponible');
            $table->boolean('esquina')->default(false);
            $table->string('observacion')->nullable();
            $table->json('geometria')->nullable()->comment('Poligono SVG: {"points":"x1,y1 x2,y2 ..."}');
            $table->unsignedSmallInteger('orden')->default(0);
            $table->timestamps();

            $table->unique(['manzana_id', 'codigo']);
            $table->index('estado');
        });

        // Trazabilidad de la disponibilidad (dimension Seguridad - Integridad)
        Schema::create('lote_historial', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lote_id')->constrained('lotes')->cascadeOnDelete();
            $table->string('estado_anterior', 20)->nullable();
            $table->string('estado_nuevo', 20);
            $table->string('motivo')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['lote_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lote_historial');
        Schema::dropIfExists('lotes');
    }
};
