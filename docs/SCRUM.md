# Desarrollo con Scrum

Evidencia para el capítulo de desarrollo de la tesis.

## Equipo y roles

| Rol | Persona |
|---|---|
| Product Owner | Representante de Inmobiliaria Constructora Taipe S.A.C. |
| Scrum Master | Mosquera Espinoza, Jhon Walter |
| Equipo de desarrollo | Leguia Medina, Marcelo Zacarias · Mauricio Quispe, Joseph Piero |

Sprints de dos semanas. Daily de 15 minutos. Revisión y retrospectiva al cierre de cada sprint. Tablero en Trello con las columnas *Backlog · Sprint · En curso · Revisión · Hecho*.

## Product backlog

| # | Historia de usuario | Puntos | Sprint |
|---|---|---|---|
| HU-01 | Como cliente quiero ver el plano con la disponibilidad real para saber qué lotes puedo comprar | 8 | 1 |
| HU-02 | Como cliente quiero filtrar los lotes por estado para no perder tiempo en los vendidos | 3 | 1 |
| HU-03 | Como administrador quiero registrar proyectos, manzanas y lotes para tener el catálogo al día | 5 | 1 |
| HU-04 | Como cliente quiero ver mi cuota mensual al elegir un plazo para decidir si me alcanza | 8 | 2 |
| HU-05 | Como cliente quiero descargar mi proforma en PDF para revisarla con calma | 8 | 2 |
| HU-06 | Como cliente quiero que se valide mi DNI para no cometer errores al escribirlo | 3 | 2 |
| HU-07 | Como asesor quiero iniciar sesión para acceder a mis leads | 3 | 3 |
| HU-08 | Como asesor quiero ver la bandeja de cotizaciones para dar seguimiento | 5 | 3 |
| HU-09 | Como asesor quiero cotizar por el cliente cuando me escribe por WhatsApp | 5 | 3 |
| HU-10 | Como cliente quiero agendar mi visita al proyecto desde la misma pantalla | 5 | 3 |
| HU-11 | Como asesor quiero enviar la proforma por WhatsApp sin salir del sistema | 3 | 3 |
| HU-12 | Como gerente quiero ver el tiempo promedio de cotización para saber si mejoramos | 8 | 4 |
| HU-13 | Como gerente quiero exportar los datos para analizarlos en SPSS | 5 | 4 |
| HU-14 | Como administrador quiero cambiar los plazos y el umbral sin tocar el código | 3 | 4 |
| HU-15 | Como administrador quiero gestionar las cuentas de los asesores | 3 | 4 |
| HU-16 | Como investigador quiero cargar los datos del pretest en el sistema para compararlos con el postest | 5 | 5 |
| HU-17 | Como equipo quiero que dos clientes no puedan cotizar el mismo lote a la vez | 5 | 5 |
| HU-18 | Como equipo quiero que cada cambio de estado quede registrado con autor y motivo | 3 | 5 |

Total: **88 puntos de historia**.

## Sprints

### Sprint 1 · Catálogo y plano
**Objetivo:** que un visitante pueda ver la disponibilidad real sin registrarse.
Historias: HU-01, HU-02, HU-03 (16 puntos).
Entregables: modelo de datos de proyectos, manzanas y lotes; migraciones y seeders; plano SVG interactivo con filtros; CRUD de lotes.
**Incremento demostrable:** el plano carga desde la base de datos y refleja los estados reales.

### Sprint 2 · Motor de cotización
**Objetivo:** que el cliente obtenga su proforma solo.
Historias: HU-04, HU-05, HU-06 (19 puntos).
Entregables: `CotizadorService` con cálculo francés y sin interés; simulación por AJAX; generación de PDF con dompdf; validación de documento de identidad.
**Incremento demostrable:** flujo completo de plano → cuota → PDF en menos de cinco minutos.
**Retrospectiva:** se decidió mover el cálculo al servidor tras detectar que una versión previa en JavaScript podía mostrar una cifra distinta a la impresa.

### Sprint 3 · Panel comercial
**Objetivo:** dar al asesor herramientas para no perder leads.
Historias: HU-07, HU-08, HU-09, HU-10, HU-11 (21 puntos).
Entregables: autenticación y roles; bandeja de cotizaciones; cotización asistida; agendamiento de visitas; enlace de WhatsApp.
**Incremento demostrable:** el asesor atiende un lead de WhatsApp de principio a fin dentro del sistema.

### Sprint 4 · Métricas
**Objetivo:** que la gerencia vea si el proceso mejoró.
Historias: HU-12, HU-13, HU-14, HU-15 (19 puntos).
Entregables: vistas SQL de indicadores; panel de indicadores con Recharts; exportación CSV para SPSS; configuración de parámetros; gestión de cuentas.
**Incremento demostrable:** tabla comparativa pretest/postest con los tres indicadores.

### Sprint 5 · Integridad de la medición
**Objetivo:** que los datos del estudio resistan la revisión del jurado.
Historias: HU-16, HU-17, HU-18 (13 puntos).
Entregables: carga del pretest; bloqueo de fila en la emisión; historial de cambios de estado; congelamiento del SLA por atención.
**Incremento demostrable:** dos sesiones simultáneas intentando el mismo lote; solo una obtiene la proforma.
**Retrospectiva:** se añadió `sla_minutos` a nivel de fila al notar que cambiar el parámetro global recalculaba mediciones ya tomadas.

## Definición de terminado

Una historia está terminada cuando el código pasa `php -l` sin errores, la funcionalidad se demuestra en el navegador, las validaciones rechazan la entrada inválida con un mensaje comprensible, la interfaz funciona en móvil y el Product Owner la acepta en la revisión de sprint.

## Evidencia sugerida para el anexo

Capturas del tablero de Trello al inicio y al cierre de cada sprint, el burndown chart de los 88 puntos, las actas de revisión firmadas por el Product Owner y las capturas del sistema funcionando en cada incremento.
