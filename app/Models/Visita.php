<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Visita extends Model
{
    protected $table = 'visitas';

    protected $fillable = [
        'cliente_id', 'atencion_id', 'cotizacion_id', 'lote_id',
        'asesor_id', 'programada_para', 'estado', 'notas',
    ];

    protected function casts(): array
    {
        return ['programada_para' => 'datetime'];
    }

    protected static function booted(): void
    {
        // Marca la conversion en la atencion de origen (indicador 3).
        static::created(function (Visita $visita) {
            if ($visita->atencion_id) {
                Atencion::whereKey($visita->atencion_id)->update(['agendo_visita' => true]);
            }
        });
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function atencion(): BelongsTo
    {
        return $this->belongsTo(Atencion::class);
    }

    public function cotizacion(): BelongsTo
    {
        return $this->belongsTo(Cotizacion::class);
    }

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class);
    }

    public function asesor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'asesor_id');
    }
}
