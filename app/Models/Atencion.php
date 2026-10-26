<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Unidad de analisis del estudio.
 *
 * duracion_min  -> indicador 1 (tiempo de generacion de la cotizacion)
 * cumple_sla    -> indicador 2 (nivel de cumplimiento <= 30 min)
 * agendo_visita -> indicador 3 (tasa de conversion a visitas)
 *
 * Los tres se calculan en el servidor al cerrar la atencion. Ningun
 * formulario los recibe como entrada.
 */
class Atencion extends Model
{
    protected $table = 'atenciones';

    protected $fillable = [
        'codigo', 'cliente_id', 'asesor_id', 'proyecto_id', 'canal',
        'fase', 'origen', 'inicio_at', 'fin_at', 'sla_minutos',
        'duracion_seg', 'duracion_min', 'cumple_sla',
        'genero_cotizacion', 'agendo_visita', 'session_token', 'observacion',
    ];

    protected function casts(): array
    {
        return [
            'inicio_at' => 'datetime',
            'fin_at' => 'datetime',
            'cumple_sla' => 'boolean',
            'genero_cotizacion' => 'boolean',
            'agendo_visita' => 'boolean',
            'duracion_min' => 'decimal:2',
        ];
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function asesor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'asesor_id');
    }

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class);
    }

    public function cotizacion(): HasOne
    {
        return $this->hasOne(Cotizacion::class);
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visita::class);
    }

    public function estaAbierta(): bool
    {
        return $this->fin_at === null;
    }

    public function scopePostest($query)
    {
        return $query->where('fase', 'postest');
    }

    public function scopeCerradas($query)
    {
        return $query->whereNotNull('fin_at');
    }
}
