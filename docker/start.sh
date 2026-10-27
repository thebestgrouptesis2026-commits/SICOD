#!/bin/sh
# Arranque del contenedor: prepara Laravel, aplica migraciones y sirve la app.
set -e

php artisan config:cache
php artisan route:cache
php artisan view:cache

# Railway arranca la app en paralelo con la base de datos: se reintenta
# unos segundos hasta que MySQL acepte conexiones.
intentos=0
until php artisan migrate --force; do
    intentos=$((intentos + 1))
    if [ "$intentos" -ge 10 ]; then
        echo "La base de datos no respondió tras 10 intentos." >&2
        exit 1
    fi
    sleep 3
done

php artisan sicod:instalar

# Tareas programadas (liberar reservas vencidas, depurar bitácora).
php artisan schedule:work &

exec frankenphp php-server --root public/ --listen ":${PORT:-8080}"
