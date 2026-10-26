<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lote extends Model
{
    protected $table = 'lotes';

    protected $fillable = [
        'manzana_id', 'codigo', 'frente_m', 'fondo_m', 'area_m2',
        'precio_lista', 'estado', 'esquina', 'observacion', 'geometria', 'orden',
    ];

    protected function casts(): array
    {
        return [
            'geometria' => 'array',
            'esquina' => 'boolean',
            'frente_m' => 'decimal:2',
            'fondo_m' => 'decimal:2',
            'area_m2' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        // El area siempre se deriva de las medidas: no se captura a mano.
        static::saving(function (Lote $lote) {
            $lote->area_m2 = round((float) $lote->frente_m * (float) $lote->fondo_m, 2);
        });
    }

    public function manzana(): BelongsTo
    {
        return $this->belongsTo(Manzana::class);
    }

    public function historial(): HasMany
    {
        return $this->hasMany(LoteHistorial::class)->latest('created_at');
    }

    public function cotizaciones(): HasMany
    {
        return $this->hasMany(Cotizacion::class);
    }

    /**
     * Precio por m2 que le corresponde segun su ubicacion: los lotes en
     * esquina tienen su propio precio (US$ 330 frente a US$ 320 interior).
     */
    public function getPrecioM2Attribute(): float
    {
        $proyecto = $this->manzana?->proyecto;

        if (! $proyecto) {
            return 0.0;
        }

        return (float) ($this->esquina ? $proyecto->precio_m2_esquina : $proyecto->precio_m2_interior);
    }

    /**
     * Precio efectivo en dolares: el fijo del lote, o area x precio por m2.
     */
    public function getPrecioAttribute(): float
    {
        if ($this->precio_lista !== null) {
            return (float) $this->precio_lista;
        }

        return round((float) $this->area_m2 * $this->precio_m2, 2);
    }

    public function estaDisponible(): bool
    {
        return $this->estado === 'disponible';
    }

    public function scopeDisponibles($query)
    {
        return $query->where('estado', 'disponible');
    }
}
