<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="{{ request()->is('panel*', 'admin*', 'cotizacion/*', 'ingresar') ? 'noindex, nofollow' : 'index, follow' }}">
        <meta name="theme-color" content="#1c5a44">
        <title inertia>{{ config('app.name', 'SICOD') }}</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">

        {{-- Evita el parpadeo: aplica el tema oscuro antes de pintar. --}}
        <script nonce="{{ Vite::cspNonce() }}">
            (function () {
                try {
                    var t = localStorage.getItem('sicod-tema') || 'sistema';
                    var oscuro = t === 'oscuro' || (t === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    document.documentElement.classList.toggle('dark', oscuro);
                } catch (e) {}
            })();
        </script>

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
