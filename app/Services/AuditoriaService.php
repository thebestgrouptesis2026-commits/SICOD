<?php

namespace App\Services;

use App\Models\Auditoria;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Bitacora de seguridad. Registra quien hizo que, desde que IP y cuando.
 */
class AuditoriaService
{
    public function registrar(
        string $evento,
        string $descripcion,
        ?Model $entidad = null,
        array $datos = [],
        ?int $usuarioId = null,
    ): void {
        $request = request();

        Auditoria::create([
            'user_id' => $usuarioId ?? $request?->user()?->id,
            'evento' => $evento,
            'descripcion' => Str::limit($descripcion, 250, ''),
            'entidad_tipo' => $entidad ? class_basename($entidad) : null,
            'entidad_id' => $entidad?->getKey(),
            'datos' => $datos ?: null,
            'ip' => $request?->ip(),
            'user_agent' => Str::limit((string) $request?->userAgent(), 250, ''),
            'created_at' => now(),
        ]);
    }
}
