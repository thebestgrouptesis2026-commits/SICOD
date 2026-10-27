# Despliegue en Railway

Publica SICOD con un enlace permanente (`https://<nombre>.up.railway.app`) que no depende de tu computadora.

Tiempo estimado: 15 minutos.

## Costo

| Plan | Precio | Para qué sirve |
|---|---|---|
| Trial | US$ 5 de crédito, una sola vez | Probar el despliegue y la sustentación de prueba |
| Hobby | US$ 5 al mes (incluye US$ 5 de uso) | Mantener el sistema en línea de forma permanente |

SICOD (app + MySQL) consume poco: con tráfico de demostración suele caber en los US$ 5 incluidos. Revisa los precios vigentes en [railway.com/pricing](https://railway.com/pricing).

## Qué trae el repositorio

| Archivo | Para qué |
|---|---|
| `Dockerfile` | Compila la interfaz, instala dependencias sin las de desarrollo y sirve con FrankenPHP (atiende varias peticiones a la vez). |
| `docker/start.sh` | En cada arranque: cachea configuración, aplica migraciones, siembra los datos base solo si la base está vacía, arranca las tareas programadas y el servidor. |
| `railway.json` | Le dice a Railway que use el `Dockerfile` y que verifique la salud en `/up`. |

Las proformas en PDF se guardan dentro del contenedor y se borran en cada despliegue. No se pierde nada: el sistema las vuelve a generar al descargarlas.

## Pasos

### 1. Crear el proyecto

1. Entra a [railway.com](https://railway.com) e inicia sesión con tu cuenta de GitHub.
2. **New Project → Deploy from GitHub repo** y elige el repositorio `SICOD`. Si no aparece, pulsa **Configure GitHub App** y dale acceso.
3. El primer despliegue fallará porque aún no hay base de datos. Es normal.

### 2. Agregar MySQL

En el mismo proyecto: **Create → Database → MySQL**. Railway crea el servicio `MySQL` con sus credenciales.

### 3. Variables de la aplicación

Abre el servicio de SICOD → **Variables → Raw Editor** y pega esto:

```ini
APP_NAME=SICOD
APP_ENV=production
APP_DEBUG=false
APP_KEY=
APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
APP_TIMEZONE=America/Lima
APP_LOCALE=es

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
CACHE_STORE=database
QUEUE_CONNECTION=database
LOG_CHANNEL=stderr
LOG_LEVEL=warning

TRUSTED_PROXIES=*
SICOD_SLA_MINUTOS=30
SICOD_FORZAR_CAMBIO_PASSWORD=true
SICOD_PASSWORD_INICIAL=
```

Completa dos valores antes de guardar:

- **`APP_KEY`**: genera uno en tu PC con `php artisan key:generate --show` y pega el resultado (empieza con `base64:`).
- **`SICOD_PASSWORD_INICIAL`**: una contraseña propia de al menos 10 caracteres, con mayúsculas, minúsculas y números. Será la contraseña inicial de las tres cuentas. Si la dejas vacía, el despliegue se detiene a propósito: la de por defecto (`sicod2026`) está publicada en el README.

`TRUSTED_PROXIES=*` es seguro aquí: en Railway la app solo recibe tráfico a través de su proxy.

### 4. Dominio público

Servicio de SICOD → **Settings → Networking → Generate Domain**. Si pregunta por el puerto, indica **8080**.

### 5. Desplegar

Pulsa **Deploy** (o espera: Railway redespliega solo al guardar variables). En **Deployments → View logs** deberías ver, en orden:

1. Las migraciones (`create_users_table … DONE`).
2. `Datos base cargados` (solo la primera vez).
3. `Caddy serving PHP app on :8080`.

Abre el dominio generado. Ingresa con `admin@taipe.pe` y la contraseña de `SICOD_PASSWORD_INICIAL`; el sistema pedirá cambiarla. Haz lo mismo con `gerencia@taipe.pe` y `asesor1@taipe.pe`.

### 6. (Opcional) Datos de demostración

Para que los indicadores no salgan vacíos en la sustentación, desde tu PC con la [CLI de Railway](https://docs.railway.com/guides/cli):

```bash
npm install -g @railway/cli
railway login
railway link          # elige el proyecto y el servicio SICOD
railway ssh           # abre una terminal dentro del contenedor
```

Dentro del contenedor:

```bash
php artisan db:seed --class=DemoSeeder --force
```

Antes de medir de verdad, también dentro del contenedor: `php artisan sicod:limpiar-demo`.

También puedes hacerlo desde el panel web: servicio SICOD → los tres puntos del despliegue activo → **SSH** (si tu plan lo muestra).

## Actualizaciones

Cada `git push` a `main` redespliega solo. Las migraciones nuevas se aplican al arrancar; los datos existentes no se tocan.

## Problemas frecuentes

**El despliegue queda en "Healthcheck failed"** — Revisa los logs. Casi siempre es una variable `DB_*` mal escrita, falta `APP_KEY` o falta `SICOD_PASSWORD_INICIAL` (el log lo dice: "Define SICOD_PASSWORD_INICIAL").

**La página carga sin estilos** — Falta `TRUSTED_PROXIES=*` o `APP_URL` no empieza con `https://`.

**`419 Page Expired` al iniciar sesión** — `SESSION_SECURE_COOKIE=true` exige HTTPS: entra por el dominio `https://…up.railway.app`, no por otra dirección.

**No puedo cambiar la contraseña: "aparece en filtraciones"** — En producción el sistema rechaza contraseñas filtradas en internet (consulta anónima a Have I Been Pwned). Elige otra.
