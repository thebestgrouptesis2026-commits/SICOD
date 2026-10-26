import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMoneda } from '@/hooks/use-moneda';
import { fecha, type Moneda } from '@/lib/formato';
import { cn } from '@/lib/utils';

export function SelectorMoneda({ className }: { className?: string }) {
    const { moneda, cambiar, tipoCambio, fechaTipoCambio } = useMoneda();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn('inline-flex', className)}>
                    <ToggleGroup
                        type="single"
                        value={moneda}
                        onValueChange={(v) => v && cambiar(v as Moneda)}
                        aria-label="Moneda de los precios"
                    >
                        <ToggleGroupItem value="USD" className="px-2.5 text-xs">US$</ToggleGroupItem>
                        <ToggleGroupItem value="PEN" className="px-2.5 text-xs">S/</ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                Tipo de cambio S/ {tipoCambio.toFixed(3)} por dólar{fechaTipoCambio ? ` (${fecha(fechaTipoCambio)})` : ''}
            </TooltipContent>
        </Tooltip>
    );
}
