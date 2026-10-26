# Instalación en XAMPP (Windows)

Tiempo estimado: 25 minutos.

## 1. Requisitos

| Programa | Versión | Dónde |
|---|---|---|
| XAMPP | con **PHP 8.2 o superior** | apachefriends.org |
| Composer | 2.x | getcomposer.org |
| Node.js | **22 LTS** o superior | nodejs.org |
| Visual Studio Code | cualquiera | code.visualstudio.com |

Comprueba las versiones:

```
C:\xampp\php\php -v
node -v
```

Si PHP muestra 8.1 o menos, instala un XAMPP más reciente: Laravel 12 no arranca con PHP 8.1.

## 2. Extensiones de PHP

Abre `C:\xampp\php\php.ini` y quita el punto y coma inicial de estas líneas:

```ini
extension=pdo_mysql
extension=mbstring
extension=openssl
extension=fileinfo
extension=gd
extension=intl
extension=zip
```

Sube también `memory_limit = 256M`. Guarda y reinicia Apache.

## 3. Copiar el proyecto

Descomprime la carpeta en `C:\xampp\htdocs\sicod\`.

## 4. Instalar dependencias

En la terminal de VS Code, dentro de la carpeta del proyecto:

```bash
composer install
npm install
npm run build
```

`npm run build` compila la interfaz React a `public/build`. El zip ya trae esa carpeta compilada, así que si solo vas a usar el sistema (sin cambiar pantallas) puedes saltarte `npm install` y `npm run build`.

## 5. Configurar el entorno

```bash
copy .env.example .env
php artisan key:generate
```

Con XAMPP recién instalado, la conexión en `.env` suele ser:

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sicod
DB_USERNAME=root
DB_PASSWORD=
```

No hace falta `php artisan storage:link`: las proformas se guardan en `storage/app/private` y **no** son públicas a propósito.

## 6. Crear la base de datos

Arranca **Apache** y **MySQL** en XAMPP. En `http://localhost/phpmyadmin` crea la base `sicod` con cotejamiento `utf8mb4_unicode_ci`. Luego:

```bash
php artisan migrate --seed
```

Alternativa: importar `sql/sicod_mysql.sql` en phpMyAdmin (crea tablas, vistas y datos base) y no correr las migraciones.

## 7. Arrancar

```bash
php artisan serve
```

Abre `http://localhost:8000`.

| Cuenta | Correo | Contraseña inicial |
|---|---|---|
| Administrador | admin@taipe.pe | sicod2026 |
| Gerente | gerencia@taipe.pe | sicod2026 |
| Asesor | asesor1@taipe.pe | sicod2026 |

Al primer ingreso el sistema pide una contraseña nueva. Para desactivar esto solo en tu PC de desarrollo: `SICOD_FORZAR_CAMBIO_PASSWORD=false` en `.env`.

### Mientras desarrollas pantallas

Usa dos terminales: `php artisan serve` y `npm run dev`. Vite recarga la página al guardar un archivo `.tsx`. Antes de entregar, vuelve a correr `npm run build`.

## 8. Datos de demostración (opcional)

```bash
php artisan db:seed --class=DemoSeeder
```

Genera 48 atenciones ficticias para que los indicadores no salgan vacíos. Antes de medir de verdad:

```bash
php artisan sicod:limpiar-demo
```

## 9. Tareas programadas

Las separaciones vencidas se liberan solas y la bitácora se depura cada año. En producción agrega al Programador de tareas de Windows (cada minuto):

```
C:\xampp\php\php.exe C:\xampp\htdocs\sicod\artisan schedule:run
```

## 10. Publicar con Apache

En `C:\xampp\apache\conf\extra\httpd-vhosts.conf`:

```apache
<VirtualHost *:80>
    DocumentRoot "C:/xampp/htdocs/sicod/public"
    ServerName sicod.test
    <Directory "C:/xampp/htdocs/sicod/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Agrega `127.0.0.1 sicod.test` a `C:\Windows\System32\drivers\etc\hosts` y reinicia Apache.

El `DocumentRoot` apunta a `public`, no a la raíz: así nadie puede descargar tu `.env`. Antes de abrir el sistema a internet revisa la lista de [SEGURIDAD.md](SEGURIDAD.md#antes-de-publicar).

## Problemas frecuentes

**`Unknown database 'sicod'`** — No creaste la base o el nombre no coincide con `.env`.

**`could not find driver`** — Falta `extension=pdo_mysql`. `php --ini` muestra qué `php.ini` usa realmente.

**`Vite manifest not found`** — No existe `public/build`. Ejecuta `npm run build`.

**Pantalla en blanco al usar `npm run dev`** — Abre la página por `http://localhost:8000`, no por el puerto de Vite (5173).

**`Too Many Requests` (429)** — Es la protección contra abuso. Espera un minuto o, en desarrollo, `php artisan cache:clear`.

**El PDF da error de memoria** — Sube `memory_limit` a `256M`.

**`storage/logs/laravel.log could not be opened`** — Permisos de escritura en `storage/` y `bootstrap/cache/`.
