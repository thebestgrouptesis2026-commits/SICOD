import * as React from 'react';
import * as Recharts from 'recharts';

import { cn } from '@/lib/utils';

/**
 * Contenedor de graficos al estilo shadcn/ui: define colores por serie
 * como variables CSS (--color-<clave>) que respetan el tema claro/oscuro.
 */
export type ChartConfig = Record<string, { label: string; color: string }>;

const ChartContext = React.createContext<ChartConfig | null>(null);

function useChart() {
    const ctx = React.useContext(ChartContext);
    if (!ctx) throw new Error('useChart debe usarse dentro de <ChartContainer>');
    return ctx;
}

function ChartContainer({ config, className, children, ...props }: React.ComponentProps<'div'> & { config: ChartConfig; children: React.ReactElement }) {
    const estilo = Object.fromEntries(Object.entries(config).map(([k, v]) => [`--color-${k}`, v.color])) as React.CSSProperties;

    return (
        <ChartContext.Provider value={config}>
            <div
                data-slot="chart"
                style={estilo}
                className={cn(
                    'aspect-video w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/70 [&_.recharts-layer]:outline-hidden [&_.recharts-reference-line_line]:stroke-border [&_.recharts-surface]:outline-hidden [&_.recharts-tooltip-cursor]:fill-muted/60',
                    className,
                )}
                {...props}
            >
                <Recharts.ResponsiveContainer>{children}</Recharts.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
}

const ChartTooltip = Recharts.Tooltip;

type Entrada = { dataKey?: string | number; name?: string | number; value?: number | string; color?: string; payload?: Record<string, unknown> };

function ChartTooltipContent({
    active,
    payload,
    label,
    formatoValor,
    formatoEtiqueta,
}: {
    active?: boolean;
    payload?: Entrada[];
    label?: string | number;
    formatoValor?: (valor: number, clave: string) => string;
    formatoEtiqueta?: (label: string | number) => string;
}) {
    const config = useChart();
    if (!active || !payload?.length) return null;

    return (
        <div className="grid min-w-[9rem] gap-1.5 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
            {label !== undefined && <div className="font-semibold text-foreground">{formatoEtiqueta ? formatoEtiqueta(label) : label}</div>}
            {payload.map((item) => {
                const clave = String(item.dataKey ?? item.name ?? '');
                const conf = config[clave];
                return (
                    <div key={clave} className="flex items-center gap-2">
                        <span className="size-2.5 rounded-[3px]" style={{ background: item.color ?? conf?.color }} />
                        <span className="text-muted-foreground">{conf?.label ?? clave}</span>
                        <span className="ml-auto font-semibold text-foreground tabular-nums">
                            {formatoValor ? formatoValor(Number(item.value), clave) : item.value}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function ChartLegend({ className, config: propio }: { className?: string; config?: ChartConfig }) {
    const contexto = React.useContext(ChartContext);
    const config = propio ?? contexto ?? {};
    return (
        <div className={cn('flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-muted-foreground', className)}>
            {Object.entries(config).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[3px]" style={{ background: v.color }} />
                    {v.label}
                </span>
            ))}
        </div>
    );
}

export { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent };
