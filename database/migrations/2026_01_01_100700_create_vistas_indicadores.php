<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Vistas SQL de los indicadores de la tesis
|--------------------------------------------------------------------------
| Estas vistas son la fuente de las tablas y figuras del Capitulo III.
| Al vivir en la base de datos, cualquier miembro del jurado puede
| reproducir el calculo sin depender del codigo de la aplicacion.
|
| El SQL es compatible con MySQL/MariaDB (produccion) y SQLite (pruebas
| automatizadas): por eso se usa CASE WHEN en lugar de SUM(condicion).
*/
return new class extends Migration
{
    private const VISTAS = [
        'v_kpi_serie_diaria', 'v_kpi_canales', 'v_export_spss',
        'v_ind_conversion', 'v_ind_cumplimiento', 'v_ind_tiempo',
        'v_disponibilidad', 'v_lotes',
    ];

    public function up(): void
    {
        $sqlite = DB::getDriverName() === 'sqlite';
        $desvEst = $sqlite ? 'NULL' : 'ROUND(STDDEV_SAMP(duracion_min), 2)';
        $nombreAsesor = $sqlite
            ? "COALESCE(u.nombres || ' ' || u.apellidos, 'Autoservicio')"
            : "COALESCE(CONCAT(u.nombres, ' ', u.apellidos), 'Autoservicio')";

        // Precio efectivo de un lote: el fijo, o area x precio por m2 segun
        // si el lote esta en esquina o es interior.
        $precio = 'COALESCE(l.precio_lista, ROUND(l.area_m2 * CASE WHEN l.esquina = 1 '
            .'THEN p.precio_m2_esquina ELSE p.precio_m2_interior END, 2))';

        $this->vista('v_lotes', "
            SELECT
                l.id,
                l.codigo                AS lote,
                m.id                    AS manzana_id,
                m.codigo                AS manzana_codigo,
                m.nombre                AS manzana,
                m.orden                 AS manzana_orden,
                p.id                    AS proyecto_id,
                p.nombre                AS proyecto,
                p.moneda,
                l.frente_m,
                l.fondo_m,
                l.area_m2,
                CASE WHEN l.esquina = 1 THEN p.precio_m2_esquina ELSE p.precio_m2_interior END AS precio_m2,
                {$precio}               AS precio,
                l.estado,
                l.esquina,
                l.observacion,
                l.geometria,
                l.orden,
                l.updated_at
            FROM lotes l
            INNER JOIN manzanas  m ON m.id = l.manzana_id
            INNER JOIN proyectos p ON p.id = m.proyecto_id
        ");

        $this->vista('v_disponibilidad', "
            SELECT
                p.id     AS proyecto_id,
                p.nombre AS proyecto,
                COUNT(*)                                                         AS total_lotes,
                SUM(CASE WHEN l.estado = 'disponible' THEN 1 ELSE 0 END)         AS disponibles,
                SUM(CASE WHEN l.estado = 'reservado'  THEN 1 ELSE 0 END)         AS reservados,
                SUM(CASE WHEN l.estado = 'vendido'    THEN 1 ELSE 0 END)         AS vendidos,
                SUM(CASE WHEN l.estado = 'bloqueado'  THEN 1 ELSE 0 END)         AS bloqueados,
                ROUND(100.0 * SUM(CASE WHEN l.estado = 'vendido' THEN 1 ELSE 0 END) / COUNT(*), 2) AS pct_vendido,
                SUM(CASE WHEN l.estado = 'disponible' THEN {$precio} ELSE 0 END) AS valor_inventario_disponible
            FROM proyectos p
            INNER JOIN manzanas m ON m.proyecto_id = p.id
            INNER JOIN lotes    l ON l.manzana_id  = m.id
            GROUP BY p.id, p.nombre
        ");

        // INDICADOR 1 - Tiempo promedio de generacion de cotizaciones
        $this->vista('v_ind_tiempo', "
            SELECT
                fase,
                COUNT(*)                       AS n,
                ROUND(AVG(duracion_min), 2)    AS media_min,
                {$desvEst}                     AS desv_est,
                ROUND(MIN(duracion_min), 2)    AS minimo_min,
                ROUND(MAX(duracion_min), 2)    AS maximo_min
            FROM atenciones
            WHERE fin_at IS NOT NULL
            GROUP BY fase
        ");

        // INDICADOR 2 - Nivel de cumplimiento del SLA
        $this->vista('v_ind_cumplimiento', "
            SELECT
                fase,
                COUNT(*)                                              AS n,
                SUM(CASE WHEN cumple_sla = 1 THEN 1 ELSE 0 END)       AS dentro_sla,
                SUM(CASE WHEN cumple_sla = 0 THEN 1 ELSE 0 END)       AS fuera_sla,
                ROUND(100.0 * SUM(CASE WHEN cumple_sla = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS pct_cumplimiento,
                MAX(sla_minutos)                                      AS sla_minutos
            FROM atenciones
            WHERE fin_at IS NOT NULL
            GROUP BY fase
        ");

        // INDICADOR 3 - Tasa de conversion a visitas agendadas
        $this->vista('v_ind_conversion', "
            SELECT
                fase,
                COUNT(*)                                                AS atenciones,
                SUM(CASE WHEN agendo_visita = 1 THEN 1 ELSE 0 END)      AS visitas_agendadas,
                ROUND(100.0 * SUM(CASE WHEN agendo_visita = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS tasa_conversion
            FROM atenciones
            WHERE fin_at IS NOT NULL
            GROUP BY fase
        ");

        // Matriz de datos para IBM SPSS Statistics
        $this->vista('v_export_spss', "
            SELECT
                a.codigo                                                AS id_registro,
                a.fase,
                CASE a.fase WHEN 'pretest' THEN 1 ELSE 2 END            AS fase_num,
                a.origen,
                a.canal,
                DATE(a.inicio_at)                                       AS fecha,
                a.inicio_at,
                a.fin_at,
                a.duracion_min,
                a.sla_minutos,
                CASE WHEN a.cumple_sla = 1 THEN 1 ELSE 0 END            AS cumple_sla,
                CASE WHEN a.agendo_visita = 1 THEN 1 ELSE 0 END         AS agendo_visita,
                CASE WHEN a.genero_cotizacion = 1 THEN 1 ELSE 0 END     AS genero_cotizacion,
                {$nombreAsesor}                                         AS asesor,
                pr.nombre                                               AS proyecto,
                c.codigo                                                AS cotizacion,
                c.modalidad_pago,
                c.plazo_meses,
                c.precio_final                                          AS precio_final_usd,
                c.tipo_cambio,
                ROUND(c.precio_final * c.tipo_cambio, 2)                AS precio_final_pen
            FROM atenciones a
            LEFT JOIN users        u  ON u.id  = a.asesor_id
            LEFT JOIN proyectos    pr ON pr.id = a.proyecto_id
            LEFT JOIN cotizaciones c  ON c.atencion_id = a.id
            WHERE a.fin_at IS NOT NULL
        ");

        $this->vista('v_kpi_canales', "
            SELECT
                canal,
                COUNT(*)                     AS atenciones,
                ROUND(AVG(duracion_min), 2)  AS tiempo_promedio_min,
                ROUND(100.0 * SUM(CASE WHEN agendo_visita = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS tasa_conversion
            FROM atenciones
            WHERE fin_at IS NOT NULL AND fase = 'postest'
            GROUP BY canal
        ");

        $this->vista('v_kpi_serie_diaria', "
            SELECT
                DATE(inicio_at)              AS fecha,
                fase,
                COUNT(*)                     AS atenciones,
                ROUND(AVG(duracion_min), 2)  AS tiempo_promedio_min,
                ROUND(100.0 * SUM(CASE WHEN cumple_sla = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS pct_cumplimiento
            FROM atenciones
            WHERE fin_at IS NOT NULL
            GROUP BY DATE(inicio_at), fase
        ");
    }

    public function down(): void
    {
        foreach (self::VISTAS as $vista) {
            DB::statement("DROP VIEW IF EXISTS {$vista}");
        }
    }

    private function vista(string $nombre, string $sql): void
    {
        DB::statement("DROP VIEW IF EXISTS {$nombre}");
        DB::statement("CREATE VIEW {$nombre} AS {$sql}");
    }
};
