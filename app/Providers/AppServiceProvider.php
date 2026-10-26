<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Compatibilidad con MySQL 5.7 / MariaDB antiguas de XAMPP.
        Schema::defaultStringLength(191);

        setlocale(LC_TIME, 'es_PE.UTF-8', 'es_ES.UTF-8', 'Spanish');

        // En desarrollo, Eloquent avisa de consultas N+1 y de atributos que
        // se pierden en silencio. En produccion no interrumpe al usuario.
        Model::shouldBeStrict(! $this->app->isProduction());

        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        // Politica de contrasenas. En produccion ademas se rechazan las que
        // aparecen en filtraciones conocidas (consulta anonima k-anonymity).
        Password::defaults(function () {
            $regla = Password::min(10)->letters()->mixedCase()->numbers();

            return $this->app->isProduction() ? $regla->uncompromised() : $regla;
        });

        $this->limitesDeUso();
    }

    /**
     * Limites de peticiones. Frenan la fuerza bruta en el login y que un
     * bot llene la tabla de atenciones con mediciones falsas.
     */
    private function limitesDeUso(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $email = mb_strtolower((string) $request->input('email'));

            return [
                Limit::perMinute((int) config('sicod.login_intentos', 5))->by($email.'|'.$request->ip()),
                Limit::perMinute(20)->by('ip:'.$request->ip()),
            ];
        });

        RateLimiter::for('cotizador', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));

        RateLimiter::for('simulador', fn (Request $request) => Limit::perMinute(90)->by($request->ip()));

        RateLimiter::for('emision', fn (Request $request) => [
            Limit::perMinute(6)->by($request->ip()),
            Limit::perDay(60)->by($request->ip()),
        ]);

        RateLimiter::for('publico', fn (Request $request) => Limit::perMinute(60)->by($request->ip()));

        RateLimiter::for('panel', fn (Request $request) => Limit::perMinute(240)->by($request->user()?->id ?: $request->ip()));
    }
}
