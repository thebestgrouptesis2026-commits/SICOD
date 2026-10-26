# SICOD

**Sistema Inteligente de Cotización y Disponibilidad**
Inmobiliaria Constructora Taipe S.A.C. · 2026

Sistema web de gestión de disponibilidad y cotizaciones. Es el estímulo **X** del diseño preexperimental `G: O1 – X – O2` de la tesis *Desarrollo e implementación de un sistema web de gestión de disponibilidad y cotizaciones para la eficiencia del proceso comercial de una empresa inmobiliaria constructora Taipe, 2026*.

---

## Qué hace

El cliente entra a la web, ve el plano de la lotización con la disponibilidad real, elige un lote y ve su cuota al instante, en **dólares o en soles**. Ingresa su DNI y obtiene su proforma en PDF con un enlace privado. Desde la misma pantalla agenda su visita.

Mientras tanto, el sistema cronometra la atención de punta a punta y guarda los tres indicadores del estudio sin que nadie los digite.

## Reglas comerciales

| Regla | Valor | Dónde se cambia |
|---|---|---|
| Lote interior | US$ 320.00 por m² | Parámetros → precios del proyecto |
| Lote en esquina | US$ 330.00 por m² | Parámetros → precios del proyecto |
| Cuota inicial | Sin inicial | — |
| Plazos | 12, 108, 120 y **150 meses** (sugerido) | Parámetros → financiamiento |
| Pago al contado | 20 % de descuento | Parámetros → financiamiento |
| Tipo de cambio | S/ 3.448 por US$ (venta, 13 oct 2026) | Parámetros → tipo de cambio (manual) |

Los precios se guardan en dólares. Cada cotización congela el tipo de cambio del día en que se emitió, así una proforma antigua siempre muestra el mismo monto en soles.

## Stack

| Capa | Tecnología |
|---|---|
| Interfaz | React 19 · TypeScript · **shadcn/ui** (Radix UI) · Tailwind CSS 4 · Recharts · lucide |
| Puente | Inertia.js 3 (SPA sin API pública que mantener) |
| Aplicación | PHP 8.2+ · **Laravel 12** (MVC + capa de servicios) |
| Datos | MySQL 8 / MariaDB 10.4+ · 8 vistas SQL de indicadores |
| PDF | dompdf, generado y guardado en el servidor (carpeta privada) |
| Compilación | Vite 8 |
| Seguridad | Pruebas automáticas + escaneo con [Strix](https://github.com/usestrix/strix) ([docs/SEGURIDAD.md](docs/SEGURIDAD.md)) |
| Entorno | XAMPP · Node.js 22 · Visual Studio Code |
| Metodología | Scrum · 5 sprints ([docs/SCRUM.md](docs/SCRUM.md)) |

## Puesta en marcha

```bash
composer install
npm install
npm run build

cp .env.example .env
php artisan key:generate

# crea la base de datos "sicod" (utf8mb4_unicode_ci) en phpMyAdmin y luego:
php artisan migrate --seed

php artisan serve
```

Abre `http://localhost:8000`. Pasos detallados para Windows: [docs/INSTALACION.md](docs/INSTALACION.md).

| Rol | Correo | Contraseña inicial | Puede |
|---|---|---|---|
| Administrador | admin@taipe.pe | sicod2026 | Todo, más cuentas y bitácora de seguridad |
| Gerente | gerencia@taipe.pe | sicod2026 | Toda la cartera, indicadores, inventario y parámetros |
| Asesor | asesor1@taipe.pe | sicod2026 | Cotizar, sus leads, visitas y estado de lotes |

En el primer ingreso el sistema **obliga a cambiar la contraseña** (mínimo 10 caracteres con mayúsculas, minúsculas y números).

## Cómo mide el sistema

**T0** se sella en el servidor cuando el cliente selecciona un lote (o el asesor abre la cotización). **T1** se sella en la misma transacción en que se emite la proforma. El navegador nunca envía una duración.

| Indicador | Columna | Vista SQL |
|---|---|---|
| Tiempo promedio de generación de cotizaciones | `duracion_min` | `v_ind_tiempo` |
| Nivel de cumplimiento ≤ 30 min | `cumple_sla` | `v_ind_cumplimiento` |
| Tasa de conversión a visitas agendadas | `agendo_visita` | `v_ind_conversion` |

- **El umbral se congela por fila**: cambiar la meta después no reescribe mediciones ya tomadas.
- **Pretest y postest viven en la misma tabla** (`fase`), y salen juntos en un solo CSV.
- **Las atenciones no se borran**: no existe ruta para hacerlo.

Panel → Indicadores → **Exportar para SPSS** descarga el CSV ya codificado (incluye precio en USD, tipo de cambio y precio en PEN).

## Pruebas

```bash
composer test        # 28 pruebas: cálculo, accesos por rol, IDOR, fuerza bruta, CSV…
composer seguridad   # composer audit + solo las pruebas de seguridad
npm audit
```

## Estructura

```
sicod/
├── app/
│   ├── Http/Controllers/   Publico/ · Panel/ · Admin/ · Auth/
│   ├── Http/Middleware/    Cabeceras de seguridad, roles, cambio de contraseña
│   ├── Http/Requests/      Validación (DNI, RUC, celular, plazos)
│   ├── Policies/           Quién puede ver o editar cada cotización y visita
│   ├── Services/           Cotizador, Medición, Disponibilidad, Proforma, Moneda, Auditoría
│   └── Models/
├── database/migrations/    Esquema + vistas de indicadores
├── resources/js/
│   ├── pages/              Una página React por pantalla
│   ├── components/ui/      Componentes shadcn/ui
│   └── components/         Plano interactivo, cotizador, selector de moneda…
├── resources/views/pdf/    Plantilla de la proforma
├── routes/web.php          Cada ruta anotada con su caso de uso y su límite
├── tests/                  Unit + Feature (seguridad)
├── sql/                    Dump para phpMyAdmin
└── docs/
```

## Documentación

- [Instalación paso a paso en XAMPP](docs/INSTALACION.md)
- [Seguridad y pruebas con Strix](docs/SEGURIDAD.md)
- [Casos de uso](docs/CASOS_DE_USO.md)
- [Arquitectura, para el Capítulo II](docs/ARQUITECTURA.md)
- [Sprints de Scrum](docs/SCRUM.md)
- [Ajustes pendientes en el documento de tesis](docs/AJUSTES_TESIS.md) ← **léelo antes de sustentar**

## Datos de demostración

```bash
php artisan db:seed --class=DemoSeeder     # 48 atenciones ficticias
php artisan sicod:limpiar-demo             # bórralas antes de medir de verdad
```

## Autores

Leguia Medina, Marcelo Zacarias · Mosquera Espinoza, Jhon Walter · Mauricio Quispe, Joseph Piero
Asesor: Dr. Leonid Erich Gutiérrez Molina
Universidad Privada del Norte · Ingeniería de Sistemas Computacionales
