import { Badge } from '@/components/ui/badge';
import { ESTADO_LOTE, ESTADO_VISITA } from '@/lib/formato';

const VARIANTE_LOTE = { disponible: 'ok', reservado: 'warn', vendido: 'bad', bloqueado: 'lock' } as const;
const VARIANTE_VISITA = { agendada: 'warn', realizada: 'ok', cancelada: 'muted', no_asistio: 'bad' } as const;

export function EstadoLote({ estado, className }: { estado: string; className?: string }) {
    const variante = VARIANTE_LOTE[estado as keyof typeof VARIANTE_LOTE] ?? 'muted';
    return (
        <Badge variant={variante} className={className}>
            <span className="size-1.5 rounded-full bg-current" />
            {ESTADO_LOTE[estado] ?? estado}
        </Badge>
    );
}

export function EstadoVisita({ estado, className }: { estado: string | null | undefined; className?: string }) {
    if (!estado) return <Badge variant="muted" className={className}>Sin visita</Badge>;
    const variante = VARIANTE_VISITA[estado as keyof typeof VARIANTE_VISITA] ?? 'muted';
    return (
        <Badge variant={variante} className={className}>
            {ESTADO_VISITA[estado] ?? estado}
        </Badge>
    );
}
