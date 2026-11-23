import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { remarkSpecLinks } from './src/lib/remark-spec-links.mjs';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://arcadestr.example',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkSpecLinks],
    shikiConfig: { theme: 'vitesse-dark', wrap: true },
  },
  vite: { plugins: [tailwindcss()] },
});
