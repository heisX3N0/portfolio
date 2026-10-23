// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages that must stay out of the sitemap (SPEC 10 phase 1: the style guide).
const notInSitemap = ['/styleguide/', '/404/'];

export default defineConfig({
  site: 'https://boluwatife.olapade.site',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({ filter: (page) => !notInSitemap.some((path) => new URL(page).pathname.startsWith(path)) }),
  ],
});
