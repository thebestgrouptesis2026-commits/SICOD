# Casos de uso

Mapeo entre el diagrama UML de la tesis y el código que lo implementa.

| CU | Caso de uso | Actor | Ruta | Implementación |
|---|---|---|---|---|
| CU-01 | Consultar plano interactivo | Cliente | `GET /` | `Publico\PlanoController@index` · `pages/publico/plano.tsx` · `components/plano.tsx` |
| CU-02 | Simular financiamiento (US$ / S/) | Cliente | `POST /cotizador/simular` | `Publico\CotizadorController@simular` → `CotizadorService::calcular()` |
| CU-03 | Generar y descargar PDF | Cliente | `POST /cotizador/emitir` · `GET /cotizacion/{token}/pdf` | `CotizadorController@emitir` · `CotizacionPublicaController@pdf` · `ProformaService` · `pdf/proforma.blade.php` |
| CU-04 | Agendar visita al proyecto | Cliente | `POST /cotizacion/{token}/visita` | `CotizacionPublicaController@agendarVisita` |
| CU-05 | Iniciar sesión | Asesor / Gerente / Admin | `GET,POST /ingresar` | `Auth\SesionController` · `LoginRequest` (bloqueo por intentos) |
| CU-05.1 | Cambiar / restablecer contraseña | Todos | `GET,PUT /cuenta/password` | `Auth\CuentaController`; el admin restablece desde CU-12 |
| CU-06 | Consultar bandeja de leads | Asesor | `GET /panel/cotizaciones` | `Panel\CotizacionController@index`, `@show`, `@tomar` |
| CU-07 | Generar cotización asistida | Asesor | `GET /panel/cotizar` | `Panel\CotizarController` + el mismo motor de CU-03 |
| CU-08 | Cambiar estado de visita | Asesor | `PATCH /panel/visitas/{visita}` | `Panel\VisitaController@update` · `VisitaPolicy` |
| CU-09 | Enviar proforma por WhatsApp | Asesor | `GET /panel/cotizaciones/{id}` | Botón *WhatsApp* con el enlace privado de la proforma (`CotizacionController@show`) |
| CU-10 | Gestionar lotes y manzanas | Gerente / Admin | `/panel/lotes` | `Panel\LoteController` → `DisponibilidadService` |
| CU-11 | Modificar plazos, precios y tipo de cambio | Gerente / Admin | `/admin/parametros` | `Admin\ParametroController` |
| CU-12 | Gestionar cuentas | Admin | `/admin/usuarios` | `Admin\UsuarioController` |
| CU-13 | Visualizar métricas | Gerente / Admin | `GET /panel/metricas` | `Panel\MetricaController@index` · vistas `v_ind_*` |
| CU-14 | Exportar reporte para SPSS | Gerente / Admin | `GET /panel/metricas/exportar` | `MetricaController@exportarSpss` |
| — | Cargar la fase pretest | Gerente / Admin | `/admin/pretest` | `Admin\PretestController` |
| — | Revisar bitácora de seguridad | Admin | `/admin/auditoria` | `Admin\AuditoriaController` |

## Relaciones del diagrama

- **CU-02 `«include»` CU-01**: no puedes simular sin haber elegido un lote del plano. En el código, `simular()` exige un `lote_id` válido.
- **CU-03 `«include»` CU-02**: la proforma se emite con el mismo cálculo que el cliente vio en pantalla; ambos llaman a `CotizadorService::calcular()`, así que la cifra impresa es idéntica a la simulada.
- **CU-09 `«include»` CU-07**: el enlace de WhatsApp necesita una cotización ya emitida.
- **CU-11 `«extend»` CU-10**: cambiar los plazos es opcional dentro de la gestión del catálogo.
- **CU-14 `«extend»` CU-13**: la exportación es una acción opcional desde la pantalla de métricas.

## Dos diferencias respecto al diagrama, a propósito

**CU-05.1 (recuperar contraseña) no está implementado como flujo de autoservicio.** Enviar correos exige configurar SMTP, lo que añade una dependencia externa que puede fallar justo el día de la sustentación. Con pocos usuarios internos, el administrador restablece la contraseña desde CU-12 en diez segundos. Al restablecerla, la persona queda obligada a cambiarla en su siguiente ingreso y se cierran sus sesiones abiertas.

**El diagrama indica ECharts en CU-13; el sistema usa Recharts (React).** Corrige el rótulo del diagrama a *Visualizar métricas* antes de imprimir.
