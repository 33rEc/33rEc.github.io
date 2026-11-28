// CAPA DE DATOS. Es lo único que sabe de dónde vienen los datos.
// Sin claves de Supabase → usa src/data/projects.seed.json. Con claves → Supabase (REST/GoTrue/Storage vía fetch, sin SDK).
import seed from '../data/projects.seed.json';
import { site } from '../config/site.js';

const { url: SB, anonKey: KEY } = site.supabase;
export const isLive = () => Boolean(SB && KEY);

const SESSION_KEY = '33r_admin_session';
const safe = (fn, d) => { try { return fn(); } catch { return d; } };

async function rest(path, { method = 'GET', body, token, headers = {}, raw = false } = {}) {
  const res = await fetch(`${SB}${path}`, {
    method,
    headers: { apikey: KEY, ...(token || !KEY.startsWith('sb_') ? { Authorization: `Bearer ${token || KEY}` } : {}), ...(body && !raw ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? (raw ? body : JSON.stringify(body)) : undefined,
  });
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || res.statusText);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---------- Público ----------
const byOrder = (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999);
const visible = (p) => p.published && p.status !== 'oculto';

/** @param {{drafts?: boolean}} opts drafts=true incluye borradores (solo vista previa del dueño con ?preview=1) */
export async function getProjects({ drafts = false } = {}) {
  if (isLive()) {
    const rows = await rest('/rest/v1/projects?select=*&order=sort_order.asc', { token: await token() });
    return rows.filter((p) => drafts || visible(p)).sort(byOrder);
  }
  return seed.filter((p) => drafts || visible(p)).sort(byOrder);
}
export async function getProject(slug, { drafts = true } = {}) {
  const all = await getProjects({ drafts });
  return all.find((p) => p.slug === slug) ?? null;
}
export const staticProjects = () => seed; // para getStaticPaths en build

/** Devuelve el texto localizado de un proyecto (cae a ES si no hay EN). */
export const loc = (p, key, lang) => (lang !== 'es' && p[lang]?.[key]) || (lang === 'ja' && p.en?.[key]) || p[key] || '';  // ja → en → es

export async function createLead(lead) {
  const row = {
    name: lead.name, business: lead.business, link: lead.link || null, goal: lead.goal,
    country: lead.country, whatsapp: lead.whatsapp, lang: lead.lang || 'es', source: lead.source || 'web',
  };
  if (!isLive()) throw new Error('not-configured');
  await rest('/rest/v1/leads', { method: 'POST', body: row, headers: { Prefer: 'return=minimal' } });
  return true;
}

// ---------- Admin (requiere sesión) ----------
const readSession = () => safe(() => JSON.parse(localStorage.getItem(SESSION_KEY)), null);
const writeSession = (s) => safe(() => (s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY)));

async function token() {
  const s = readSession();
  if (!s) return null;
  if (s.expires_at * 1000 - Date.now() > 60000) return s.access_token;
  try {
    const r = await rest('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } });
    writeSession(pack(r)); return r.access_token;
  } catch { writeSession(null); return null; }
}
const pack = (r) => ({ access_token: r.access_token, refresh_token: r.refresh_token, expires_at: r.expires_at ?? Math.floor(Date.now() / 1000) + r.expires_in, email: r.user?.email });

export async function signIn(email, password) {
  const r = await rest('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
  writeSession(pack(r)); return r.user?.email;
}
export const signOut = () => writeSession(null);
export const currentUser = () => readSession()?.email ?? null;

const authed = async () => { const t = await token(); if (!t) throw new Error('auth'); return t; };
export async function adminListProjects() { return rest('/rest/v1/projects?select=*&order=sort_order.asc', { token: await authed() }); }
export async function saveProject(p) {
  const t = await authed(); const { id, ...rest_ } = p;
  if (id) return rest(`/rest/v1/projects?id=eq.${id}`, { method: 'PATCH', body: rest_, token: t, headers: { Prefer: 'return=representation' } });
  return rest('/rest/v1/projects', { method: 'POST', body: rest_, token: t, headers: { Prefer: 'return=representation' } });
}
export async function deleteProject(id) { return rest(`/rest/v1/projects?id=eq.${id}`, { method: 'DELETE', token: await authed() }); }
export async function listLeads() { return rest('/rest/v1/leads?select=*&order=created_at.desc', { token: await authed() }); }
export async function updateLead(id, patch) { return rest(`/rest/v1/leads?id=eq.${id}`, { method: 'PATCH', body: patch, token: await authed() }); }

/** Sube un archivo al bucket público `project-media` y devuelve su URL pública. */
export async function uploadMedia(file, folder = 'misc') {
  const t = await authed();
  const name = `${folder}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`;
  const res = await fetch(`${SB}/storage/v1/object/project-media/${name}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${t}`, 'Content-Type': file.type, 'x-upsert': 'true' }, body: file });
  if (!res.ok) throw new Error(await res.text());
  return `${SB}/storage/v1/object/public/project-media/${name}`;
}

// ---------- Panel de control (solo admin; ver supabase/control.sql). Genérico: sirve a cualquier tabla del panel. ----------
export async function dbList(table, order = 'created_at.asc') { return rest(`/rest/v1/${table}?select=*&order=${order}`, { token: await authed() }); }
export async function dbUpsert(table, row, onConflict = '') {
  return rest(`/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ''}`, { method: 'POST', body: row, token: await authed(), headers: { Prefer: 'resolution=merge-duplicates,return=representation' } });
}
export async function dbDelete(table, match) { return rest(`/rest/v1/${table}?${match}`, { method: 'DELETE', token: await authed() }); }
