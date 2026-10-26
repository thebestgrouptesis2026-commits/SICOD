import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { useTema } from '@/hooks/use-tema';

function Toaster(props: ToasterProps) {
    const { oscuro } = useTema();

    return (
        <Sonner
            theme={oscuro ? 'dark' : 'light'}
            position="bottom-right"
            closeButton
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: 'font-sans !rounded-lg !border-border',
                    description: '!text-muted-foreground',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
