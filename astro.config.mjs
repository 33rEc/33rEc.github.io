import { defineConfig } from 'astro/config';

// Sitio de usuario en GitHub Pages: https://33rec.github.io/
// Cuando haya dominio propio: cambia `site` y agrega public/CNAME.
export default defineConfig({
  site: 'https://33rec.github.io',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
});
