<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('nombres');
            $table->string('apellidos')->nullable();
            $table->enum('tipo_documento', ['DNI', 'CE', 'PAS', 'RUC'])->default('DNI');
            $table->string('numero_documento', 20);
            $table->string('telefono', 25);
            $table->string('email')->nullable();
            $table->enum('canal_origen', [
                'whatsapp', 'llamada', 'presencial', 'facebook',
                'instagram', 'web', 'referido', 'otro',
            ])->default('web');
            $table->foreignId('asesor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('consentimiento_datos')->default(false)
                  ->comment('Ley 29733 de Proteccion de Datos Personales');
            $table->timestamp('consentimiento_at')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->unique(['tipo_documento', 'numero_documento']);
            $table->index('telefono');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
