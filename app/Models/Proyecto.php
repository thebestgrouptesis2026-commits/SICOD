<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Proyecto extends Model
{
    protected $table = 'proyectos';

    protected $fillable = [
        'codigo', 'nombre', 'ubicacion', 'distrito', 'provincia',
        'moneda', 'precio_m2_interior', 'precio_m2_esquina', 'telefono', 'whatsapp', 'amenidades', 'activo',
    ];

    protected function casts(): array
    {
        return [
            'amenidades' => 'array',
            'activo' => 'boolean',
            'precio_m2_interior' => 'decimal:2',
            'precio_m2_esquina' => 'decimal:2',
        ];
    }

    public function manzanas(): HasMany
    {
        return $this->hasMany(Manzana::class)->orderBy('orden');
    }

    public function lotes(): HasManyThrough
    {
        return $this->hasManyThrough(Lote::class, Manzana::class);
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}
