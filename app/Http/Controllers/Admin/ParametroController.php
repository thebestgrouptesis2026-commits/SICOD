<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Parametro;
use App\Models\Proyecto;
use App\Services\AuditoriaService;
use App\Services\CotizadorService;
use App\Services\MonedaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CU-11: Modificar plazos maximos y demas reglas del cotizador, precios
 * por m2 de cada proyecto y tipo de cambio.
 */
class ParametroController extends Controller
{
    public function __construct(
        private CotizadorService $cotizador,
        private MonedaService $moneda,
        private AuditoriaService $auditoria,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/parametros', [
            'parametros' => [
                ...$this->cotizador->reglas(),
                'sla_minutos' => (int) Parametro::obtener('sla_minutos', config('sicod.sla_minutos')),
                'dias_reserva' => (int) Parametro::obtener('dias_reserva', config('sicod.dias_reserva')),
                'tipo_cambio' => $this->moneda->tipoCambio(),
                'tipo_cambio_fecha' => $this->moneda->fechaTipoCambio(),
            ],
            'proyectos' => Proyecto::orderBy('nombre')->get()->map(fn (Proyecto $p) => [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'precio_m2_interior' => (float) $p->precio_m2_interior,
                'precio_m2_esquina' => (float) $p->precio_m2_esquina,
                'whatsapp' => $p->whatsapp,
                'telefono' => $p->telefono,
            ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'plazos' => ['required', 'array', 'min:1', 'max:12'],
            'plazos.*' => ['integer', 'min:1', 'max:360', 'distinct'],
            'plazo_defecto' => ['required', 'integer', 'min:1', 'lte:plazo_maximo'],
            'plazo_maximo' => ['required', 'integer', 'min:1', 'max:360'],
            'descuento_contado_pct' => ['required', 'numeric', 'min:0', 'max:60'],
            'tasa_anual_pct' => ['required', 'numeric', 'min:0', 'max:60'],
            'sla_minutos' => ['required', 'integer', 'min:1', 'max:600'],
            'dias_validez' => ['required', 'integer', 'min:1', 'max:90'],
            'dias_reserva' => ['required', 'integer', 'min:1', 'max:90'],
            'tipo_cambio' => ['required', 'numeric', 'min:1', 'max:20'],
            'tipo_cambio_fecha' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
        ], [
            'plazo_defecto.lte' => 'El plazo sugerido no puede ser mayor que el plazo máximo.',
            'tipo_cambio_fecha.before_or_equal' => 'La fecha del tipo de cambio no puede ser futura.',
        ]);

        $plazos = collect($datos['plazos'])->map(fn ($p) => (int) $p)
            ->filter(fn ($p) => $p <= $datos['plazo_maximo'])->sort()->values()->all();

        if (empty($plazos)) {
            return back()->withErrors(['plazos' => 'Al menos un plazo debe ser menor o igual al máximo.']);
        }

        $antes = $this->cotizador->reglas() + ['tipo_cambio' => $this->moneda->tipoCambio()];

        Parametro::guardar('plazos_meses', $plazos, 'Plazos que se muestran como opción, en meses');
        Parametro::guardar('plazo_defecto', $datos['plazo_defecto'], 'Plazo sugerido al abrir el cotizador');
        Parametro::guardar('plazo_maximo', $datos['plazo_maximo'], 'Plazo máximo permitido, en meses');
        Parametro::guardar('descuento_contado_pct', $datos['descuento_contado_pct'], 'Descuento por pago al contado (%)');
        Parametro::guardar('tasa_anual_default', $datos['tasa_anual_pct'], 'Tasa efectiva anual. 0 = sin interés');
        Parametro::guardar('sla_minutos', $datos['sla_minutos'], 'Umbral de cumplimiento del tiempo de atención');
        Parametro::guardar('dias_validez', $datos['dias_validez'], 'Vigencia de la proforma en días');
        Parametro::guardar('dias_reserva', $datos['dias_reserva'], 'Duración de una reserva en días');
        Parametro::guardar('tipo_cambio', $datos['tipo_cambio'], 'Soles por dólar (venta)');
        Parametro::guardar('tipo_cambio_fecha', $datos['tipo_cambio_fecha'], 'Fecha del tipo de cambio');

        $this->auditoria->registrar('parametros.actualizados', 'Parámetros del cotizador actualizados', datos: [
            'antes' => $antes,
            'despues' => $datos,
        ]);

        return back()->with('exito', 'Parámetros guardados. Las cotizaciones ya emitidas conservan sus condiciones.');
    }

    public function updateProyecto(Request $request, Proyecto $proyecto): RedirectResponse
    {
        $datos = $request->validate([
            'precio_m2_interior' => ['required', 'numeric', 'min:1', 'max:100000'],
            'precio_m2_esquina' => ['required', 'numeric', 'min:1', 'max:100000'],
            'whatsapp' => ['nullable', 'regex:/^51?9[0-9]{8}$/'],
            'telefono' => ['nullable', 'string', 'max:25'],
        ], ['whatsapp.regex' => 'Escribe el WhatsApp con 9 dígitos (puedes anteponer 51).']);

        $antes = $proyecto->only(['precio_m2_interior', 'precio_m2_esquina', 'whatsapp']);

        if (! empty($datos['whatsapp']) && strlen($datos['whatsapp']) === 9) {
            $datos['whatsapp'] = '51'.$datos['whatsapp'];
        }

        $proyecto->update($datos);

        $this->auditoria->registrar('proyecto.precios', "Precios de {$proyecto->nombre} actualizados", $proyecto, [
            'antes' => $antes,
            'despues' => $datos,
        ]);

        return back()->with('exito', "Precios de {$proyecto->nombre} actualizados.");
    }
}
