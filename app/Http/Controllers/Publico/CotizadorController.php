<?php

namespace App\Http\Controllers\Publico;

use App\Http\Controllers\Controller;
use App\Http\Requests\EmitirCotizacionRequest;
use App\Models\Atencion;
use App\Models\Cliente;
use App\Models\Cotizacion;
use App\Models\Lote;
use App\Models\Parametro;
use App\Services\AuditoriaService;
use App\Services\CorrelativoService;
use App\Services\CotizadorService;
use App\Services\MedicionService;
use App\Services\ProformaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use InvalidArgumentException;
use RuntimeException;

/**
 * CU-02 Simular financiamiento | CU-03 Generar y descargar PDF
 * CU-07 Cotizacion asistida (el mismo motor, operado por el asesor)
 *
 * Aqui vive el cronometro del estudio: `iniciar` sella T0 y `emitir` sella T1.
 */
class CotizadorController extends Controller
{
    public const CANALES = ['whatsapp', 'llamada', 'presencial', 'facebook', 'instagram', 'web', 'referido', 'otro'];

    private const SESION = 'cotizador.atenciones';

    public function __construct(
        private CotizadorService $cotizador,
        private MedicionService $medicion,
        private CorrelativoService $correlativo,
        private ProformaService $proformas,
        private AuditoriaService $auditoria,
    ) {}

    /**
     * Abre la atencion (T0) en cuanto se selecciona un lote.
     */
    public function iniciar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'lote_id' => ['required', 'integer', 'exists:lotes,id'],
            'canal' => ['nullable', Rule::in(self::CANALES)],
        ]);

        $lote = Lote::with('manzana.proyecto')->findOrFail($datos['lote_id']);

        if (! $lote->estaDisponible()) {
            return response()->json([
                'ok' => false,
                'mensaje' => "El lote {$lote->codigo} ya no está disponible. Elige otro lote del plano.",
            ], 409);
        }

        $atencion = $this->medicion->iniciarAtencion(
            proyectoId: $lote->manzana->proyecto_id,
            canal: $datos['canal'] ?? ($request->user() ? 'presencial' : 'web'),
            asesorId: $request->user()?->id,
        );

        // El token solo sirve desde esta misma sesion del navegador: aunque
        // alguien lo intercepte, no puede cerrar la atencion de otra persona.
        $tokens = array_slice([...$request->session()->get(self::SESION, []), $atencion->session_token], -5);
        $request->session()->put(self::SESION, $tokens);

        return response()->json([
            'ok' => true,
            'token' => $atencion->session_token,
            'inicio' => $atencion->inicio_at->toIso8601String(),
        ]);
    }

    /**
     * CU-02: simulacion en vivo. No cierra la atencion ni persiste nada,
     * para que el cliente pueda comparar plazos libremente.
     */
    public function simular(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'lote_id' => ['required', 'integer', 'exists:lotes,id'],
            'modalidad_pago' => ['required', Rule::in(['contado', 'financiado'])],
            'plazo_meses' => ['nullable', 'integer', 'min:1', 'max:'.$this->cotizador->plazoMaximo()],
        ]);

        $lote = Lote::with('manzana.proyecto')->findOrFail($datos['lote_id']);

        return response()->json([
            'ok' => true,
            'calculo' => $this->cotizador->calcular(
                lote: $lote,
                modalidad: $datos['modalidad_pago'],
                plazoMeses: isset($datos['plazo_meses']) ? (int) $datos['plazo_meses'] : null,
            ),
        ]);
    }

    /**
     * CU-03: formaliza la cotizacion, genera el PDF y cierra la atencion (T1).
     */
    public function emitir(EmitirCotizacionRequest $request): RedirectResponse
    {
        $datos = $request->validated();
        $usuario = $request->user();

        $tokensSesion = $request->session()->get(self::SESION, []);
        $atencion = in_array($datos['atencion_token'], $tokensSesion, true)
            ? Atencion::where('session_token', $datos['atencion_token'])->first()
            : null;

        if (! $atencion) {
            return back()->with('error', 'Tu sesión de cotización expiró. Vuelve a elegir el lote para empezar de nuevo.');
        }

        if (! $atencion->estaAbierta()) {
            // Doble envio del formulario: se devuelve la proforma ya emitida.
            if ($previa = $atencion->cotizacion) {
                return $this->redirigirA($previa, $usuario !== null);
            }

            return back()->with('error', 'Esa sesión de cotización ya se cerró. Vuelve a elegir el lote en el plano.');
        }

        try {
            $cotizacion = DB::transaction(function () use ($datos, $atencion, $usuario) {
                // Bloqueo de fila: impide que dos clientes coticen el mismo
                // lote en el mismo instante.
                $lote = Lote::with('manzana.proyecto')
                    ->whereKey($datos['lote_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! $lote->estaDisponible()) {
                    throw new RuntimeException("El lote {$lote->codigo} fue tomado hace un momento. Elige otro del plano.");
                }

                $cliente = $this->registrarCliente($datos, $usuario?->id);

                $calculo = $this->cotizador->calcular(
                    lote: $lote,
                    modalidad: $datos['modalidad_pago'],
                    plazoMeses: $datos['modalidad_pago'] === 'financiado' ? (int) $datos['plazo_meses'] : null,
                );
                unset($calculo['soles']);

                $diasValidez = (int) Parametro::obtener('dias_validez', config('sicod.dias_validez'));
                $nombre = trim($datos['nombres'].' '.($datos['apellidos'] ?? ''));

                $cotizacion = $this->correlativo->crearConCodigo('cotizaciones', 'COT', fn (string $codigo) => Cotizacion::create([
                    ...$calculo,
                    'codigo' => $codigo,
                    'atencion_id' => $atencion->id,
                    'lote_id' => $lote->id,
                    'cliente_id' => $cliente->id,
                    'asesor_id' => $usuario?->id,
                    'cliente_nombre' => $nombre,
                    'cliente_documento' => $datos['numero_documento'],
                    'cliente_telefono' => $datos['telefono'],
                    'cliente_email' => $datos['email'] ?? null,
                    'canal' => $datos['canal'] ?? $atencion->canal,
                    'estado' => 'emitida',
                    'valida_hasta' => now()->addDays($diasValidez)->toDateString(),
                    'emitida_at' => now(),
                ]));

                $atencion->update([
                    'cliente_id' => $cliente->id,
                    'canal' => $datos['canal'] ?? $atencion->canal,
                ]);

                // T1: el cronometro se detiene aqui, con hora del servidor.
                $this->medicion->cerrarAtencion($atencion);

                return $cotizacion;
            });
        } catch (RuntimeException|InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        $this->proformas->generar($cotizacion);

        $request->session()->put(self::SESION, array_values(array_diff($tokensSesion, [$datos['atencion_token']])));

        if ($usuario) {
            $this->auditoria->registrar('cotizacion.emitida', "Cotización {$cotizacion->codigo} emitida (asistida)", $cotizacion);
        }

        return $this->redirigirA($cotizacion, $usuario !== null);
    }

    /**
     * Un visitante anonimo no puede modificar la ficha de un cliente que ya
     * existe solo por escribir su DNI. Lo que escribio queda guardado en la
     * cotizacion; la ficha solo la actualiza un asesor autenticado.
     */
    private function registrarCliente(array $datos, ?int $asesorId): Cliente
    {
        $contacto = [
            'nombres' => $datos['nombres'],
            'apellidos' => $datos['apellidos'] ?? null,
            'telefono' => $datos['telefono'],
            'email' => $datos['email'] ?? null,
        ];

        $cliente = Cliente::firstOrNew([
            'tipo_documento' => $datos['tipo_documento'],
            'numero_documento' => $datos['numero_documento'],
        ]);

        if (! $cliente->exists) {
            $cliente->fill($contacto + [
                'canal_origen' => $datos['canal'] ?? 'web',
                'asesor_id' => $asesorId,
                'consentimiento_datos' => true,
            ])->save();

            return $cliente;
        }

        if ($asesorId !== null) {
            $cliente->fill($contacto);
            $cliente->asesor_id ??= $asesorId;
        }

        $cliente->consentimiento_datos = true;
        $cliente->save();

        return $cliente;
    }

    private function redirigirA(Cotizacion $cotizacion, bool $desdePanel): RedirectResponse
    {
        if ($desdePanel) {
            return redirect()->route('panel.cotizaciones.show', $cotizacion)
                ->with('exito', "Cotización {$cotizacion->codigo} emitida.");
        }

        return redirect()->route('cotizacion.ver', $cotizacion->token_publico);
    }
}
