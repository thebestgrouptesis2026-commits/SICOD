<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cabeceras HTTP de seguridad.
 *
 * - Content-Security-Policy con nonce: solo se ejecutan los scripts que el
 *   propio servidor firmo en esta respuesta (mitiga XSS).
 * - frame-ancestors / X-Frame-Options: nadie puede incrustar SICOD en un
 *   iframe para engañar al usuario (clickjacking).
 * - HSTS en produccion: el navegador solo vuelve a entrar por HTTPS.
 */
class CabecerasSeguridad
{
    public function handle(Request $request, Closure $next): Response
    {
        Vite::useCspNonce();
        $nonce = Vite::cspNonce();

        $response = $next($request);

        // El servidor de desarrollo de Vite sirve los scripts desde otro
        // puerto y usa WebSocket para recargar; solo se permite en local.
        $dev = app()->environment('local') && file_exists(public_path('hot'));
        $origenVite = $dev ? trim((string) @file_get_contents(public_path('hot'))) : '';
        $wsVite = $dev ? preg_replace('#^http#', 'ws', $origenVite) : '';

        $csp = implode('; ', array_filter([
            "default-src 'self'",
            "script-src 'self' 'nonce-{$nonce}' {$origenVite}",
            "style-src 'self' 'unsafe-inline' {$origenVite}",
            "img-src 'self' data: blob:",
            "font-src 'self' data: {$origenVite}",
            "connect-src 'self' {$origenVite} {$wsVite}",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            app()->environment('production') ? 'upgrade-insecure-requests' : null,
        ]));

        $response->headers->set('Content-Security-Policy', preg_replace('/\s+/', ' ', $csp));
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $response->headers->remove('X-Powered-By');

        if ($request->isSecure() && app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Las pantallas del panel muestran datos personales: que el navegador
        // no las guarde en cache (por ejemplo, en una PC compartida).
        if ($request->user()) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        return $response;
    }
}
