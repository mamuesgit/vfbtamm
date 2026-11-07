// @ts-check
import { defineConfig } from 'astro/config';
import linksErgaenzen from './src/lib/links-ergaenzen.mjs';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  outDir: './dist',
  integrations: [linksErgaenzen()],
});
