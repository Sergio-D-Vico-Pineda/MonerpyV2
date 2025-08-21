// @ts-check
import
{
    defineConfig
}
from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig(
{
    vite:
    {
        plugins: [tailwindcss()]
    },
    devToolbar:
    {
        enabled: false
    },
    output: 'server',
    adapter: node(
    {
        mode: 'standalone',
    }),
    server:
    {
        host: true,
        port: 4321,
        headers:
        {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    },
});