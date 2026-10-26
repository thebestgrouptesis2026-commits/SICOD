# Seguridad

SICOD maneja datos personales (DNI, celular, correo) y precios. Este documento explica qué se protegió, contra qué ataque y cómo comprobarlo. La revisión se hizo siguiendo las guías de vulnerabilidades de **[Strix](https://github.com/usestrix/strix)**, un agente de pruebas de penetración de código abierto, y cada punto tiene una prueba automática en `tests/Feature`.

## Mapa de ataques (guías de Strix) → defensa en SICOD

| Guía Strix | Ataque típico | Defensa en SICOD | Prueba |
|---|---|---|---|
| `idor` | Cambiar `/cotizacion/15` por `/cotizacion/16` para ver la proforma de otro | La proforma pública solo se abre con un enlace aleatorio de 40 caracteres (`token_publico`). El id y el código COT no sirven. En el panel, `CotizacionPolicy` impide que un asesor abra los leads de otro | `test_no_se_puede_adivinar_una_proforma…`, `test_un_asesor_no_ve_la_cotizacion_de_otro_asesor` |
| `information_disclosure` | Descargar PDFs de una carpeta pública; ver datos en la proforma compartida | PDFs en `storage/app/private`, servidos solo tras validar el enlace. DNI y celular enmascarados (`•••••912`). Errores sin traza en producción | `test_el_pdf_no_queda_en_la_carpeta_publica`, `test_los_datos_del_cliente_se_muestran_enmascarados` |
| `broken_function_level_authorization` | Un asesor entra a `/admin/usuarios` escribiendo la URL | Middleware `rol:` en cada grupo de rutas; el menú solo es cosmético | `test_el_asesor_no_entra_a_paginas…`, `test_el_gerente_no_administra_cuentas` |
| `authentication_jwt` / `weak_password_detection` | Fuerza bruta, contraseñas débiles | Bloqueo de 15 min tras 5 intentos por correo+IP; mismo mensaje exista o no el correo; contraseña mínima de 10 con mayúsculas, minúsculas y números (en producción, además se rechazan contraseñas filtradas); cambio obligatorio de la contraseña inicial | `test_fuerza_bruta_bloquea_la_cuenta`, `test_el_error_de_ingreso_no_revela…`, `test_la_contrasena_inicial_debe_cambiarse` |
| `mass_assignment` | Enviar `rol=admin` o `precio_final=1` en el formulario | `rol` y `activo` no son asignables; el precio lo calcula siempre el servidor | `test_nadie_puede_auto_asignarse…`, `test_el_cliente_no_puede_imponer_su_precio` |
| `business_logic` | Cotizar un lote vendido, plazo de 999 meses, cerrar la atención de otro cliente | Validación de estado y plazo máximo; el token de atención solo sirve en la sesión del navegador que lo abrió | `test_no_se_cotiza_un_lote_vendido`, `test_el_plazo_no_puede_superar_el_maximo`, `test_no_se_puede_cerrar_la_atencion_de_otra_persona` |
| `race_conditions` | Dos clientes separan el mismo lote en el mismo segundo | Transacción con `lockForUpdate()` sobre el lote; código correlativo con reintento | (diseño) |
| `csrf` | Un sitio externo envía formularios en nombre del asesor | Token CSRF de Laravel en toda petición POST/PUT/PATCH/DELETE (Inertia lo envía solo); cookies `SameSite=Lax` | E2E: petición sin token → 419 |
| `xss` | Inyectar `<script>` en el nombre del cliente | React escapa toda salida; no se usa `dangerouslySetInnerHTML`; CSP con `nonce` bloquea scripts ajenos | `test_cabeceras_de_seguridad` |
| `sql_injection` | `' OR '1'='1` en filtros o en el enlace | Eloquent con consultas preparadas; el enlace se valida con `^[A-Za-z0-9]{40}$` antes de tocar la base | `test_no_se_puede_adivinar…` |
| `open_redirect` | `?redirect=https://sitio-falso` tras el login | No se acepta ninguna URL de retorno externa | (diseño) |
| `browser_security` | Clickjacking, sniffing | `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS en producción | `test_cabeceras_de_seguridad` |
| CSV injection | Un nombre `=HYPERLINK(...)` se ejecuta al abrir el CSV en Excel | `celdaSegura()` antepone `'` a celdas que empiezan con `= + - @` | `test_el_csv_neutraliza_formulas_de_excel` |
| Abuso / DoS | Bots que generan miles de proformas | Límites por minuto: login 5, cotizador 30, simulador 90, emisión 6 (y 60 al día), público 60, panel 240 | E2E |

## Trazabilidad

La **bitácora de seguridad** (Administración → Seguridad) registra con usuario, IP y hora: ingresos, intentos fallidos, bloqueos, cambios de contraseña, altas y bajas de cuentas, cambios de rol, de parámetros, de precios y de estado de lotes. Muestra una alerta si hubo intentos sospechosos en las últimas 24 horas. Al desactivar una cuenta o cambiarle el rol se cierran sus sesiones abiertas.

## Cómo probar

```bash
composer test          # todas las pruebas
composer seguridad     # composer audit + pruebas de seguridad
npm audit              # dependencias de la interfaz
```

### Escaneo con Strix

Strix ataca el sistema como lo haría una persona, con un agente de IA dentro de un contenedor Docker, y entrega un informe con pruebas de concepto. Necesita **Docker** encendido y una clave de un proveedor de IA (Anthropic, OpenAI, etc.).

```bash
curl -sSL https://strix.ai/install | bash      # en Windows: usar WSL
export STRIX_LLM="anthropic/claude-sonnet-5-5"
export LLM_API_KEY="tu-clave"

# Revisión del código fuente
strix --target ./

# Prueba sobre el sistema en marcha, autenticado como asesor
strix --target http://host.docker.internal:8000 \
      --instruction "Aplicación Laravel + Inertia. Prueba IDOR en /cotizacion/{token} y /panel/cotizaciones/{id}, escalamiento de asesor a /admin, y lógica de precios. Credenciales asesor: asesor1@taipe.pe / <contraseña actual>"
```

Los resultados quedan en `strix_runs/`. **Ejecútalo solo contra tu propia instalación**, nunca contra un servidor de terceros.

En GitHub, el flujo `.github/workflows/seguridad.yml` corre las pruebas y `composer audit` / `npm audit` en cada cambio, y Strix en modo rápido si configuras los secretos `STRIX_LLM` y `LLM_API_KEY`.

## Antes de publicar

1. `.env`: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://…`, `SESSION_SECURE_COOKIE=true`.
2. Sitio solo por **HTTPS** (el sistema fuerza `https` y envía HSTS en producción).
3. `DocumentRoot` apuntando a `public/`.
4. Usuario de MySQL propio, con contraseña y permisos solo sobre la base `sicod` (no `root`).
5. Cambiar las contraseñas iniciales (el sistema lo obliga) y el WhatsApp de ventas en Parámetros.
6. Si hay proxy o Cloudflare delante, definir `TRUSTED_PROXIES` para que la bitácora vea la IP real.
7. `php artisan config:cache && php artisan route:cache`.
8. Copia de seguridad diaria de la base y de `storage/app/private`.
9. Correr `composer seguridad` y un escaneo de Strix antes de cada versión.

Ningún sistema es invulnerable; estas medidas cubren los ataques más comunes en aplicaciones web (OWASP Top 10) y dejan rastro de cualquier intento.
