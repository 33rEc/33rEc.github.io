// ALMACÉN DEL PANEL. Dos modos con la misma interfaz:
//  · Supabase (si hay claves): datos compartidos entre Daniel y Juan, protegidos por RLS (solo `admins`).
//  · Local (sin claves): datos solo en ESTE navegador. Sirve para probar; se pueden exportar y subir después.
// Los datos de clientes y costos NUNCA entran al repositorio: aquí solo hay una semilla de lo que ya es público en la web.
import * as D from '../../js/data.js';
import seed from '../../data/projects.seed.json';

export const TABLES = ['clients', 'projects', 'tools', 'project_tools', 'income', 'costs', 'prospects'];
const LOCAL_KEY = '33r_control_v1';
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
const empty = () => Object.fromEntries(TABLES.map((t) => [t, []]));
const ORDER = { clients: 'created_at.asc', projects: 'created_at.asc', tools: 'created_at.asc', income: 'date.desc', prospects: 'week.desc', costs: 'date.desc', project_tools: 'project_id.asc' };

/** Semilla local: SOLO lo que ya es público en https://33rec.github.io (proyectos publicados). Sin precios ni costos. */
function seedLocal() {
  const db = empty(); const now = new Date().toISOString();
  const TOOLS = [['GitHub Pages', 'hosting', 'GitHub', 'gratis'], ['Vercel', 'hosting', 'Vercel', 'mensual'], ['Supabase', 'backend', 'Supabase', 'mensual'], ['Google Analytics 4', 'analitica', 'Google', 'gratis'], ['Microsoft Clarity', 'analitica', 'Microsoft', 'gratis'], ['Mapbox', 'mapas', 'Mapbox', 'uso'], ['Dominio', 'dominio', '', 'anual'], ['WhatsApp Business', 'mensajeria', 'Meta', 'gratis'], ['Claude (IA)', 'ia', 'Anthropic', 'mensual'], ['Higgsfield (IA generativa)', 'ia', 'Higgsfield', 'mensual']];
  const tool = {}; for (const [name, category, vendor, billing] of TOOLS) { const t = { id: uuid(), name, category, vendor, billing, monthly_cost_cents: 0, notes: 'Completa el costo real.', created_at: now }; tool[name] = t.id; db.tools.push(t); }
  // Herramientas inferidas de lo que se vio en sus sitios públicos. Corrígelas en el panel.
  const STACK = { mockabox: ['GitHub Pages', 'Supabase', 'Google Analytics 4', 'Microsoft Clarity', 'WhatsApp Business'], 'core-studio': ['GitHub Pages', 'Supabase', 'WhatsApp Business'], 'ficoa-beer-garden': ['GitHub Pages', 'Supabase', 'WhatsApp Business'], 'gorila-burgers': ['GitHub Pages', 'WhatsApp Business'], 'luna-dental': ['GitHub Pages', 'WhatsApp Business'], dogo: ['GitHub Pages', 'Supabase', 'WhatsApp Business'], dipers: ['GitHub Pages'], geriam: ['Vercel', 'Mapbox'], nutribites: ['GitHub Pages', 'WhatsApp Business'] };
  for (const p of seed.filter((x) => x.published && x.status !== 'oculto')) {
    const c = { id: uuid(), name: p.client.replace(/\s*\(.*\)$/, ''), country: p.country || 'Ecuador', city: p.city || '', industry: p.industry, status: 'activo', contact: '', since: '', mrr_cents: 0, notes: '', created_at: now }; db.clients.push(c);
    const pr = { id: uuid(), client_id: c.id, name: p.client.replace(/\s*\(.*\)$/, ''), country: p.country || 'Ecuador', city: p.city || '', kind: (p.solution_types || [])[0] || '', status: 'en_vivo', started_on: '', delivered_on: '', price_cents: 0, live_url: p.live_url || '', repo_url: '', notes: '', created_at: now }; db.projects.push(pr);
    for (const name of STACK[p.slug] || []) db.project_tools.push({ project_id: pr.id, tool_id: tool[name] });
  }
  return db;
}

function local() {
  const read = () => { try { const d = JSON.parse(localStorage.getItem(LOCAL_KEY)); if (d && d.clients) return d; } catch {} const d = seedLocal(); write(d); return d; };
  const write = (d) => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(d)); } catch {} };
  return {
    live: false, hasLocal: () => !!localStorage.getItem(LOCAL_KEY),
    async load() { const d = read(); for (const t of TABLES) d[t] ||= []; return d; },
    async save(table, row) { const d = read(); if (!row.id && table !== 'project_tools') row.id = uuid(); row.created_at ||= new Date().toISOString(); const i = d[table].findIndex((x) => x.id === row.id); i >= 0 ? (d[table][i] = { ...d[table][i], ...row }) : d[table].push(row); write(d); return row; },
    async remove(table, id) { const d = read(); d[table] = d[table].filter((x) => x.id !== id); if (table === 'projects') d.project_tools = d.project_tools.filter((l) => l.project_id !== id); if (table === 'tools') d.project_tools = d.project_tools.filter((l) => l.tool_id !== id); write(d); },
    async setLinks(projectId, toolIds) { const d = read(); d.project_tools = d.project_tools.filter((l) => l.project_id !== projectId).concat(toolIds.map((t) => ({ project_id: projectId, tool_id: t }))); write(d); },
    async reset(withSeed) { try { localStorage.removeItem(LOCAL_KEY); } catch {} if (withSeed) read(); },
    async replaceAll(data) { const d = empty(); for (const t of TABLES) d[t] = Array.isArray(data[t]) ? data[t] : []; write(d); },
  };
}

const T = (t) => `ctl_${t}`; // tablas del panel en Supabase llevan prefijo ctl_ (no chocan con las de la web)
function remote() {
  const unwrap = (r) => (Array.isArray(r) ? r[0] : r);
  return {
    live: true,
    async load() { const out = {}; await Promise.all(TABLES.map(async (t) => { out[t] = await D.dbList(T(t), ORDER[t]); })); return out; },
    async save(table, row) { const r = { ...row }; delete r.created_at; return unwrap(await D.dbUpsert(T(table), r, table === 'project_tools' ? 'project_id,tool_id' : '')); },
    async remove(table, id) { await D.dbDelete(T(table), `id=eq.${id}`); },
    async setLinks(projectId, toolIds) { await D.dbDelete(T('project_tools'), `project_id=eq.${projectId}`); if (toolIds.length) await D.dbUpsert(T('project_tools'), toolIds.map((t) => ({ project_id: projectId, tool_id: t })), 'project_id,tool_id'); },
    /** Sube lo que hay en este navegador a Supabase, respetando el orden de dependencias. */
    async importAll(data) { for (const t of ['clients', 'tools', 'projects', 'project_tools', 'income', 'costs', 'prospects']) { const rows = (data[t] || []).map(({ created_at, ...r }) => r); if (rows.length) await D.dbUpsert(T(t), rows, t === 'project_tools' ? 'project_id,tool_id' : ''); } },
  };
}

export const makeStore = () => (D.isLive() ? remote() : local());
export const readLocalRaw = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)); } catch { return null; } };
export const newId = uuid;
