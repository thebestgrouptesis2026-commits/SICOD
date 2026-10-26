<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoteHistorial extends Model
{
    protected $table = 'lote_historial';
    public $timestamps = false;

    protected $fillable = [
        'lote_id', 'estado_anterior', 'estado_nuevo', 'motivo', 'user_id', 'ip', 'created_at',
    ];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
