<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cotizaciones', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique();

            // Enlace publico de la proforma. Es aleatorio (40 caracteres) para
            // que nadie pueda adivinar la cotizacion de otro cliente cambiando
            // un numero en la URL (IDOR).
            $table->char('token_publico', 40)->unique();

            $table->foreignId('atencion_id')->constrained('atenciones')->cascadeOnDelete();
            $table->foreignId('lote_id')->constrained('lotes')->restrictOnDelete();
            $table->foreignId('cliente_id')->constrained('clientes')->restrictOnDelete();
            $table->foreignId('asesor_id')->nullable()->constrained('users')->nullOnDelete();

            // Copia de los datos de contacto tal como se entregaron en esta
            // cotizacion. Un visitante anonimo nunca sobrescribe la ficha del
            // cliente existente; lo que escribio queda aqui.
            $table->string('cliente_nombre', 240);
            $table->string('cliente_documento', 20);
            $table->string('cliente_telefono', 25);
            $table->string('cliente_email')->nullable();
            $table->string('canal', 20)->default('web');

            $table->enum('modalidad_pago', ['contado', 'financiado'])->default('financiado');
            $table->char('moneda', 3)->default('USD');
            $table->decimal('tipo_cambio', 8, 4)->comment('Soles por dolar usado en esta cotizacion');
            $table->decimal('precio_m2', 12, 2);
            $table->decimal('precio_lista', 12, 2);
            $table->decimal('descuento_pct', 5, 2)->default(0);
            $table->decimal('descuento_monto', 12, 2)->default(0);
            $table->decimal('precio_final', 12, 2);
            $table->decimal('inicial_pct', 5, 2)->default(0);
            $table->decimal('inicial_monto', 12, 2)->default(0);
            $table->decimal('saldo', 12, 2)->default(0);
            $table->unsignedSmallInteger('plazo_meses')->default(0);
            $table->decimal('tasa_anual_pct', 6, 3)->default(0);
            $table->decimal('cuota_mensual', 12, 2)->default(0);
            $table->decimal('total_financiado', 12, 2)->default(0);

            $table->enum('estado', ['emitida', 'aceptada', 'rechazada', 'vencida'])->default('emitida');
            $table->date('valida_hasta')->nullable();
            $table->string('pdf_path')->nullable();
            $table->timestamp('emitida_at');
            $table->timestamps();

            $table->index('emitida_at');
            $table->index('asesor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cotizaciones');
    }
};
