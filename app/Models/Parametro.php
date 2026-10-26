<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Parametro extends Model
{
    protected $table = 'parametros';
    protected $primaryKey = 'clave';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['clave', 'valor', 'descripcion'];

    /**
     * Lee un parametro con respaldo en config/sicod.php.
     */
    public static function obtener(string $clave, mixed $porDefecto = null): mixed
    {
        $valor = Cache::remember("parametro.{$clave}", 300, function () use ($clave) {
            return static::where('clave', $clave)->value('valor');
        });

        if ($valor === null) {
            return $porDefecto ?? config("sicod.{$clave}");
        }

        $decodificado = json_decode($valor, true);

        return json_last_error() === JSON_ERROR_NONE ? $decodificado : $valor;
    }

    public static function guardar(string $clave, mixed $valor, ?string $descripcion = null): void
    {
        static::updateOrCreate(
            ['clave' => $clave],
            ['valor' => is_scalar($valor) ? (string) $valor : json_encode($valor),
             'descripcion' => $descripcion]
        );

        Cache::forget("parametro.{$clave}");
    }
}
