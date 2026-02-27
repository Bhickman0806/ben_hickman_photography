// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://benhickmanphotography.com',
  integrations: [sitemap()],
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()]
  }
});