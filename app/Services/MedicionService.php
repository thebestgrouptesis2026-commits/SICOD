<?php

namespace App\Services;

use App\Models\Atencion;
use App\Models\Parametro;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Instrumentacion de los indicadores de la tesis.
 *
 * Este servicio es el "cronometro" del estudio. Sella T0 al abrir la
 * atencion y T1 al emitirse la cotizacion, ambos con la hora del servidor.
 * El navegador nunca envia una duracion: solo dispara los eventos.
 */
class MedicionService
{
    public function __construct(private CorrelativoService $correlativo) {}

    /**
     * Abre una atencion y sella T0.
     *
     * Se invoca en el momento en que el cliente entra al cotizador o en que
     * el asesor toma el contacto, no al pulsar "generar PDF": de lo contrario
     * el indicador 1 quedaria subestimado.
     */
    public function iniciarAtencion(
        ?int $proyectoId = null,
        string $canal = 'web',
        ?int $asesorId = null,
        ?int $clienteId = null,
    ): Atencion {
        return $this->correlativo->crearConCodigo('atenciones', 'ATN', fn (string $codigo) => Atencion::create([
            'codigo' => $codigo,
            'cliente_id' => $clienteId,
            'asesor_id' => $asesorId,
            'proyecto_id' => $proyectoId,
            'canal' => $canal,
            'fase' => 'postest',
            'origen' => 'sistema',
            'inicio_at' => now(),
            'sla_minutos' => (int) Parametro::obtener('sla_minutos', config('sicod.sla_minutos')),
            'session_token' => (string) Str::uuid(),
        ]));
    }

    /**
     * Cierra la atencion y calcula los tres indicadores.
     */
    public function cerrarAtencion(Atencion $atencion, bool $genereCotizacion = true): Atencion
    {
        if ($atencion->fin_at !== null) {
            return $atencion;
        }

        $fin = now();
        $segundos = $fin->diffInSeconds($atencion->inicio_at, absolute: true);
        $minutos = round($segundos / 60, 2);

        $atencion->forceFill([
            'fin_at' => $fin,
            'duracion_seg' => $segundos,
            'duracion_min' => $minutos,
            'cumple_sla' => $minutos <= $atencion->sla_minutos,
            'genero_cotizacion' => $genereCotizacion,
        ])->save();

        return $atencion->refresh();
    }

    /**
     * Transcribe un registro de la ficha de observacion del pretest (O1).
     *
     * Permite que el proceso manual y el sistema convivan en la misma tabla,
     * de modo que ambas fases produzcan un dataset comparable.
     */
    public function registrarAtencionManual(array $datos): Atencion
    {
        $inicio = Carbon::parse($datos['inicio_at']);
        $fin = Carbon::parse($datos['fin_at']);

        if ($fin->lt($inicio)) {
            throw new \InvalidArgumentException('La hora de termino no puede ser anterior a la de inicio.');
        }

        $segundos = $fin->diffInSeconds($inicio, absolute: true);
        $minutos = round($segundos / 60, 2);
        $sla = (int) Parametro::obtener('sla_minutos', config('sicod.sla_minutos'));

        return $this->correlativo->crearConCodigo('atenciones', 'ATN', fn (string $codigo) => Atencion::create([
            'codigo' => $codigo,
            'cliente_id' => $datos['cliente_id'] ?? null,
            'asesor_id' => $datos['asesor_id'] ?? null,
            'proyecto_id' => $datos['proyecto_id'] ?? null,
            'canal' => $datos['canal'] ?? 'whatsapp',
            'fase' => 'pretest',
            'origen' => 'manual',
            'inicio_at' => $inicio,
            'fin_at' => $fin,
            'sla_minutos' => $sla,
            'duracion_seg' => $segundos,
            'duracion_min' => $minutos,
            'cumple_sla' => $minutos <= $sla,
            'genero_cotizacion' => (bool) ($datos['genero_cotizacion'] ?? true),
            'agendo_visita' => (bool) ($datos['agendo_visita'] ?? false),
            'observacion' => $datos['observacion'] ?? null,
        ]));
    }
}
