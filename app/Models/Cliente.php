<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $fillable = [
        'nombres', 'apellidos', 'tipo_documento', 'numero_documento',
        'telefono', 'email', 'canal_origen', 'asesor_id',
        'consentimiento_datos', 'consentimiento_at', 'notas',
    ];

    protected function casts(): array
    {
        return [
            'consentimiento_datos' => 'boolean',
            'consentimiento_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Cliente $cliente) {
            if ($cliente->consentimiento_datos && $cliente->consentimiento_at === null) {
                $cliente->consentimiento_at = now();
            }
        });
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombres} {$this->apellidos}");
    }

    public function asesor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'asesor_id');
    }

    public function atenciones(): HasMany
    {
        return $this->hasMany(Atencion::class);
    }

    public function cotizaciones(): HasMany
    {
        return $this->hasMany(Cotizacion::class);
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visita::class);
    }
}
