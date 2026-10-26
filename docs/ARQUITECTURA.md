# Arquitectura

Material de apoyo para el Capítulo II de la tesis.

## Patrón general

SICOD sigue **arquitectura en tres capas** sobre el patrón **Modelo-Vista-Controlador** que impone Laravel, con una cuarta división interna: una capa de servicios donde vive la lógica de negocio.

```
┌──────────────────────────────────────────────────────────┐
│  PRESENTACIÓN                                            │
│  React 19 · TypeScript · shadcn/ui · Tailwind · Recharts │
│  Navegador del cliente y del asesor                      │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP + Inertia.js (rutas en routes/web.php)
┌────────────────────────▼─────────────────────────────────┐
│  APLICACIÓN                                              │
│                                                          │
│  Controladores   reciben la petición, orquestan          │
│  Form Requests   validan la entrada (DNI, plazos…)       │
│  Middleware      roles, cabeceras de seguridad           │
│  Policies        quién ve o edita cada cotización        │
│  ───────────────────────────────────────────────         │
│  Servicios       reglas de negocio                       │
│    CotizadorService      cálculo financiero              │
│    MedicionService       cronómetro del estudio          │
│    DisponibilidadService estados de lote y reservas      │
│    ProformaService       PDF privado                     │
│    MonedaService         dólares ↔ soles                 │
│    AuditoriaService      bitácora de seguridad           │
└────────────────────────┬─────────────────────────────────┘
                         │ Eloquent ORM
┌────────────────────────▼─────────────────────────────────┐
│  DATOS                                                   │
│  MySQL 8 / MariaDB · InnoDB · utf8mb4                    │
│  15 tablas · 8 vistas de indicadores                     │
└──────────────────────────────────────────────────────────┘
```

## Por qué React con Inertia

La interfaz es una aplicación React (componentes **shadcn/ui** sobre Radix UI, accesibles por teclado y lector de pantalla), pero las rutas, la validación y los permisos siguen en Laravel. **Inertia.js** une ambos lados: cada controlador devuelve `Inertia::render('pagina', datos)` y React dibuja esa página sin recargar el navegador. No hay una API REST pública que proteger por separado, y el MVC de Laravel queda intacto para el Capítulo II: el controlador entrega datos, la vista (ahora un componente `.tsx`) los presenta.

## Moneda

Los precios se almacenan en dólares (`proyectos.precio_m2_interior`, `precio_m2_esquina`). `MonedaService` convierte a soles con el tipo de cambio que registra el administrador. Cada cotización guarda `tipo_cambio` al emitirse, así el monto en soles de una proforma no cambia aunque el dólar se mueva después. El selector US$ / S/ de la interfaz solo cambia la presentación.

## Por qué una capa de servicios

Un controlador de Laravel puede hacerlo todo: validar, calcular, guardar y responder. En un sistema que además es instrumento de medición, eso trae un problema concreto.

El cálculo de la cuota mensual aparece en tres lugares: la simulación en vivo del cliente (CU-02), la emisión de la proforma (CU-03) y la cotización asistida del asesor (CU-07). Si cada uno lo calculara por su cuenta, tarde o temprano el número que ve el cliente en pantalla dejaría de coincidir con el que sale impreso en el PDF. Al concentrarlo en `CotizadorService::calcular()`, los tres consumen la misma función y la coincidencia está garantizada por construcción, no por disciplina.

Lo mismo ocurre con la medición. `MedicionService` es el único que escribe `inicio_at` y `fin_at`. Ningún controlador puede inventar una duración, porque no existe la ruta para hacerlo.

## Decisiones de diseño y su justificación

**El cálculo financiero corre en el servidor, no en el navegador.**
El plano de React pide la simulación al servidor en lugar de calcularla localmente. Es una llamada de red extra, pero garantiza que el precio mostrado, el almacenado y el impreso sean el mismo número. También impide que alguien manipule el cálculo desde la consola del navegador.

**El PDF se genera y almacena en el servidor.**
Con dompdf, no con una librería de cliente. El flujo TO-BE exige que el sistema *genere y almacene* la proforma: un PDF armado en el navegador desaparece si el cliente cierra la pestaña, y el asesor no podría reenviarlo después por WhatsApp (CU-09).

**Las transacciones bloquean la fila del lote.**
`CotizadorController::emitir()` abre una transacción y ejecuta `lockForUpdate()` sobre el lote antes de verificar su estado. Sin eso, dos clientes que pulsan *Generar proforma* en el mismo segundo podrían recibir ambos una proforma del mismo lote. Con el bloqueo, el segundo recibe un mensaje claro y vuelve al plano.

**Todo cambio de estado de un lote pasa por `DisponibilidadService`.**
No hay ningún `$lote->update(['estado' => ...])` suelto en los controladores. El servicio escribe siempre una fila en `lote_historial` con autor, motivo, IP y hora. Esto sostiene la dimensión *Seguridad · Integridad* de la matriz de operacionalización: la trazabilidad no depende de que el programador se acuerde de registrarla.

**El umbral de cumplimiento se congela en cada atención.**
La columna `atenciones.sla_minutos` guarda el valor vigente en el momento de la medición. Si durante el postest alguien cambia el parámetro global, las mediciones anteriores no se recalculan. Sin esto, un cambio de configuración podría alterar retroactivamente los resultados del estudio.

**Los indicadores se calculan en vistas SQL, no en PHP.**
`v_ind_tiempo`, `v_ind_cumplimiento` y `v_ind_conversion` viven en la base de datos. Cualquier miembro del jurado puede conectarse a MySQL y reproducir las cifras del Capítulo III sin leer el código de la aplicación. La verificabilidad es parte del diseño.

## Modelo de datos

```
proyectos ──< manzanas ──< lotes ──< lote_historial
                             │
                             ├──< cotizaciones >── clientes
                             │         │
                             │         └──< visitas
                             └──< reservas

atenciones ──< cotizaciones          atenciones ──< visitas
     │
     └── users (asesor)
```

**15 tablas.** Siete de negocio (`proyectos`, `manzanas`, `lotes`, `clientes`, `atenciones`, `cotizaciones`, `visitas`), cuatro de apoyo (`lote_historial`, `reservas`, `parametros`, `auditoria`) y cuatro de infraestructura de Laravel (`users`, `sessions`, `cache`, `jobs`).

**`atenciones` es la tabla central del estudio.** Cada fila es una unidad de análisis de la ficha de registro de tiempos. Convive el pretest (`origen = 'manual'`, transcrito de la observación) con el postest (`origen = 'sistema'`, cronometrado automáticamente), lo que permite exportar ambas fases en un solo archivo comparable.

## Seguridad

| Amenaza | Medida |
|---|---|
| Acceso a proformas ajenas (IDOR) | Enlace aleatorio de 40 caracteres; PDF en carpeta privada; `CotizacionPolicy` en el panel |
| Inyección SQL | Eloquent ORM con sentencias preparadas |
| XSS | React escapa toda salida; Content-Security-Policy con nonce |
| CSRF | Token obligatorio en toda petición que modifica datos |
| Fuerza bruta | Bloqueo de 15 min tras 5 intentos; límites de peticiones por ruta |
| Contraseñas | Bcrypt; mínimo 10 caracteres; cambio obligatorio de la inicial |
| Acceso indebido | Middleware `VerificarRol` en cada grupo de rutas |
| Trazabilidad | `lote_historial` y `auditoria` con usuario, IP y hora |
| Datos personales | Consentimiento explícito (`consentimiento_at`, Ley 29733); DNI y celular enmascarados en la proforma pública |

El detalle, con el mapa contra las guías de Strix y las pruebas automáticas, está en [SEGURIDAD.md](SEGURIDAD.md).

## Escalabilidad

El sistema está dimensionado para una etapa de proyecto: decenas de lotes y cientos de atenciones al mes. Con esos volúmenes, MySQL sobre XAMPP responde de sobra.

Si la empresa crece a varios proyectos simultáneos con miles de lotes, los puntos a revisar serían la generación del plano (hoy se dibuja completo en el navegador; convendría paginar por manzana) y las vistas de indicadores (convendría materializarlas). Ninguno de los dos afecta el alcance de esta tesis.
