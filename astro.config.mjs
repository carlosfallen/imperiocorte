import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import solidJs from '@astrojs/solid-js';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
    routes: {
      extend: {
      }
    }
  }),
  integrations: [solidJs()],
  vite: {
    ssr: {
      external: ['node:crypto', 'node:buffer']
    }
  }
});