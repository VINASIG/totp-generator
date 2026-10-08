import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://totp.vinasig.io.vn',
  base: '/',
  output: 'static',
  vite: { worker: { format: 'es' } },
  build: { format: 'directory', inlineStylesheets: 'never' },
});
