import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

const nombre = import.meta.env.VITE_APP_NAME || 'SICOD';

createInertiaApp({
    title: (titulo) => (titulo ? `${titulo} · ${nombre}` : `${nombre} · Inmobiliaria Constructora Taipe`),
    resolve: (pagina) => {
        const paginas = import.meta.glob('./pages/**/*.tsx');
        const cargar = paginas[`./pages/${pagina}.tsx`];
        if (!cargar) throw new Error(`Página no encontrada: ${pagina}`);
        return cargar() as never;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: '#2e8b62', delay: 180 },
});
