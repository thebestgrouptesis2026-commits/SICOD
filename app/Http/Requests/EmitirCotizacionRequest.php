<?php

namespace App\Http\Requests;

use App\Http\Controllers\Publico\CotizadorController;
use App\Services\CotizadorService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmitirCotizacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normaliza antes de validar: el celular se guarda solo con digitos y
     * sin el prefijo 51; los nombres sin espacios sobrantes.
     */
    protected function prepareForValidation(): void
    {
        $telefono = preg_replace('/\D/', '', (string) $this->input('telefono'));

        if (strlen($telefono) === 11 && str_starts_with($telefono, '51')) {
            $telefono = substr($telefono, 2);
        }

        $this->merge([
            'telefono' => $telefono,
            'nombres' => trim(preg_replace('/\s+/', ' ', (string) $this->input('nombres'))),
            'apellidos' => trim(preg_replace('/\s+/', ' ', (string) $this->input('apellidos'))) ?: null,
            'numero_documento' => strtoupper(trim((string) $this->input('numero_documento'))),
            'email' => trim((string) $this->input('email')) ?: null,
        ]);
    }

    public function rules(): array
    {
        $plazoMaximo = app(CotizadorService::class)->plazoMaximo();

        return [
            'atencion_token' => ['required', 'string', 'uuid'],
            'lote_id' => ['required', 'integer', 'exists:lotes,id'],
            'nombres' => ['required', 'string', 'min:2', 'max:120', "regex:/^[\\pL\\s'.-]+$/u"],
            'apellidos' => ['required', 'string', 'min:2', 'max:120', "regex:/^[\\pL\\s'.-]+$/u"],
            'tipo_documento' => ['required', Rule::in(['DNI', 'CE', 'PAS', 'RUC'])],
            'numero_documento' => ['required', 'string', 'max:20', $this->reglaDocumento()],
            'telefono' => ['required', 'regex:/^9[0-9]{8}$/'],
            'email' => ['nullable', 'email:rfc', 'max:180'],
            'modalidad_pago' => ['required', Rule::in(['contado', 'financiado'])],
            'plazo_meses' => ['exclude_unless:modalidad_pago,financiado', 'required', 'integer', 'min:1', 'max:'.$plazoMaximo],
            'canal' => ['nullable', Rule::in(CotizadorController::CANALES)],
            'consentimiento' => ['accepted'],
        ];
    }

    /**
     * Validacion del documento de identidad (CU-03: "Valida el formato del DNI").
     */
    private function reglaDocumento(): string
    {
        return match ($this->input('tipo_documento')) {
            'DNI' => 'regex:/^[0-9]{8}$/',
            'CE' => 'regex:/^[0-9A-Z]{9,12}$/',
            'RUC' => 'regex:/^(10|15|17|20)[0-9]{9}$/',
            default => 'regex:/^[0-9A-Z]{6,20}$/',
        };
    }

    public function messages(): array
    {
        return [
            'numero_documento.regex' => match ($this->input('tipo_documento')) {
                'DNI' => 'El DNI debe tener 8 dígitos.',
                'RUC' => 'El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20.',
                default => 'El número de documento no tiene un formato válido.',
            },
            'nombres.regex' => 'Escribe el nombre solo con letras.',
            'apellidos.regex' => 'Escribe los apellidos solo con letras.',
            'apellidos.required' => 'Escribe los apellidos.',
            'telefono.regex' => 'El celular debe tener 9 dígitos y empezar con 9.',
            'atencion_token.*' => 'Selecciona nuevamente el lote en el plano para reiniciar tu cotización.',
            'consentimiento.accepted' => 'Necesitamos tu autorización para tratar tus datos y enviarte la proforma.',
            'plazo_meses.required' => 'Elige en cuántos meses quieres pagar.',
            'plazo_meses.max' => 'El plazo máximo es de :max meses.',
        ];
    }

    public function attributes(): array
    {
        return [
            'numero_documento' => 'el número de documento',
            'nombres' => 'los nombres',
            'telefono' => 'el celular',
            'email' => 'el correo',
        ];
    }
}
