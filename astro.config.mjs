// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  compressHTML: true,
  // Postaviti punu adresu sajta kroz SITE_URL pri produkcionom buildu.
  site: process.env.SITE_URL || undefined,
});
