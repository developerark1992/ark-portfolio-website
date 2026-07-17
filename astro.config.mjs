import { defineConfig } from 'astro/config';

// Static output — deploys to Vercel/Netlify/Cloudflare as pure static files (fastest).
export default defineConfig({
  site: 'https://abdul-portfolio.vercel.app',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
});
