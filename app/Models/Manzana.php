<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Manzana extends Model
{
    protected $table = 'manzanas';

    protected $fillable = ['proyecto_id', 'codigo', 'nombre', 'orden'];

    public function proyecto(): BelongsTo
    {
        return $this->belongsTo(Proyecto::class);
    }

    public function lotes(): HasMany
    {
        return $this->hasMany(Lote::class)->orderBy('orden');
    }
}
