import { Monitor, Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTema } from '@/hooks/use-tema';

export function SelectorTema() {
    const { tema, setTema, oscuro } = useTema();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Cambiar tema">
                    {oscuro ? <Moon /> : <Sun />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setTema('claro')} data-activo={tema === 'claro'}>
                    <Sun /> Claro
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTema('oscuro')}>
                    <Moon /> Oscuro
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTema('sistema')}>
                    <Monitor /> Según el sistema
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
