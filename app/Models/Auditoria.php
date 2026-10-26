<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Auditoria extends Model
{
    protected $table = 'auditoria';

    public $timestamps = false;

    protected $fillable = [
        'user_id', 'evento', 'descripcion', 'entidad_tipo', 'entidad_id',
        'datos', 'ip', 'user_agent', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'datos' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
