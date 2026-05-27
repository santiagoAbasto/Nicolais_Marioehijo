import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({

    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
        watch: {
            ignored: [
                '**/vendor/**',
            ],
        },
    },

    plugins: [
        laravel({
            input: [
                'resources/js/app.jsx',
                'resources/js/web.js',
                'resources/css/admin/app.css',
                'resources/css/web/app.css',
                'resources/css/web/home.css',
                'resources/css/web/about.css',
                'resources/css/web/catalog.css',
                'resources/css/web/contact.css',
                'resources/css/web/client-zone.css',
                'resources/css/web/applications.css',
                'resources/css/web/news.css',
                'resources/css/web/products.css',
                'resources/css/web/quality.css',
                'resources/css/web/offers.css',
                'resources/css/web/search.css',
                'resources/css/web/search-page.css',
                'resources/css/web/quote.css',
                'resources/css/web/sections/home-sections-general.css',
                'resources/css/web/sections/home-news-section.css',
                'resources/css/web/sections/products-page.css',
            ],
            refresh: true,
        }),

        react({
            fastRefresh: true,
        }),
        tailwindcss(),

    ],

    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },

})
