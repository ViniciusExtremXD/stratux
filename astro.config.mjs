// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

const BASE = process.env.BASE_PATH || '/';
const SITE = process.env.SITE_URL || 'https://www.stratuxconsultoria.com.br';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: 'Source Serif 4',
        cssVariable: '--font-display',
        weights: [400, 600, 700],
        styles: ['normal'],
        subsets: ['latin', 'latin-ext'],
        display: 'swap',
        fallbacks: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      {
        provider: fontProviders.google(),
        name: 'Archivo',
        cssVariable: '--font-sans',
        weights: [400, 500, 600, 700],
        styles: ['normal'],
        subsets: ['latin', 'latin-ext'],
        display: 'swap',
        fallbacks: ['Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    ],
  },
});
