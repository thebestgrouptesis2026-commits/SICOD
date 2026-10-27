# Imagen de produccion de SICOD (Railway, Render, Fly.io o cualquier host
# con Docker). Tres etapas: interfaz compilada, dependencias PHP y la imagen
# final con FrankenPHP, que atiende varias peticiones a la vez (a diferencia
# de `php artisan serve`).

# --- 1. Interfaz React ------------------------------------------------------
FROM node:22-alpine AS interfaz
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY vite.config.ts tsconfig.json components.json ./
COPY resources ./resources
RUN npm run build

# --- 2. Dependencias PHP ----------------------------------------------------
FROM composer:2 AS dependencias
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --ignore-platform-reqs

# --- 3. Imagen final --------------------------------------------------------
FROM dunglas/frankenphp:1-php8.3

# gd: dompdf (proformas) · intl: fechas en español · pdo_mysql: base de datos
RUN install-php-extensions pdo_mysql gd intl zip opcache bcmath \
    && cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && printf "memory_limit=256M\nexpose_php=Off\nopcache.validate_timestamps=0\n" > "$PHP_INI_DIR/conf.d/sicod.ini"

WORKDIR /app
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY --from=dependencias /app/vendor ./vendor
COPY . .
COPY --from=interfaz /app/public/build ./public/build

RUN composer dump-autoload --optimize --classmap-authoritative --no-dev --no-scripts \
    && php artisan package:discover --ansi \
    && mkdir -p storage/app/private/proformas storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache /data/caddy /config/caddy \
    && chmod +x docker/start.sh

USER www-data

CMD ["docker/start.sh"]
