<?php

namespace App\Http\Requests;

use App\Http\Controllers\Publico\CotizadorController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegistroPretestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->esSupervisor() ?? false;
    }

    public function rules(): array
    {
        return [
            'cliente_id' => ['nullable', 'integer', 'exists:clientes,id'],
            'asesor_id' => ['nullable', 'integer', 'exists:users,id'],
            'proyecto_id' => ['nullable', 'integer', 'exists:proyectos,id'],
            'canal' => ['required', Rule::in(CotizadorController::CANALES)],
            'inicio_at' => ['required', 'date'],
            'fin_at' => ['required', 'date', 'after_or_equal:inicio_at'],
            'genero_cotizacion' => ['boolean'],
            'agendo_visita' => ['boolean'],
            'observacion' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'fin_at.after_or_equal' => 'La hora de termino debe ser posterior a la de inicio.',
        ];
    }
}
