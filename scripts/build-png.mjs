// Rasteriza app icon, apple-touch, perfil IG y OG a PNG con Playwright. Uso: node scripts/build-png.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage();
const shot = async (svgFile, size, out) => {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<body style="margin:0">${readFileSync(svgFile, 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
  await p.screenshot({ path: out });
};
await shot('public/brand/app-icon.svg', 512, 'public/brand/app-icon-512.png');
await shot('public/brand/app-icon.svg', 192, 'public/brand/app-icon-192.png');
await shot('public/brand/app-icon.svg', 180, 'public/brand/apple-touch-icon.png');
await shot('public/brand/instagram-profile.svg', 1080, 'public/brand/instagram-profile.png');
const wm = readFileSync('public/brand/33r-dark.svg', 'utf8').replace('<svg ', '<svg width="520" ');
await p.setViewportSize({ width: 1200, height: 630 });
await p.setContent(`<body style="margin:0;width:1200px;height:630px;background:radial-gradient(600px 400px at 50% 45%,#1c1f26,#0A0A0C);display:grid;place-items:center;font-family:system-ui;color:#EDEAE3;position:relative">${wm}<p style="position:absolute;bottom:64px;margin:0;font:500 22px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#8E8C88">Una pantalla que vende. Otra que controla.</p></body>`);
await p.screenshot({ path: 'public/og.png' });
await b.close(); console.log('PNG ok');
