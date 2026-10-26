<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cliente_id')->constrained('clientes')->cascadeOnDelete();
            $table->foreignId('atencion_id')->nullable()->constrained('atenciones')->nullOnDelete();
            $table->foreignId('cotizacion_id')->nullable()->constrained('cotizaciones')->nullOnDelete();
            $table->foreignId('lote_id')->nullable()->constrained('lotes')->nullOnDelete();
            $table->foreignId('asesor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('programada_para');
            $table->enum('estado', ['agendada', 'realizada', 'cancelada', 'no_asistio'])->default('agendada');
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index('programada_para');
        });

        Schema::create('reservas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lote_id')->constrained('lotes')->cascadeOnDelete();
            $table->foreignId('cliente_id')->constrained('clientes')->restrictOnDelete();
            $table->foreignId('cotizacion_id')->nullable()->constrained('cotizaciones')->nullOnDelete();
            $table->foreignId('asesor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('monto', 12, 2)->default(0);
            $table->timestamp('vence_at');
            $table->enum('estado', ['activa', 'vencida', 'liberada', 'concretada'])->default('activa');
            $table->timestamps();

            $table->index(['lote_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservas');
        Schema::dropIfExists('visitas');
    }
};
