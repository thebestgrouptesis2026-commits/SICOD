<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public const ROLES = ['admin', 'gerente', 'asesor'];

    /*
     * `rol`, `activo` y `debe_cambiar_password` no son asignables en masa:
     * solo el administrador los cambia, con forceFill y de forma explicita.
     */
    protected $fillable = [
        'nombres', 'apellidos', 'email', 'telefono', 'password',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $appends = [];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'activo' => 'boolean',
            'debe_cambiar_password' => 'boolean',
            'password_cambiado_at' => 'datetime',
            'ultimo_acceso_at' => 'datetime',
        ];
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombres} {$this->apellidos}");
    }

    public function getInicialesAttribute(): string
    {
        $a = mb_substr(trim((string) $this->nombres), 0, 1);
        $b = mb_substr(trim((string) $this->apellidos), 0, 1);

        return mb_strtoupper($a.$b);
    }

    public function esAdmin(): bool
    {
        return $this->rol === 'admin';
    }

    /** Administrador o gerente: ven toda la cartera y las metricas. */
    public function esSupervisor(): bool
    {
        return in_array($this->rol, ['admin', 'gerente'], true);
    }

    public function atenciones(): HasMany
    {
        return $this->hasMany(Atencion::class, 'asesor_id');
    }

    public function clientes(): HasMany
    {
        return $this->hasMany(Cliente::class, 'asesor_id');
    }
}
