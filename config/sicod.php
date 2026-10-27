<?php

/*
|----------------------------------------------------------------------
| Parametros del estudio y reglas de negocio
|----------------------------------------------------------------------
| Valores por defecto. En ejecucion se leen de la tabla `parametros`,
| que es editable desde el panel de administracion (CU-11).
*/

return [

    // Umbral de cumplimiento del tiempo de atencion (Matriz de Consistencia).
    'sla_minutos' => (int) env('SICOD_SLA_MINUTOS', 30),

    // Plazos que se muestran como opcion. El cliente puede escribir otro
    // plazo siempre que no supere el maximo.
    'plazos_meses' => [12, 108, 120, 150],
    'plazo_defecto' => 150,
    'plazo_maximo' => 150,

    // La empresa financia sin cuota inicial.
    'inicial_pct_default' => 0,

    // Tasa efectiva anual. 0 = financiamiento directo sin interes.
    'tasa_anual_default' => 0,

    // Descuento sobre el valor total del lote cuando se paga al contado.
    'descuento_contado_pct' => 20,

    // Soles por dolar. Lo actualiza el administrador; cada cotizacion
    // guarda el valor con el que se emitio.
    'tipo_cambio' => 3.448,
    'tipo_cambio_fecha' => '2026-10-13',

    // Vigencia de la proforma en dias.
    'dias_validez' => 7,

    // Duracion por defecto de una reserva de lote, en dias.
    'dias_reserva' => 3,

    // Contrasena de las cuentas que crea el seeder. En un servidor publico
    // debe definirse: la de por defecto figura en el README.
    'password_inicial' => env('SICOD_PASSWORD_INICIAL') ?: 'sicod2026',

    // Obliga a cambiar la contrasena inicial en el primer ingreso.
    'forzar_cambio_password' => (bool) env('SICOD_FORZAR_CAMBIO_PASSWORD', true),

    // IPs del proxy inverso o tunel, separadas por coma ('*' = cualquiera).
    'trusted_proxies' => env('TRUSTED_PROXIES'),

    // Proteccion contra fuerza bruta en el inicio de sesion.
    'login_intentos' => (int) env('SICOD_LOGIN_INTENTOS', 5),
];
