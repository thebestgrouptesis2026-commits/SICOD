<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Visita;

class VisitaPolicy
{
    public function update(User $usuario, Visita $visita): bool
    {
        return $usuario->esSupervisor() || $visita->asesor_id === $usuario->id;
    }
}
