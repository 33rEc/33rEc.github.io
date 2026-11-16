// Genera los entregables estáticos del logo. Uso: node scripts/build-brand.mjs [a|b|c]
import { writeFileSync, mkdirSync } from 'node:fs';
import { G3, R, SPARK, VIEWBOX, COLORS as C } from '../src/lib/logo.js';
const concept = process.argv[2] ?? 'a';
mkdirSync('public/brand', { recursive: true });

const svg = ({ stroke, spark, bg = null, vb = VIEWBOX, sw = 3.4, body }) =>
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="${sw}">${bg ? `<rect x="-999" y="-999" width="3000" height="3000" fill="${bg}" stroke="none"/>` : ''}${body(stroke, spark)}</svg>`;

const wm = (s, k) => `<path d="${G3}" stroke="${s}"/><path d="${G3}" transform="translate(28 0)" stroke="${s}"/><path d="${R}" stroke="${s}"/><circle cx="${SPARK.cx}" cy="${SPARK.cy}" r="${SPARK.r}" fill="${k}" stroke="none"/>`;

writeFileSync('public/brand/33r-dark.svg', svg({ body: wm, stroke: C.bone, spark: C.ecto }));
writeFileSync('public/brand/33r-light.svg', svg({ body: wm, stroke: C.ink, spark: C.ink }));

// Marca compacta (favicon / app icon): los dos 3 espejados "Ɛ3" — legible a 16 px
const mark = (s) => `<path d="${G3}" transform="translate(20 0) scale(-1 1)" stroke="${s}"/><path d="${G3}" transform="translate(24 0)" stroke="${s}"/>`;
const tile = (size, pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${size * .22}" fill="${C.ink}"/><g transform="translate(${size / 2} ${size / 2}) scale(${(size - pad * 2) / 44}) translate(-22 -18)" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4.6" stroke="${C.bone}">${mark(C.bone)}<circle cx="22" cy="18" r="1.6" fill="${C.ecto}" stroke="none"/></g></svg>`;
writeFileSync('public/favicon.svg', tile(64, 10));
writeFileSync('public/brand/app-icon.svg', tile(512, 120));
// Foto de perfil Instagram: círculo lo recorta la app, así que cuadrado con el wordmark centrado
writeFileSync('public/brand/instagram-profile.svg',
 `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${C.ink}"/><circle cx="200" cy="200" r="170" fill="${C.graphite}"/><g transform="translate(200 200) scale(3.4) translate(-39 -18)" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.4">${wm(C.bone, C.ecto)}</g></svg>`);
console.log('SVG ok, concepto', concept);
