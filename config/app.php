<?php

return [
    'name' => env('APP_NAME', 'SICOD'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'timezone' => env('APP_TIMEZONE', 'America/Lima'),
    'locale' => env('APP_LOCALE', 'es'),
    'fallback_locale' => 'es',
    'faker_locale' => 'es_PE',
    'cipher' => 'AES-256-CBC',
    'key' => env('APP_KEY'),
    'previous_keys' => [],
    'maintenance' => ['driver' => 'file'],
];
