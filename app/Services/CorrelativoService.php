<?php

namespace App\Services;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/**
 * Codigos correlativos legibles (COT-2026-00001, ATN-2026-00001).
 *
 * Dos peticiones simultaneas pueden calcular el mismo numero; la columna
 * es UNIQUE, asi que la segunda falla y se reintenta con el siguiente.
 * El codigo es solo una etiqueta para personas: nunca sirve para acceder
 * a una cotizacion desde fuera (para eso esta el token aleatorio).
 */
class CorrelativoService
{
    /**
     * @template T
     * @param  callable(string): T  $crear
     * @return T
     */
    public function crearConCodigo(string $tabla, string $prefijo, callable $crear, int $intentos = 5): mixed
    {
        $anio = now()->format('Y');

        for ($i = 1; $i <= $intentos; $i++) {
            $ultimo = DB::table($tabla)->where('codigo', 'like', "{$prefijo}-{$anio}-%")->max('codigo');
            $numero = ($ultimo ? (int) substr($ultimo, -5) : 0) + $i;
            $codigo = sprintf('%s-%s-%05d', $prefijo, $anio, $numero);

            try {
                return DB::transaction(fn () => $crear($codigo));
            } catch (QueryException $e) {
                if (! $this->esDuplicado($e) || $i === $intentos) {
                    throw $e;
                }
            }
        }

        throw new \RuntimeException('No se pudo generar un codigo correlativo.');
    }

    private function esDuplicado(QueryException $e): bool
    {
        $codigo = (string) ($e->errorInfo[1] ?? '');

        // 1062 = MySQL/MariaDB duplicate entry; 19 = SQLite constraint.
        return in_array($codigo, ['1062', '19'], true) || str_contains($e->getMessage(), 'UNIQUE');
    }
}
