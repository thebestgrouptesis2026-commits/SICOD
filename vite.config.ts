import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': `${import.meta.dirname}/resources/js`,
        },
    },
    build: {
        // Sin mapas de codigo fuente en produccion: no se expone el codigo.
        sourcemap: false,
    },
});
