import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Hybrid: pages are static by default (fastest); routes that opt in with
// `export const prerender = false` render on-demand on Vercel — used by the
// DB-backed blog + dashboard so posts publish instantly without a rebuild.
export default defineConfig({
  site: 'https://arkdesigningbureau.com',
  output: 'static',
  adapter: vercel(),
  build: { inlineStylesheets: 'auto' },
});
