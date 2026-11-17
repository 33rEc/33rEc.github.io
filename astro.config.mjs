import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Sitio de usuario en GitHub Pages. Con dominio propio: cambia `site` aquí y en src/config/site.js, y agrega public/CNAME.
export default defineConfig({
  site: 'https://33rec.github.io',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
  integrations: [sitemap({
    filter: (page) => !/(logo-lab|admin|404)/.test(page),
    i18n: { defaultLocale: 'es', locales: { es: 'es-EC', en: 'en-US' } },
  })],
});
