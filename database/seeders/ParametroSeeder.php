<?php

namespace Database\Seeders;

use App\Models\Parametro;
use Illuminate\Database\Seeder;

class ParametroSeeder extends Seeder
{
    public function run(): void
    {
        Parametro::guardar('sla_minutos', 30,
            'Umbral de cumplimiento del tiempo de atención, en minutos (Matriz de Consistencia)');
        Parametro::guardar('plazos_meses', [12, 108, 120, 150],
            'Plazos que se muestran como opción, en meses');
        Parametro::guardar('plazo_defecto', 150, 'Plazo sugerido al abrir el cotizador');
        Parametro::guardar('plazo_maximo', 150, 'Plazo máximo permitido, en meses');
        Parametro::guardar('descuento_contado_pct', 20, 'Descuento por pago al contado (%)');
        Parametro::guardar('tasa_anual_default', 0, 'Tasa efectiva anual. 0 = financiamiento directo sin interés');
        Parametro::guardar('tipo_cambio', 3.448, 'Soles por dólar (venta)');
        Parametro::guardar('tipo_cambio_fecha', '2026-10-13', 'Fecha del tipo de cambio');
        Parametro::guardar('dias_validez', 7, 'Vigencia de la proforma, en días');
        Parametro::guardar('dias_reserva', 3, 'Duración de una reserva de lote, en días');
    }
}
