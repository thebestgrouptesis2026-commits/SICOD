<?php

namespace App\Services;

use App\Models\Cotizacion;
use App\Models\Lote;
use App\Models\LoteHistorial;
use App\Models\Parametro;
use App\Models\Reserva;
use Illuminate\Support\Facades\DB;

/**
 * Gestion del estado de los lotes.
 *
 * Todo cambio de estado pasa por aqui, de modo que ninguno queda sin
 * registro en lote_historial (dimension Seguridad - Integridad).
 */
class DisponibilidadService
{
    public const ESTADOS = ['disponible', 'reservado', 'vendido', 'bloqueado'];

    public function __construct(private AuditoriaService $auditoria) {}

    public function cambiarEstado(
        Lote $lote,
        string $nuevoEstado,
        ?string $motivo = null,
        ?int $usuarioId = null,
        ?string $ip = null,
    ): Lote {
        if (! in_array($nuevoEstado, self::ESTADOS, true)) {
            throw new \InvalidArgumentException('Estado de lote no valido.');
        }

        return DB::transaction(function () use ($lote, $nuevoEstado, $motivo, $usuarioId, $ip) {
            $lote = Lote::whereKey($lote->id)->lockForUpdate()->firstOrFail();
            $anterior = $lote->estado;

            if ($anterior === $nuevoEstado) {
                return $lote;
            }

            $lote->forceFill(['estado' => $nuevoEstado])->save();

            LoteHistorial::create([
                'lote_id' => $lote->id,
                'estado_anterior' => $anterior,
                'estado_nuevo' => $nuevoEstado,
                'motivo' => $motivo,
                'user_id' => $usuarioId,
                'ip' => $ip,
                'created_at' => now(),
            ]);

            $this->auditoria->registrar(
                'lote.estado',
                "Lote {$lote->codigo}: {$anterior} -> {$nuevoEstado}",
                $lote,
                ['anterior' => $anterior, 'nuevo' => $nuevoEstado, 'motivo' => $motivo],
                $usuarioId,
            );

            return $lote->refresh();
        });
    }

    public function reservar(Cotizacion $cotizacion, ?int $dias = null, float $monto = 0): Reserva
    {
        $dias ??= (int) Parametro::obtener('dias_reserva', config('sicod.dias_reserva'));

        return DB::transaction(function () use ($cotizacion, $dias, $monto) {
            $lote = Lote::whereKey($cotizacion->lote_id)->lockForUpdate()->firstOrFail();

            if (! $lote->estaDisponible()) {
                throw new \RuntimeException("El lote {$lote->codigo} ya no esta disponible.");
            }

            $reserva = Reserva::create([
                'lote_id' => $lote->id,
                'cliente_id' => $cotizacion->cliente_id,
                'cotizacion_id' => $cotizacion->id,
                'asesor_id' => $cotizacion->asesor_id,
                'monto' => $monto,
                'vence_at' => now()->addDays($dias),
                'estado' => 'activa',
            ]);

            $this->cambiarEstado(
                $lote,
                'reservado',
                "Reserva {$cotizacion->codigo} por {$dias} dias",
                $cotizacion->asesor_id,
            );

            return $reserva;
        });
    }

    /**
     * Devuelve al inventario los lotes cuya reserva vencio. Corre a diario.
     */
    public function liberarReservasVencidas(): int
    {
        $vencidas = Reserva::activas()->where('vence_at', '<', now())->get();

        foreach ($vencidas as $reserva) {
            $reserva->update(['estado' => 'vencida']);

            if ($lote = Lote::find($reserva->lote_id)) {
                $this->cambiarEstado($lote, 'disponible', 'Reserva vencida automaticamente');
            }
        }

        return $vencidas->count();
    }
}
