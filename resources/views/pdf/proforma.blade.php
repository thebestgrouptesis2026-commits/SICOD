<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Proforma {{ $cotizacion->codigo }}</title>
    <style>
        @page { margin: 22mm 16mm 24mm; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9.5px; color: #15201B; line-height: 1.45; }
        h1 { font-size: 15px; margin: 0; }
        .tenue { color: #5C6A62; }
        .chico { font-size: 8px; }
        .rotulo { font-size: 7.5px; color: #5C6A62; letter-spacing: .6px; text-transform: uppercase; margin-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { vertical-align: top; }
        .franja { background: #1C5A44; color: #fff; padding: 14px 16px; }
        .franja .tenue { color: #CFE3D8; }
        .bloque { margin-top: 14px; }
        .tarjeta { border: 1px solid #D3DAD4; padding: 9px 11px; }
        .destacado { background: #EEF4F0; border: 1px solid #B8D2C3; padding: 12px 14px; }
        .monto { font-size: 22px; font-weight: bold; color: #1C5A44; }
        .monto-pen { font-size: 11px; color: #3E5A4D; }
        .condiciones td { padding: 5px 0; border-bottom: 1px solid #E6EBE7; }
        .condiciones td.der { text-align: right; font-weight: bold; }
        .der { text-align: right; }
        .crono th { font-size: 7.5px; color: #5C6A62; text-align: right; padding: 4px 5px; border-bottom: 1px solid #D3DAD4; }
        .crono th:first-child, .crono td:first-child { text-align: left; }
        .crono td { padding: 3px 5px; text-align: right; border-bottom: 1px solid #EEF1EE; }
        .pie { position: fixed; bottom: -16mm; left: 0; right: 0; font-size: 7.5px; color: #5C6A62;
               border-top: 1px solid #D3DAD4; padding-top: 5px; }
    </style>
</head>
<body>
@php
    $usd = fn ($v) => 'US$ '.number_format((float) $v, 2);
    $pen = fn ($v) => 'S/ '.number_format($cotizacion->enSoles($v), 2);
    $lote = $cotizacion->lote;
    $financiado = $cotizacion->modalidad_pago === 'financiado';
@endphp

<div class="franja">
    <table>
        <tr>
            <td>
                <h1>Inmobiliaria Constructora Taipe S.A.C.</h1>
                <div class="tenue">RUC 20502902637 · {{ $proyecto->nombre }}</div>
                <div class="tenue">{{ $proyecto->ubicacion }} · {{ $proyecto->telefono }}</div>
            </td>
            <td class="der">
                <div class="tenue chico">PROFORMA</div>
                <div style="font-size:14px; font-weight:bold;">{{ $cotizacion->codigo }}</div>
                <div class="tenue chico">Emitida {{ $cotizacion->emitida_at->format('d/m/Y H:i') }}</div>
                <div class="tenue chico">Válida hasta {{ optional($cotizacion->valida_hasta)->format('d/m/Y') }}</div>
            </td>
        </tr>
    </table>
</div>

<table class="bloque">
    <tr>
        <td class="tarjeta" style="width:50%;">
            <div class="rotulo">Cliente</div>
            <strong>{{ $cotizacion->cliente_nombre }}</strong><br>
            Documento {{ $cotizacion->cliente_documento }}<br>
            Celular +51 {{ $cotizacion->cliente_telefono }}
            @if($cotizacion->cliente_email)<br>{{ $cotizacion->cliente_email }}@endif
        </td>
        <td style="width:10px;"></td>
        <td class="tarjeta" style="width:50%;">
            <div class="rotulo">Lote</div>
            <strong>{{ $lote->manzana->nombre }} · Lote {{ $lote->codigo }}</strong><br>
            {{ $lote->esquina ? 'Lote en esquina' : 'Lote interior' }} ·
            {{ number_format((float) $lote->area_m2, 2) }} m²<br>
            {{ number_format((float) $lote->frente_m, 2) }} m de frente × {{ number_format((float) $lote->fondo_m, 2) }} m de fondo
        </td>
    </tr>
</table>

<div class="bloque destacado">
    <table>
        <tr>
            <td>
                @if($financiado)
                    <div class="rotulo">Cuota mensual</div>
                    <div class="monto">{{ $usd($cotizacion->cuota_mensual) }}</div>
                    <div class="monto-pen">{{ $pen($cotizacion->cuota_mensual) }} al mes</div>
                @else
                    <div class="rotulo">Precio al contado</div>
                    <div class="monto">{{ $usd($cotizacion->precio_final) }}</div>
                    <div class="monto-pen">{{ $pen($cotizacion->precio_final) }}</div>
                @endif
            </td>
            <td class="der tenue" style="vertical-align: bottom;">
                @if($financiado)
                    {{ $cotizacion->plazo_meses }} cuotas mensuales · sin cuota inicial<br>
                    @if((float) $cotizacion->tasa_anual_pct > 0)
                        Tasa efectiva anual {{ number_format((float) $cotizacion->tasa_anual_pct, 2) }} %
                    @else
                        Financiamiento directo sin intereses
                    @endif
                @else
                    Incluye {{ rtrim(rtrim(number_format((float) $cotizacion->descuento_pct, 2), '0'), '.') }} % de descuento por pago al contado
                @endif
            </td>
        </tr>
    </table>
</div>

<table class="bloque condiciones">
    <tr><td>Precio por m² ({{ $lote->esquina ? 'esquina' : 'interior' }})</td><td class="der">{{ $usd($cotizacion->precio_m2) }}</td></tr>
    <tr><td>Precio de lista ({{ number_format((float) $lote->area_m2, 2) }} m² × {{ $usd($cotizacion->precio_m2) }})</td>
        <td class="der">{{ $usd($cotizacion->precio_lista) }} <span class="tenue">· {{ $pen($cotizacion->precio_lista) }}</span></td></tr>
    @if((float) $cotizacion->descuento_monto > 0)
        <tr><td>Descuento por pago al contado ({{ rtrim(rtrim(number_format((float) $cotizacion->descuento_pct, 2), '0'), '.') }} %)</td>
            <td class="der">− {{ $usd($cotizacion->descuento_monto) }} <span class="tenue">· {{ $pen($cotizacion->descuento_monto) }}</span></td></tr>
    @endif
    <tr><td><strong>{{ $financiado ? 'Total a pagar' : 'Precio final' }}</strong></td>
        <td class="der">{{ $usd($financiado ? $cotizacion->total_financiado : $cotizacion->precio_final) }}
            <span class="tenue">· {{ $pen($financiado ? $cotizacion->total_financiado : $cotizacion->precio_final) }}</span></td></tr>
    @if($financiado)
        <tr><td>Cuota inicial</td><td class="der">Sin cuota inicial</td></tr>
        <tr><td>Plazo</td><td class="der">{{ $cotizacion->plazo_meses }} meses</td></tr>
        @if($ultimaCuota !== null && abs($ultimaCuota - (float) $cotizacion->cuota_mensual) >= 0.01)
            <tr><td>Última cuota (ajuste de redondeo)</td><td class="der">{{ $usd($ultimaCuota) }}</td></tr>
        @endif
    @endif
    <tr><td class="tenue">Tipo de cambio referencial</td><td class="der tenue">S/ {{ number_format((float) $cotizacion->tipo_cambio, 3) }} por dólar</td></tr>
</table>

@if($cronograma)
<div class="bloque">
    <div class="rotulo">Cronograma referencial · primeras {{ count($cronograma) }} de {{ $totalCuotas }} cuotas (US$)</div>
    <table class="crono">
        <thead>
            <tr><th>N.°</th><th>Saldo inicial</th><th>Interés</th><th>Amortización</th><th>Cuota</th><th>Saldo final</th></tr>
        </thead>
        <tbody>
            @foreach($cronograma as $fila)
            <tr>
                <td>{{ $fila['cuota'] }}</td>
                <td>{{ number_format($fila['saldo_inicial'], 2) }}</td>
                <td>{{ number_format($fila['interes'], 2) }}</td>
                <td>{{ number_format($fila['amortizacion'], 2) }}</td>
                <td><strong>{{ number_format($fila['pago'], 2) }}</strong></td>
                <td>{{ number_format($fila['saldo_final'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

<div class="bloque chico tenue">
    @if($cotizacion->asesor)
        Asesor: {{ $cotizacion->asesor->nombre_completo }}{{ $cotizacion->asesor->telefono ? ' · '.$cotizacion->asesor->telefono : '' }}<br>
    @endif
    Precios en dólares americanos. El monto en soles es referencial y usa el tipo de cambio indicado; el pago se liquida al tipo de cambio del día.
</div>

<div class="pie">
    Esta proforma es una propuesta comercial referencial y no constituye contrato de compraventa.
    La disponibilidad del lote se confirma al momento de la separación. Generada por SICOD el {{ now()->format('d/m/Y H:i') }}.
</div>
</body>
</html>
