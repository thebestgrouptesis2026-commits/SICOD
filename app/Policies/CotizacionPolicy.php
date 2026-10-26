<?php

namespace App\Policies;

use App\Models\Cotizacion;
use App\Models\User;

/**
 * Quien puede ver o trabajar una cotizacion dentro del panel.
 *
 * - Administrador y gerente: toda la cartera.
 * - Asesor: las suyas y los leads web que aun no tienen asesor (para
 *   tomarlos). No puede abrir la cotizacion de otro asesor cambiando el
 *   numero en la URL (IDOR).
 */
class CotizacionPolicy
{
    public function view(User $usuario, Cotizacion $cotizacion): bool
    {
        return $usuario->esSupervisor()
            || $cotizacion->asesor_id === null
            || $cotizacion->asesor_id === $usuario->id;
    }

    public function update(User $usuario, Cotizacion $cotizacion): bool
    {
        return $usuario->esSupervisor() || $cotizacion->asesor_id === $usuario->id;
    }

    public function tomar(User $usuario, Cotizacion $cotizacion): bool
    {
        return $cotizacion->asesor_id === null && $usuario->activo;
    }
}
