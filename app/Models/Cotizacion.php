<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Cotizacion extends Model
{
    protected $table = 'cotizaciones';

    protected $fillable = [
        'codigo', 'atencion_id', 'lote_id', 'cliente_id', 'asesor_id',
        'cliente_nombre', 'cliente_documento', 'cliente_telefono', 'cliente_email', 'canal',
        'modalidad_pago', 'moneda', 'tipo_cambio', 'precio_m2', 'precio_lista',
        'descuento_pct', 'descuento_monto', 'precio_final',
        'inicial_pct', 'inicial_monto', 'saldo', 'plazo_meses', 'tasa_anual_pct',
        'cuota_mensual', 'total_financiado', 'estado', 'valida_hasta',
        'pdf_path', 'emitida_at',
    ];

    /*
     * El token publico y la ruta del PDF nunca viajan en una respuesta JSON
     * por accidente: hay que pedirlos de forma explicita.
     */
    protected $hidden = ['token_publico', 'pdf_path'];

    protected function casts(): array
    {
        return [
            'emitida_at' => 'datetime',
            'valida_hasta' => 'date',
            'tipo_cambio' => 'decimal:4',
            'precio_m2' => 'decimal:2',
            'precio_lista' => 'decimal:2',
            'descuento_monto' => 'decimal:2',
            'precio_final' => 'decimal:2',
            'saldo' => 'decimal:2',
            'cuota_mensual' => 'decimal:2',
            'total_financiado' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Cotizacion $cotizacion) {
            // 40 caracteres aleatorios (~238 bits): imposible de adivinar.
            $cotizacion->token_publico ??= Str::random(40);
        });
    }

    public function atencion(): BelongsTo
    {
        return $this->belongsTo(Atencion::class);
    }

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function asesor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'asesor_id');
    }

    public function visitas(): HasMany
    {
        return $this->hasMany(Visita::class);
    }

    public function estaVigente(): bool
    {
        return $this->valida_hasta === null || $this->valida_hasta->endOfDay()->isFuture();
    }

    /** Equivalente en soles con el tipo de cambio congelado en la cotizacion. */
    public function enSoles(float|string|null $montoUsd): float
    {
        return round((float) $montoUsd * (float) $this->tipo_cambio, 2);
    }
}
