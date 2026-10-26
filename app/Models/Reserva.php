<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reserva extends Model
{
    protected $table = 'reservas';

    protected $fillable = [
        'lote_id', 'cliente_id', 'cotizacion_id', 'asesor_id',
        'monto', 'vence_at', 'estado',
    ];

    protected function casts(): array
    {
        return ['vence_at' => 'datetime'];
    }

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function scopeActivas($query)
    {
        return $query->where('estado', 'activa');
    }
}
