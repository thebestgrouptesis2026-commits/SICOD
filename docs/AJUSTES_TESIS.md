# Ajustes pendientes en el documento de tesis

Al construir el sistema aparecieron algunas inconsistencias entre tus documentos. Ninguna es grave, pero todas son del tipo que un jurado detecta leyendo en diagonal. Conviene resolverlas antes de imprimir.

---

## 1. El umbral de cumplimiento aparece con dos valores distintos

| Documento | Dice |
|---|---|
| Matriz de Consistencia | cotizaciones entregadas en **≤ 30 minutos** |
| Anexo 1 (ficha de registro) | cotizaciones entregadas en **≤ 60 minutos** |

**El sistema usa 30 minutos**, siguiendo la Matriz de Consistencia, que es el documento que define formalmente el indicador.

**Qué hacer:** corregir el Anexo 1 para que diga 30. Si por alguna razón decides quedarte con 60, cámbialo en Gerencia → Parámetros *antes* de empezar el postest, no después: el sistema congela el umbral vigente en cada atención, así que un cambio posterior no reescribe las mediciones ya tomadas (eso es deliberado, pero significa que el cambio tardío dejaría tus datos mezclados).

Un apunte práctico: 30 minutos es un umbral más exigente y, por tanto, más convincente. Si el proceso manual demora entre 40 y 80 minutos y el sistema resuelve en menos de 10, el contraste con 30 hace más visible la mejora que con 60.

---

## 2. Hay dos cronogramas incompatibles

En distintas partes del documento aparecen dos calendarios para la misma recolección:

- Pretest en **mayo**, postest en **junio** de 2026.
- Pretest en **agosto-septiembre**, postest en **septiembre-octubre** de 2026.

**Qué hacer:** elegir uno y unificarlo en todas las secciones (cronograma, metodología, presupuesto). El jurado revisa el cronograma contra las fechas de recolección declaradas en los resultados.

---

## 3. La duración de cada fase no cuadra con el tamaño de muestra

El documento declara **24 registros en pretest y 24 en postest**, pero asigna **12 días hábiles al pretest y 24 al postest**.

Si en 12 días recoges 24 registros, el proceso manual produce 2 cotizaciones diarias. Si en el postest necesitas 24 días para los mismos 24 registros, el sistema estaría produciendo 1 por día: la mitad. Eso contradice la hipótesis.

**Qué hacer:** igualar las ventanas de observación (por ejemplo, 12 días hábiles en ambas fases) o justificar explícitamente por qué difieren. Lo natural es igualarlas: si son iguales, la comparación es limpia y además puedes reportar el volumen de atenciones por día como dato adicional a favor.

---

## 4. La tecnología de presentación cambió

El documento menciona Blade, HTML/CSS/JavaScript y Chart.js (y el diagrama de casos de uso, ECharts en el CU-13). La versión final usa:

- **React 19 + TypeScript** con componentes **shadcn/ui** y **Tailwind CSS 4** para la interfaz.
- **Inertia.js** para conectar React con Laravel sin una API separada.
- **Recharts** para los gráficos de indicadores.
- **Laravel 12** (no 11).

**Qué hacer:** actualizar la tabla de herramientas del Capítulo II, la arquitectura (ver [ARQUITECTURA.md](ARQUITECTURA.md), que ya explica por qué Inertia mantiene el patrón MVC) y el rótulo del CU-13 a *Visualizar métricas*.

---

## 5. Datos que conviene precisar en el Capítulo II

El sistema quedó configurado con estas reglas comerciales:

- **Moneda:** precios en **dólares (USD)**, con equivalente en **soles (PEN)**. El tipo de cambio lo registra el administrador (valor inicial S/ 3.448, venta del 13 de octubre de 2026) y cada cotización lo congela.
- **Precio por m²:** US$ 320 para lotes interiores y US$ 330 para lotes en esquina.
- **Cuota inicial:** no hay. La cuota mensual es el precio del lote entre el número de meses.
- **Plazos:** 12, 108, 120 y 150 meses; 150 es el sugerido y el máximo.
- **Pago al contado:** 20 % de descuento sobre el precio total.
- **Financiamiento:** directo de la empresa, sin intereses (la tasa es configurable, pero viene en cero).
- **Proyecto de ejemplo:** 4 manzanas de 16 lotes (64 lotes), con lotes de 128 a 158 m². **Reemplázalo por el plano real de la lotización** desde Panel → Lotes.
- **Roles:** Administrador, Gerente y Asesor.

---

## 6. Párrafo sugerido para reforzar la validez del instrumento

Esta es probablemente la pregunta más incómoda que te puede hacer el jurado: *¿cómo sé que los tiempos del postest no están sesgados a favor del sistema?* Conviene tener la respuesta escrita antes de que la pregunten.

> La medición del postest no depende de un observador con cronómetro. El propio sistema sella la hora de inicio en el servidor en el momento en que el cliente selecciona un lote, y la hora de término en la misma transacción en que se emite la cotización. La duración es una columna derivada de ambas marcas y no es editable desde ninguna pantalla: no existe ruta ni formulario que permita modificarla. Tampoco existe operación de eliminación sobre la tabla de atenciones, de modo que el conjunto de datos no puede depurarse selectivamente. Adicionalmente, el umbral de cumplimiento se almacena en cada registro con el valor vigente al momento de la atención, por lo que una modificación posterior del parámetro no altera retroactivamente las mediciones ya realizadas. Estas tres decisiones de diseño reducen el riesgo de sesgo del investigador sobre la variable dependiente.

Puedes añadir que el sistema cuenta con 28 pruebas automáticas (`composer test`), entre ellas las que verifican el cálculo de precios y que ninguna persona sin permiso puede ver o alterar cotizaciones ajenas.

Puedes citar como evidencia las tres clases correspondientes: `MedicionService`, el bloque de rutas en `routes/web.php` (donde se comprueba la ausencia de un `DELETE` sobre atenciones) y la columna `atenciones.sla_minutos`.

---

## 7. Limitación que conviene declarar

El pretest se construye transcribiendo la ficha de registro de tiempos del proceso manual, mientras que el postest lo captura el sistema automáticamente. Son dos procedimientos de captura distintos para la misma variable.

Es inevitable —no existía sistema durante el pretest, por definición— pero es honesto declararlo en la sección de limitaciones y explicar cómo lo mitigaste: usando el mismo formato de registro, el mismo umbral y la misma unidad de análisis en ambas fases, y almacenando ambas en la misma tabla con la misma estructura de campos.

Declararlo tú mismo es mucho mejor que dejar que lo descubra el jurado.
