<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Services\AuditoriaService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * CU-05: Iniciar sesion.
 *
 * Tras varios intentos fallidos con el mismo correo desde la misma IP, la
 * cuenta queda bloqueada temporalmente (proteccion contra fuerza bruta).
 * El mensaje de error es el mismo exista o no la cuenta, para no revelar
 * que correos estan registrados.
 */
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:180'],
            'password' => ['required', 'string', 'max:200'],
            'recordarme' => ['boolean'],
        ];
    }

    public function authenticate(): User
    {
        $this->ensureIsNotRateLimited();

        $credenciales = [
            'email' => mb_strtolower($this->string('email')->trim()->toString()),
            'password' => $this->string('password')->toString(),
            'activo' => true,
        ];

        if (! Auth::attempt($credenciales, $this->boolean('recordarme'))) {
            RateLimiter::hit($this->throttleKey(), 15 * 60);

            app(AuditoriaService::class)->registrar(
                'login.fallido',
                'Intento de ingreso fallido para '.$credenciales['email'],
                datos: ['email' => $credenciales['email']],
            );

            throw ValidationException::withMessages([
                'email' => 'El correo o la contraseña no son correctos.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());

        return Auth::user();
    }

    public function ensureIsNotRateLimited(): void
    {
        $maximo = (int) config('sicod.login_intentos', 5);

        if (! RateLimiter::tooManyAttempts($this->throttleKey(), $maximo)) {
            return;
        }

        event(new Lockout($this));

        $segundos = RateLimiter::availableIn($this->throttleKey());

        app(AuditoriaService::class)->registrar(
            'login.bloqueado',
            'Ingreso bloqueado por intentos repetidos: '.$this->string('email'),
            datos: ['email' => (string) $this->string('email'), 'segundos' => $segundos],
        );

        throw ValidationException::withMessages([
            'email' => 'Demasiados intentos. Vuelve a intentarlo en '.ceil($segundos / 60).' minutos.',
        ]);
    }

    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
