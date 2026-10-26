<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| ATENCIONES - Nucleo de medicion de la tesis
|--------------------------------------------------------------------------
| Una fila = una unidad de analisis de la ficha de registro de tiempos.
| Sirve para el pretest (transcrito, origen='manual') y para el postest
| (cronometrado por el sistema, origen='sistema'), de modo que ambas fases
| producen un unico dataset comparable exportable a SPSS.
|
|   inicio_at      -> T0  (indicador 1)
|   fin_at         -> T1  (indicador 1)
|   duracion_min   -> VD1 tiempo promedio de generacion de cotizaciones
|   cumple_sla     -> VD2 nivel de cumplimiento (<= 30 min)
|   agendo_visita  -> VD3 tasa de conversion a visitas agendadas
*/

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('atenciones', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique();
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->foreignId('asesor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('proyecto_id')->nullable()->constrained('proyectos')->nullOnDelete();

            $table->enum('canal', [
                'whatsapp', 'llamada', 'presencial', 'facebook',
                'instagram', 'web', 'referido', 'otro',
            ])->default('web');

            $table->enum('fase', ['pretest', 'postest'])->default('postest');
            $table->enum('origen', ['manual', 'sistema'])->default('sistema');

            $table->timestamp('inicio_at');
            $table->timestamp('fin_at')->nullable();

            // SLA vigente congelado por fila: cambiarlo despues no altera
            // las mediciones ya registradas.
            $table->unsignedSmallInteger('sla_minutos')->default(30);

            $table->unsignedInteger('duracion_seg')->nullable();
            $table->decimal('duracion_min', 10, 2)->nullable();
            $table->boolean('cumple_sla')->nullable();

            $table->boolean('genero_cotizacion')->default(false);
            $table->boolean('agendo_visita')->default(false);

            $table->string('session_token', 64)->nullable()->index()
                  ->comment('Vincula la atencion con la sesion anonima del cliente en el cotizador publico');
            $table->string('observacion')->nullable();
            $table->timestamps();

            $table->index('fase');
            $table->index('inicio_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atenciones');
    }
};
