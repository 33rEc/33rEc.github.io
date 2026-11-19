// Verifica que es / en / ja tengan exactamente la misma estructura (claves y longitudes de listas). Uso: node scripts/check-i18n.mjs
import { dict } from '../src/i18n/index.js';
const shape = (v, path = '', out = []) => {
  if (Array.isArray(v)) { out.push(`${path}[${v.length}]`); v.forEach((x, i) => shape(x, `${path}[${i}]`, out)); }
  else if (v && typeof v === 'object') Object.keys(v).forEach((k) => shape(v[k], path ? `${path}.${k}` : k, out));
  else out.push(path);
  return out;
};
const base = new Set(shape(dict.es)); let bad = 0;
for (const l of ['en', 'ja']) {
  const cur = new Set(shape(dict[l]));
  const missing = [...base].filter((k) => !cur.has(k)), extra = [...cur].filter((k) => !base.has(k));
  if (missing.length || extra.length) { bad++; console.log(`✗ ${l}: faltan ${missing.length}, sobran ${extra.length}`, missing.slice(0, 8), extra.slice(0, 8)); } else console.log(`✓ ${l}: ${cur.size} claves, estructura idéntica a es`);
}
process.exit(bad ? 1 : 0);
