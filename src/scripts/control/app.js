// PANEL DE CONTROL DE 33r · interfaz. Usa store.js (Supabase o local) y calc.js (cálculos puros).
import * as D from '../../js/data.js';
import { makeStore, newId, readLocalRaw, TABLES } from './store.js';
import { summarize, toolMatrix, fmt, toCents, toCSV, localDate } from './calc.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = document.getElementById('app'), store = makeStore();
let db = null, S = null, view = (location.hash || '#resumen').slice(1), msg = '';
const F = { clientes: { q: '', status: '', country: '' }, proyectos: { q: '', status: '', country: '' }, finanzas: { tab: 'income', month: '' }, prospectos: { week: '', status: '', country: '', q: '' }, contenido: { client: '', month: localDate().slice(0, 7), status: '', q: '' } };
const DAILY_GOAL = 5;
const DAY = 864e5, sundayOf = (d) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() - x.getDay()); return localDate(x); }, addDays = (d, n) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() + n); return localDate(x); }, WEEK_GOAL = 25;

const L = {
  pstat: [['nuevo', 'Nuevo'], ['demo_lista', 'Demo lista'], ['contactado', 'Contactado'], ['respondio', 'Respondió'], ['propuesta', 'Propuesta enviada'], ['reunion', 'Reunión'], ['ganado', 'Ganado'], ['descartado', 'Descartado']],
  cchan: [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn'], ['whatsapp', 'WhatsApp'], ['otro', 'Otro']],
  cformat: [['post', 'Post'], ['carrusel', 'Carrusel'], ['reel', 'Reel'], ['historia', 'Historia'], ['otro', 'Otro']],
  cstat: [['idea', 'Idea'], ['aprobado', 'Aprobado'], ['publicado', 'Publicado'], ['descartado', 'Descartado']],
  channel: [['instagram', 'Instagram'], ['whatsapp', 'WhatsApp'], ['email', 'Correo'], ['linkedin', 'LinkedIn'], ['web', 'Formulario web'], ['otro', 'Otro']],
  cstatus: [['activo', 'Activo'], ['pausado', 'Pausado'], ['perdido', 'Perdido']],
  pstatus: [['demo', 'Demo'], ['en_desarrollo', 'En desarrollo'], ['en_vivo', 'En vivo'], ['pausado', 'Pausado'], ['cerrado', 'Cerrado']],
  industry: [['gastronomia', 'Gastronomía'], ['eventos', 'Eventos'], ['retail', 'Retail'], ['salud', 'Salud y bienestar'], ['entretenimiento', 'Entretenimiento'], ['gobierno_tech', 'Gobierno / Tech'], ['marca_propia', 'Marca propia'], ['distribucion', 'Distribución'], ['otro', 'Otro']],
  kind: [['landing', 'Landing'], ['panel', 'Panel / CRM'], ['fidelizacion', 'Fidelización'], ['ecommerce', 'E-commerce'], ['minijuego', 'Minijuego'], ['a_medida', 'A medida'], ['monitoreo', 'Monitoreo'], ['otro', 'Otro']],
  tcat: [['hosting', 'Hosting'], ['backend', 'Base de datos / backend'], ['analitica', 'Analítica'], ['diseno', 'Diseño'], ['ia', 'IA'], ['pagos', 'Pagos'], ['mensajeria', 'Mensajería'], ['mapas', 'Mapas'], ['dominio', 'Dominio'], ['otro', 'Otro']],
  billing: [['mensual', 'Mensual'], ['anual', 'Anual'], ['uso', 'Por uso'], ['unico', 'Pago único'], ['gratis', 'Gratis']],
  ikind: [['anticipo', 'Anticipo'], ['saldo', 'Saldo'], ['mensualidad', 'Mensualidad'], ['otro', 'Otro']], istatus: [['cobrado', 'Cobrado'], ['pendiente', 'Pendiente']], ckind: [['unico', 'Único'], ['recurrente', 'Recurrente']],
};
const lab = (list, v) => (list.find((x) => x[0] === v) || [, v || '—'])[1];
const COUNTRIES = ['Ecuador', 'España', 'México', 'Colombia', 'Estados Unidos', 'Japón', 'Portugal', 'Otro'];

// ---------- esquemas de formularios ----------
const opts = (list) => () => list;
const clientOpts = () => [['', '— sin cliente —'], ...db.clients.map((c) => [c.id, c.name])];
const projectOpts = () => [['', '— sin proyecto —'], ...db.projects.map((p) => [p.id, p.name])];
const toolOpts = () => [['', '— ninguna —'], ...db.tools.map((t) => [t.id, t.name])];
const SCHEMA = {
  prospects: { title: 'Prospecto', fields: [
    { k: 'week', label: 'Semana (domingo)', type: 'date', req: 1, def: 'week' }, { k: 'name', label: 'Negocio', req: 1 }, { k: 'country', label: 'País', req: 1, list: COUNTRIES, def: 'España' }, { k: 'city', label: 'Ciudad' },
    { k: 'industry', label: 'Rubro', type: 'select', o: opts(L.industry) }, { k: 'score', label: 'Puntaje de ajuste (0-100)', type: 'int' }, { k: 'channel', label: 'Canal de contacto', type: 'select', o: opts(L.channel) }, { k: 'contact', label: 'Contacto / usuario' },
    { k: 'evidence_url', label: 'Enlace de evidencia', type: 'url' }, { k: 'status', label: 'Estado', type: 'select', o: opts(L.pstat), def: 'nuevo' }, { k: 'why', label: 'Por qué encaja', type: 'textarea', wide: 1 }, { k: 'offer', label: 'Qué ofrecerle', wide: 1 },
    { k: 'pain', label: 'Dolor detectado', type: 'textarea', wide: 1 }, { k: 'demo_url', label: 'Enlace de la demo', type: 'url', wide: 1 }, { k: 'first_message', label: 'Primer mensaje', type: 'textarea', wide: 1 }, { k: 'followups', label: 'Seguimientos (día 2, 5 y 9)', type: 'textarea', wide: 1 }, { k: 'contacted_on', label: 'Enviado el', type: 'date' }, { k: 'next_action', label: 'Próxima acción' }, { k: 'next_on', label: 'Para cuándo', type: 'date' }, { k: 'notes', label: 'Notas', type: 'textarea', wide: 1 }] },
  content: { title: 'Pieza de contenido', fields: [
    { k: 'publish_on', label: 'Fecha de publicación', type: 'date', req: 1, def: 'today' }, { k: 'client_id', label: 'Cliente', type: 'select', o: clientOpts }, { k: 'channel', label: 'Canal', type: 'select', o: opts(L.cchan) }, { k: 'format', label: 'Formato', type: 'select', o: opts(L.cformat) },
    { k: 'title', label: 'Idea / título', req: 1, wide: 1 }, { k: 'copy', label: 'Texto (copy)', type: 'textarea', wide: 1 }, { k: 'visual', label: 'Imagen o video (descripción)', type: 'textarea', wide: 1 }, { k: 'hashtags', label: 'Hashtags' },
    { k: 'status', label: 'Estado', type: 'select', o: opts(L.cstat), def: 'idea' }, { k: 'notes', label: 'Notas', type: 'textarea', wide: 1 }] },
  clients: { title: 'Cliente', fields: [
    { k: 'name', label: 'Nombre del cliente', req: 1 }, { k: 'country', label: 'País', req: 1, list: COUNTRIES, def: 'Ecuador' }, { k: 'city', label: 'Ciudad' },
    { k: 'industry', label: 'Rubro', type: 'select', o: opts(L.industry) }, { k: 'status', label: 'Estado', type: 'select', o: opts(L.cstatus), def: 'activo' },
    { k: 'contact', label: 'Contacto (nombre y canal)', hint: 'Solo lo necesario: este dato es privado.' }, { k: 'since', label: 'Cliente desde', type: 'date' },
    { k: 'mrr_cents', label: 'Mensualidad que paga (USD/mes)', type: 'money' }, { k: 'brand', label: 'Marca y voz (colores, tono, público; sirve a Lucho)', type: 'textarea', wide: 1 }, { k: 'notes', label: 'Notas', type: 'textarea', wide: 1 }, { k: '_proj', label: 'También crear su proyecto (mismo nombre, país y ciudad)', type: 'check', onlyNew: 1 }] },
  projects: { title: 'Proyecto', fields: [
    { k: 'name', label: 'Nombre del proyecto', req: 1 }, { k: 'client_id', label: 'Cliente', type: 'select', o: clientOpts }, { k: 'country', label: 'País', req: 1, list: COUNTRIES, def: 'Ecuador' }, { k: 'city', label: 'Ciudad' },
    { k: 'kind', label: 'Tipo', type: 'select', o: opts(L.kind) }, { k: 'status', label: 'Estado', type: 'select', o: opts(L.pstatus), def: 'en_desarrollo' },
    { k: 'started_on', label: 'Inicio', type: 'date' }, { k: 'delivered_on', label: 'Entrega', type: 'date' }, { k: 'price_cents', label: 'Precio acordado (USD)', type: 'money' },
    { k: 'live_url', label: 'Enlace en vivo', type: 'url' }, { k: 'repo_url', label: 'Repositorio', type: 'url' }, { k: '_tools', label: 'Herramientas que usa', type: 'tools', wide: 1 }, { k: 'notes', label: 'Notas', type: 'textarea', wide: 1 }] },
  tools: { title: 'Herramienta', fields: [
    { k: 'name', label: 'Nombre', req: 1 }, { k: 'category', label: 'Categoría', type: 'select', o: opts(L.tcat) }, { k: 'vendor', label: 'Proveedor' }, { k: 'billing', label: 'Facturación', type: 'select', o: opts(L.billing), def: 'mensual' },
    { k: 'monthly_cost_cents', label: 'Costo mensual equivalente (USD)', type: 'money', hint: 'Una anual de $120 = $10 al mes. Se reparte entre los proyectos que la usan.' }, { k: 'notes', label: 'Notas', type: 'textarea', wide: 1 }] },
  income: { title: 'Ingreso', fields: [
    { k: 'date', label: 'Fecha', type: 'date', req: 1, def: 'today' }, { k: 'concept', label: 'Concepto', req: 1 }, { k: 'amount_cents', label: 'Monto (USD)', type: 'money', req: 1 },
    { k: 'project_id', label: 'Proyecto', type: 'select', o: projectOpts }, { k: 'client_id', label: 'Cliente', type: 'select', o: clientOpts },
    { k: 'kind', label: 'Tipo', type: 'select', o: opts(L.ikind), def: 'anticipo' }, { k: 'status', label: 'Estado', type: 'select', o: opts(L.istatus), def: 'cobrado' }, { k: 'notes', label: 'Notas', type: 'textarea', wide: 1 }] },
  costs: { title: 'Costo', fields: [
    { k: 'date', label: 'Fecha', type: 'date', req: 1, def: 'today' }, { k: 'concept', label: 'Concepto', req: 1 }, { k: 'amount_cents', label: 'Monto (USD)', type: 'money', req: 1 },
    { k: 'project_id', label: 'Proyecto (si es directo)', type: 'select', o: projectOpts }, { k: 'tool_id', label: 'Herramienta', type: 'select', o: toolOpts },
    { k: 'kind', label: 'Tipo', type: 'select', o: opts(L.ckind), def: 'unico' }, { k: 'notes', label: 'Notas', type: 'textarea', wide: 1 }] },
};

// ---------- utilidades de interfaz ----------
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? esc(u) : '');
const pill = (t, tone = '') => `<span class="pill ${tone}">${esc(t)}</span>`;
const stTone = (s) => ({ ganado: 'ok', publicado: 'ok', aprobado: 'warn', idea: 'info', demo_lista: 'info', nuevo: 'info', contactado: 'info', respondio: 'warn', propuesta: 'warn', reunion: 'warn', descartado: 'mute', activo: 'ok', en_vivo: 'ok', cobrado: 'ok', prospecto: 'info', demo: 'info', en_desarrollo: 'info', pendiente: 'warn', pausado: 'warn', perdido: 'bad', cerrado: 'mute' }[s] || '');
const money = (c) => `<span class="n ${c < 0 ? 'neg' : ''}">${fmt(c)}</span>`;
const empty = (t, cta = '') => `<div class="empty"><p>${esc(t)}</p>${cta}</div>`;
const table = (cols, rows) => `<div class="tbl"><table><thead><tr>${cols.map((c) => `<th class="${c.r ? 'r' : ''}">${esc(c.h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td class="${c.r ? 'r' : ''}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const options = (list, cur, all) => (all ? `<option value="">${all}</option>` : '') + list.map(([v, l]) => `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('');
const actions = (t, id) => `<div class="act"><button class="btn sm" data-edit="${t}:${id}">Editar</button><button class="btn sm danger" data-del="${t}:${id}">Borrar</button></div>`;
const toast = (t) => { const e = document.createElement('div'); e.className = 'toast'; e.setAttribute('role', 'status'); e.textContent = t; document.body.appendChild(e); setTimeout(() => e.classList.add('out'), 2400); setTimeout(() => e.remove(), 2900); };
const downloadFile = (name, text, type = 'text/plain') => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
const countriesList = () => [...new Set([...COUNTRIES, ...db.clients.map((c) => c.country), ...db.projects.map((p) => p.country)].filter(Boolean))];

// ---------- gráficos ----------
function chartMonths(series) {
  const W = 760, H = 230, pl = 52, pb = 28, pt = 10, maxD = Math.max(...series.flatMap((s) => [s.income, s.costs]), 100) / 100, raw = maxD / 4, mag = 10 ** Math.floor(Math.log10(raw)), nm = raw / mag, step = (nm <= 1 ? 1 : nm <= 2 ? 2 : nm <= 5 ? 5 : 10) * mag, top = step * 4 * 100;
  const bw = (W - pl) / series.length, y = (v) => pt + (H - pt - pb) * (1 - v / top); const ticks = [0, 1, 2, 3, 4].map((i) => step * i * 100);
  const mon = (m) => ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][+m.slice(5) - 1];
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos cobrados y costos de los últimos 12 meses">${ticks.map((t) => `<line x1="${pl}" x2="${W}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="${pl - 8}" y="${y(t) + 4}" text-anchor="end" class="ax">${t >= 100000 ? t / 100000 + 'k' : t / 100}</text>`).join('')}
    ${series.map((s, i) => { const x = pl + i * bw + bw * 0.14, w = bw * 0.36; return `<rect x="${x}" y="${y(s.income)}" width="${w}" height="${H - pb - y(s.income)}" rx="3" class="b-in"><title>${mon(s.month)} · cobrado ${fmt(s.income)}</title></rect><rect x="${x + w + 3}" y="${y(s.costs)}" width="${w}" height="${H - pb - y(s.costs)}" rx="3" class="b-co"><title>${mon(s.month)} · costos ${fmt(s.costs)}</title></rect><text x="${pl + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle" class="ax">${mon(s.month)}</text>`; }).join('')}</svg>`;
}
const barRows = (rows, color) => { const max = Math.max(...rows.map((r) => r.v), 1); return `<ul class="bars">${rows.map((r) => `<li><span class="bl">${esc(r.l)}</span><span class="bt"><i style="width:${(r.v / max) * 100}%;background:var(${color})"></i></span><b>${esc(r.t)}</b></li>`).join('')}</ul>`; };

// ---------- vistas ----------
const card = (l, v, sub, tone = '') => `<div class="kpi ${tone}"><span class="tag">${l}</span><b>${v}</b><small>${sub}</small></div>`;
function vResumen() {
  const k = S.kpis;
  const pcount = {}; for (const p of db.projects) pcount[p.status] = (pcount[p.status] || 0) + 1;
  return `<div class="kpis">
    ${card('Clientes activos', k.clientsActive, `${db.prospects.filter((p) => p.week === sundayOf(localDate())).length}/${WEEK_GOAL} prospectos esta semana`)}
    ${card('Proyectos en vivo', k.projectsLive, `${k.projectsOpen} abiertos · ${k.countries} país(es)`)}
    ${card('Cobrado este mes', fmt(k.collectedMonth), `Total histórico ${fmt(k.collectedTotal)}`, 'good')}
    ${card('Costos registrados (mes)', fmt(k.costsMonth), `Resultado del mes ${fmt(k.resultMonth)}`, k.resultMonth < 0 ? 'bad' : '')}
    ${card('Por cobrar', fmt(k.pending), k.overdue ? `${fmt(k.overdue)} vencido` : 'Nada vencido', k.overdue ? 'bad' : '')}
    ${card('Mensualidades (MRR)', fmt(k.mrr), 'Lo que entra cada mes por clientes activos')}
    ${card('Herramientas por mes', fmt(k.toolRunRate), 'Costo recurrente proyectado')}
    ${card('Proyección mensual', fmt(k.projectedMonthly), 'Mensualidades − herramientas', k.projectedMonthly < 0 ? 'bad' : 'good')}</div>
  <div class="two"><section class="panel"><div class="ph"><h2>Ingresos y costos · 12 meses</h2><span class="lg"><i class="in"></i>Cobrado<i class="co"></i>Costos</span></div>${chartMonths(S.series)}</section>
  <section class="panel"><div class="ph"><h2>Proyectos por país</h2></div>${S.byCountry.length ? barRows(S.byCountry.map((c) => ({ l: c.country, v: c.projects, t: `${c.projects} · ${c.live} en vivo` })), '--ecto') : empty('Aún no hay proyectos.')}
  <div class="ph" style="margin-top:1.4rem"><h2>Por estado</h2></div><div class="chips">${L.pstatus.map(([v, l]) => `${pill(`${l} · ${pcount[v] || 0}`, stTone(v))}`).join('')}</div></section></div>
  <div class="two"><section class="panel"><div class="ph"><h2>Costo mensual por categoría</h2></div>${Object.keys(S.byCategory).length && k.toolRunRate ? barRows(Object.entries(S.byCategory).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ l: lab(L.tcat, c), v, t: fmt(v) })), '--aura') : empty('Define el costo mensual de tus herramientas para verlo aquí.')}</section>
  <section class="panel"><div class="ph"><h2>Qué revisar</h2></div>${S.alerts.length ? `<ul class="alerts">${S.alerts.slice(0, 10).map((a) => `<li class="${a.level}">${esc(a.text)}</li>`).join('')}</ul>${S.alerts.length > 10 ? `<p class="muted">y ${S.alerts.length - 10} más…</p>` : ''}` : empty('Todo en orden por ahora.')}</section></div>`;
}

function vClientes() {
  const f = F.clientes; const q = f.q.toLowerCase();
  const rows = S.clientStats.filter((c) => (!f.status || c.status === f.status) && (!f.country || c.country === f.country) && (!q || `${c.name} ${c.city} ${c.contact}`.toLowerCase().includes(q)));
  return `<div class="bar2"><input id="q" type="search" placeholder="Buscar cliente…" value="${esc(f.q)}" aria-label="Buscar"><select data-f="status" aria-label="Estado">${options(L.cstatus, f.status, 'Todos los estados')}</select><select data-f="country" aria-label="País">${options(countriesList().map((c) => [c, c]), f.country, 'Todos los países')}</select><button class="btn primary" data-new="clients">+ Nuevo cliente</button></div>
  ${rows.length ? table([{ h: 'Cliente', f: (c) => `<b>${esc(c.name)}</b><br><small class="muted">${esc(lab(L.industry, c.industry))}</small>` }, { h: 'País', f: (c) => `${esc(c.country)}<br><small class="muted">${esc(c.city || '')}</small>` }, { h: 'Estado', f: (c) => pill(lab(L.cstatus, c.status), stTone(c.status)) },
    { h: 'Proyectos', r: 1, f: (c) => `${c.live} / ${c.projects}` }, { h: 'Mensualidad', r: 1, f: (c) => money(c.mrr_cents) }, { h: 'Cobrado', r: 1, f: (c) => money(c.collected) }, { h: 'Por cobrar', r: 1, f: (c) => money(c.pending) }, { h: 'Costos', r: 1, f: (c) => money(c.direct) }, { h: 'Neto', r: 1, f: (c) => money(c.net) }, { h: '', f: (c) => actions('clients', c.id) }], rows)
  : empty(db.clients.length ? 'Ningún cliente coincide con ese filtro.' : 'Aún no hay clientes.', `<button class="btn primary" data-new="clients">+ Nuevo cliente</button>`)}`;
}

function vProyectos() {
  const f = F.proyectos; const q = f.q.toLowerCase();
  const rows = S.projectStats.filter((p) => (!f.status || p.status === f.status) && (!f.country || p.country === f.country) && (!q || `${p.name} ${p.client} ${p.city}`.toLowerCase().includes(q)));
  return `<div class="bar2"><input id="q" type="search" placeholder="Buscar proyecto o cliente…" value="${esc(f.q)}" aria-label="Buscar"><select data-f="status" aria-label="Estado">${options(L.pstatus, f.status, 'Todos los estados')}</select><select data-f="country" aria-label="País">${options(countriesList().map((c) => [c, c]), f.country, 'Todos los países')}</select><button class="btn primary" data-new="projects">+ Nuevo proyecto</button></div>
  ${rows.length ? table([{ h: 'Proyecto', f: (p) => `<b>${safeUrl(p.live_url) ? `<a href="${safeUrl(p.live_url)}" target="_blank" rel="noopener">${esc(p.name)} ↗</a>` : esc(p.name)}</b><br><small class="muted">${esc(p.client)} · ${esc(lab(L.kind, p.kind))}</small>` }, { h: 'País', f: (p) => `${esc(p.country)}<br><small class="muted">${esc(p.city || '')}</small>` }, { h: 'Estado', f: (p) => pill(lab(L.pstatus, p.status), stTone(p.status)) },
    { h: 'Herramientas', f: (p) => p.tools.length ? `<div class="chips">${p.tools.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : '<small class="muted">Sin asignar</small>' },
    { h: 'Precio', r: 1, f: (p) => money(p.price_cents) }, { h: 'Cobrado', r: 1, f: (p) => money(p.collected) }, { h: 'Por cobrar', r: 1, f: (p) => money(p.pending) }, { h: 'Costos', r: 1, f: (p) => money(p.direct) }, { h: 'Neto', r: 1, f: (p) => money(p.net) }, { h: 'Herram./mes', r: 1, f: (p) => money(p.toolMonthly) }, { h: '', f: (p) => actions('projects', p.id) }], rows)
  : empty(db.projects.length ? 'Ningún proyecto coincide con ese filtro.' : 'Aún no hay proyectos.', `<button class="btn primary" data-new="projects">+ Nuevo proyecto</button>`)}<p class="note">«Neto» = cobrado − costos directos del proyecto. «Herram./mes» es el costo mensual de herramientas repartido entre los proyectos que las usan.</p>`;
}

const markSent = (r) => ({ ...r, status: 'contactado', contacted_on: localDate(), next_action: 'Seguimiento 1 (día 2)', next_on: addDays(localDate(), 2) });
function vProspectos() {
  const f = F.prospectos, cur = sundayOf(localDate()), next = addDays(cur, 7), today = localDate();
  const weeks = [...new Set([next, cur, ...db.prospects.map((p) => p.week)])].sort().reverse(); if (!f.week) f.week = cur;
  const q = f.q.toLowerCase(), all = db.prospects.filter((p) => p.week === f.week);
  const rows = all.filter((p) => (!f.status || p.status === f.status) && (!f.country || p.country === f.country) && (!q || `${p.name} ${p.city} ${p.industry}`.toLowerCase().includes(q))).sort((a, b) => b.score - a.score);
  const cnt = (s) => all.filter((p) => p.status === s).length, sent = db.prospects.filter((p) => p.contacted_on === today).length;
  const queue = db.prospects.filter((p) => p.status === 'demo_lista').sort((a, b) => b.score - a.score).slice(0, Math.max(0, DAILY_GOAL - sent));
  const due = db.prospects.filter((p) => p.next_on && p.next_on <= today && !['ganado', 'descartado'].includes(p.status));
  const needDemo = all.filter((p) => p.status === 'nuevo').sort((a, b) => b.score - a.score).slice(0, 8).length;
  return `<div class="kpis">${card(`Semana del ${f.week}`, `${all.length} / ${WEEK_GOAL}`, all.length >= WEEK_GOAL ? 'Lista completa' : `Faltan ${WEEK_GOAL - all.length} por cargar`)}${card('Demos enviadas hoy', `${sent} / ${DAILY_GOAL}`, sent >= DAILY_GOAL ? 'Meta del día cumplida' : `Faltan ${DAILY_GOAL - sent}`, sent >= DAILY_GOAL ? 'good' : '')}${card('Respondieron', cnt('respondio') + cnt('reunion'), `${cnt('propuesta')} propuestas enviadas`)}${card('Ganados', cnt('ganado'), `${cnt('descartado')} descartados`)}</div>
  <section class="today" aria-label="Envíos de hoy"><h2>Para enviar hoy · ${sent}/${DAILY_GOAL}</h2>${queue.length ? `<ul>${queue.map((p) => `<li><span><b>${esc(p.name)}</b> <small class="muted">${p.score} pts · ${esc(p.country)}${p.city ? ', ' + esc(p.city) : ''} · ${esc(lab(L.channel, p.channel))} ${esc(p.contact || '')}</small></span><span class="acts">${safeUrl(p.demo_url) ? `<a class="btn sm" href="${safeUrl(p.demo_url)}" target="_blank" rel="noopener">Abrir demo ↗</a>` : '<small class="err">Sin enlace de demo</small>'}${p.first_message ? `<button class="btn sm" data-copy="${p.id}">Copiar mensaje</button>` : ''}<button class="btn sm primary" data-sent="${p.id}">Marcar enviado</button></span></li>`).join('')}</ul>` : `<p class="muted">${sent >= DAILY_GOAL ? 'Ya enviaste las 5 de hoy.' : 'No hay demos listas. Pide a Buscapin las demos de los mejores de la lista (usa «→ Buscapin» en cada fila) y pega su resultado.'}</p>`}</section>
  <p class="note"><b>Ritmo:</b> domingo = Cazapin trae 25 · cada día 5 demos enviadas (mayor puntaje primero) · Buscapin hace la demo · Redactín el mensaje y los seguimientos. Hoy hay ${needDemo} prospecto(s) de la semana sin demo entre los mejores. Próxima lista: <b>${next}</b>.</p>
  ${due.length ? `<p class="banner err" role="alert">${due.length} seguimiento(s) vencido(s): ${due.slice(0, 5).map((p) => esc(p.name)).join(', ')}${due.length > 5 ? '…' : ''}</p>` : ''}
  <div class="bar2"><select data-f="week" aria-label="Semana">${options(weeks.map((w) => [w, `Domingo ${w}${w === cur ? ' (esta semana)' : w === next ? ' (próxima)' : ''}`]), f.week)}</select><input id="q" type="search" placeholder="Buscar prospecto…" value="${esc(f.q)}" aria-label="Buscar"><select data-f="status" aria-label="Estado">${options(L.pstat, f.status, 'Todos los estados')}</select><select data-f="country" aria-label="País">${options([...new Set(all.map((p) => p.country))].map((c) => [c, c]), f.country, 'Todos los países')}</select><button class="btn" data-act="pimport">Pegar lista de Cazapin</button><button class="btn" data-act="presult">Pegar resultado de Buscapin / Redactín</button><button class="btn" data-act="pprompt">Copiar pedido para Cazapin</button><button class="btn primary" data-new="prospects">+ Prospecto</button></div>
  ${rows.length ? table([{ h: 'Pts', r: 1, f: (p) => `<b>${p.score}</b>` }, { h: 'Prospecto', f: (p) => `<b>${safeUrl(p.evidence_url) ? `<a href="${safeUrl(p.evidence_url)}" target="_blank" rel="noopener">${esc(p.name)} ↗</a>` : esc(p.name)}</b><br><small class="muted">${esc(lab(L.industry, p.industry))} · ${esc(p.country)}${p.city ? ', ' + esc(p.city) : ''}</small>` },
    { h: 'Contacto', f: (p) => `${esc(lab(L.channel, p.channel))}<br><small class="muted">${esc(p.contact || '')}</small>` }, { h: 'Dolor / oferta', f: (p) => `${esc(p.pain || p.why || '')}${p.offer ? `<br><small class="muted">→ ${esc(p.offer)}</small>` : ''}` },
    { h: 'Demo', f: (p) => safeUrl(p.demo_url) ? `<a href="${safeUrl(p.demo_url)}" target="_blank" rel="noopener">Abrir ↗</a>` : '<small class="muted">—</small>' },
    { h: 'Estado', f: (p) => `<select class="stsel" data-pst="${p.id}" aria-label="Estado de ${esc(p.name)}">${options(L.pstat, p.status)}</select>` }, { h: 'Próximo paso', f: (p) => `${esc(p.next_action || '')}${p.next_on ? `<br><small class="${p.next_on <= today && !['ganado', 'descartado'].includes(p.status) ? 'err' : 'muted'}">${esc(p.next_on)}</small>` : ''}` },
    { h: '', f: (p) => `<div class="acts">${['nuevo', 'demo_lista'].includes(p.status) ? `<button class="btn sm" data-ficha="b:${p.id}">→ Buscapin</button>` : ''}${['nuevo', 'demo_lista', 'contactado', 'respondio'].includes(p.status) ? `<button class="btn sm" data-ficha="r:${p.id}">→ Redactín</button>` : ''}${p.first_message ? `<button class="btn sm" data-copy="${p.id}">Copiar mensaje</button>` : ''}${p.status === 'ganado' && !p.client_id ? `<button class="btn sm primary" data-win="${p.id}">Pasar a cliente</button>` : ''}${actions('prospects', p.id)}</div>` }], rows)
  : empty(all.length ? 'Ningún prospecto coincide con ese filtro.' : `Aún no hay prospectos para la semana del ${f.week}.`, `<button class="btn primary" data-act="pimport">Pegar lista de Cazapin</button>`)}`;
}

function vContenido() {
  const f = F.contenido, cur = localDate().slice(0, 7), nextM = addDays(`${cur}-01`, 32).slice(0, 7), q = f.q.toLowerCase();
  const months = [...new Set([nextM, cur, ...db.content.map((c) => c.publish_on.slice(0, 7))])].sort().reverse();
  const cname = (id) => db.clients.find((c) => c.id === id)?.name || '—';
  const rows = db.content.filter((c) => (!f.client || c.client_id === f.client) && (!f.month || c.publish_on.startsWith(f.month)) && (!f.status || c.status === f.status) && (!q || `${c.title} ${c.copy}`.toLowerCase().includes(q))).sort((a, b) => a.publish_on.localeCompare(b.publish_on));
  const n = (s) => rows.filter((c) => c.status === s).length;
  return `<div class="kpis">${card('Piezas', rows.length, f.month || 'todos los meses')}${card('Por aprobar', n('idea'), 'En estado «Idea»')}${card('Aprobadas', n('aprobado'), 'Listas para publicar')}${card('Publicadas', n('publicado'), rows.length ? `${Math.round((n('publicado') / rows.length) * 100)}% del mes` : '—', n('publicado') && n('publicado') === rows.length ? 'good' : '')}</div>
  <p class="note"><b>Lucho</b> prepara el calendario del mes de cada cliente con manejo de redes: elige el cliente, copia el pedido, pégalo en Lucho y pega aquí su calendario. Define antes la <b>marca y voz</b> del cliente en su ficha (Clientes → Editar).</p>
  <div class="bar2"><select data-f="client" aria-label="Cliente">${options(db.clients.map((c) => [c.id, c.name]), f.client, 'Todos los clientes')}</select><select data-f="month" aria-label="Mes">${options(months.map((m) => [m, m]), f.month, 'Todos los meses')}</select><select data-f="status" aria-label="Estado">${options(L.cstat, f.status, 'Todos los estados')}</select><input id="q" type="search" placeholder="Buscar pieza…" value="${esc(f.q)}" aria-label="Buscar"><button class="btn" data-act="limport">Pegar calendario de Lucho</button><button class="btn" data-act="lprompt">Copiar pedido para Lucho</button><button class="btn primary" data-new="content">+ Pieza</button></div>
  ${rows.length ? table([{ h: 'Fecha', f: (c) => esc(c.publish_on) }, { h: 'Cliente', f: (c) => esc(cname(c.client_id)) }, { h: 'Canal', f: (c) => `${esc(lab(L.cchan, c.channel))}<br><small class="muted">${esc(lab(L.cformat, c.format))}</small>` },
    { h: 'Pieza', f: (c) => `<b>${esc(c.title)}</b>${c.copy ? `<br><small class="muted">${esc(c.copy.length > 140 ? c.copy.slice(0, 140) + '…' : c.copy)}</small>` : ''}${c.visual ? `<br><small class="muted">🎨 ${esc(c.visual.length > 90 ? c.visual.slice(0, 90) + '…' : c.visual)}</small>` : ''}` },
    { h: 'Estado', f: (c) => `<select class="stsel" data-cst="${c.id}" aria-label="Estado de ${esc(c.title)}">${options(L.cstat, c.status)}</select>` },
    { h: '', f: (c) => `<div class="acts">${c.copy ? `<button class="btn sm" data-ccopy="${c.id}">Copiar texto</button>` : ''}${actions('content', c.id)}</div>` }], rows)
  : empty(db.content.length ? 'Ninguna pieza coincide con ese filtro.' : 'Aún no hay contenido. Elige un cliente, copia el pedido para Lucho y pega su calendario.', `<button class="btn primary" data-new="content">+ Pieza</button>`)}`;
}

function vPaises() {
  if (!S.byCountry.length) return empty('Aún no hay proyectos para agrupar por país.', `<button class="btn primary" data-new="projects">+ Nuevo proyecto</button>`);
  return `<div class="cards">${S.byCountry.map((c) => `<article class="panel country"><div class="ph"><h2>${esc(c.country)}</h2>${pill(`${c.live} en vivo`, c.live ? 'ok' : 'mute')}</div>
    <dl><div><dt>Proyectos</dt><dd>${c.projects}</dd></div><div><dt>Clientes</dt><dd>${c.clients}</dd></div><div><dt>Cobrado</dt><dd>${fmt(c.collected)}</dd></div><div><dt>Por cobrar</dt><dd>${fmt(c.pending)}</dd></div><div><dt>Costos</dt><dd>${fmt(c.direct)}</dd></div><div><dt>Neto</dt><dd class="${c.net < 0 ? 'neg' : ''}">${fmt(c.net)}</dd></div></dl>
    <p class="tag">Herramientas más usadas</p><div class="chips">${c.topTools.length ? c.topTools.map((t) => `<span class="chip">${esc(t)}</span>`).join('') : '<small class="muted">Sin datos</small>'}</div>
    <p class="tag" style="margin-top:1rem">Proyectos</p><ul class="plist">${S.projectStats.filter((p) => (p.country || 'Sin país') === c.country).map((p) => `<li>${pill(lab(L.pstatus, p.status), stTone(p.status))} ${esc(p.name)}</li>`).join('')}</ul></article>`).join('')}</div>`;
}

function vHerramientas() {
  const M = toolMatrix(db);
  return `<div class="bar2"><span class="muted">Costo mensual total: <b>${fmt(S.kpis.toolRunRate)}</b></span><button class="btn primary" data-new="tools">+ Nueva herramienta</button></div>
  ${S.toolStats.length ? table([{ h: 'Herramienta', f: (t) => `<b>${esc(t.name)}</b><br><small class="muted">${esc(t.vendor || '')}</small>` }, { h: 'Categoría', f: (t) => esc(lab(L.tcat, t.category)) }, { h: 'Facturación', f: (t) => pill(lab(L.billing, t.billing), t.billing === 'gratis' ? 'mute' : '') },
    { h: 'Costo/mes', r: 1, f: (t) => (t.monthly_cost_cents ? money(t.monthly_cost_cents) : t.billing === 'gratis' ? '<small class="muted">gratis</small>' : '<small class="warnt">definir</small>') }, { h: 'Proyectos', r: 1, f: (t) => (t.idle ? '<small class="warnt">ninguno</small>' : t.projects) }, { h: 'Por proyecto', r: 1, f: (t) => money(t.perProject) }, { h: '', f: (t) => actions('tools', t.id) }], S.toolStats) : empty('Aún no hay herramientas.')}
  <section class="panel" style="margin-top:1.2rem"><div class="ph"><h2>Qué herramienta usa cada proyecto</h2><span class="muted">Toca una celda para asignar o quitar</span></div>
  ${M.projects.length && M.tools.length ? `<div class="tbl"><table class="matrix"><thead><tr><th>Proyecto</th>${M.tools.map((t) => `<th class="r v"><span>${esc(t.name)}</span></th>`).join('')}</tr></thead><tbody>${M.projects.map((p) => `<tr><td><b>${esc(p.name)}</b></td>${M.tools.map((t) => `<td class="r"><button class="cell ${M.has(p.id, t.id) ? 'on' : ''}" data-link="${p.id}|${t.id}" aria-pressed="${M.has(p.id, t.id)}" aria-label="${esc(p.name)} usa ${esc(t.name)}">${M.has(p.id, t.id) ? '●' : ''}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div>` : empty('Necesitas al menos un proyecto y una herramienta.')}</section>`;
}

function vFinanzas() {
  const f = F.finanzas, isInc = f.tab === 'income', rowsAll = db[f.tab].slice().sort((a, b) => b.date.localeCompare(a.date));
  const months = [...new Set(rowsAll.map((r) => r.date.slice(0, 7)))]; const rows = rowsAll.filter((r) => !f.month || r.date.startsWith(f.month));
  const total = rows.reduce((s, r) => s + (isInc ? (r.status === 'cobrado' ? r.amount_cents : 0) : r.amount_cents), 0), pend = isInc ? rows.filter((r) => r.status !== 'cobrado').reduce((s, r) => s + r.amount_cents, 0) : 0;
  const pn = (id) => db.projects.find((p) => p.id === id)?.name || '—';
  return `<div class="bar2"><div class="seg" role="tablist"><button role="tab" aria-selected="${isInc}" data-tab="income">Ingresos</button><button role="tab" aria-selected="${!isInc}" data-tab="costs">Costos</button></div>
  <select data-fm aria-label="Mes">${options(months.map((m) => [m, m]), f.month, 'Todos los meses')}</select><span class="muted">${isInc ? 'Cobrado' : 'Total'}: <b>${fmt(total)}</b>${pend ? ` · Por cobrar: <b>${fmt(pend)}</b>` : ''}</span><button class="btn primary" data-new="${f.tab}">+ ${isInc ? 'Nuevo ingreso' : 'Nuevo costo'}</button></div>
  ${rows.length ? table([{ h: 'Fecha', f: (r) => esc(r.date) }, { h: 'Concepto', f: (r) => `<b>${esc(r.concept)}</b>` }, { h: 'Proyecto', f: (r) => esc(pn(r.project_id)) }, { h: isInc ? 'Tipo' : 'Herramienta', f: (r) => (isInc ? esc(lab(L.ikind, r.kind)) : esc(db.tools.find((t) => t.id === r.tool_id)?.name || lab(L.ckind, r.kind))) },
    ...(isInc ? [{ h: 'Estado', f: (r) => pill(lab(L.istatus, r.status), stTone(r.status)) + (r.status !== 'cobrado' ? ` <button class="btn sm" data-paid="${r.id}">Marcar cobrado</button>` : '') }] : []), { h: 'Monto', r: 1, f: (r) => money(r.amount_cents) }, { h: '', f: (r) => actions(f.tab, r.id) }], rows)
  : empty(isInc ? 'Aún no hay ingresos registrados.' : 'Aún no hay costos registrados.', `<button class="btn primary" data-new="${f.tab}">+ ${isInc ? 'Nuevo ingreso' : 'Nuevo costo'}</button>`)}`;
}

function vAjustes() {
  const raw = readLocalRaw(), localHas = raw && TABLES.some((t) => (raw[t] || []).length);
  return `<div class="two"><section class="panel"><div class="ph"><h2>Dónde viven los datos</h2></div>${store.live
    ? `<p>${pill('Supabase', 'ok')} Los datos están en la base de datos y los ven solo los administradores (Daniel y Juan). Sesión: <b>${esc(D.currentUser() || '')}</b>.</p>${localHas ? `<p class="note">Este navegador guarda datos del modo local (${TABLES.reduce((s, t) => s + (raw[t] || []).length, 0)} filas). Puedes subirlos a Supabase una sola vez.</p><button class="btn" data-act="import">Subir datos locales a Supabase</button>` : ''}`
    : `<p>${pill('Modo local', 'warn')} Los datos están <b>solo en este navegador</b>: Juan no los ve y se pierden si borras los datos del sitio. Sirve para probar. Para compartirlos, hay que conectar Supabase (pasos en <code>CONTEXTO-CLAUDE.md</code> §9 y <code>supabase/control.sql</code>).</p>`}
  <p class="note">La página no está enlazada ni indexada, pero <b>lo que la protege es el inicio de sesión</b> (en modo Supabase). Nunca compartas el enlace con la sesión abierta en un equipo ajeno.</p></section>
  <section class="panel"><div class="ph"><h2>Exportar y respaldar</h2></div><div class="stack"><button class="btn" data-act="json">Descargar todo (JSON)</button><button class="btn" data-act="csv-projects">Proyectos (CSV)</button><button class="btn" data-act="csv-clients">Clientes (CSV)</button><button class="btn" data-act="csv-fin">Ingresos y costos (CSV)</button>
  ${store.live ? '' : `<label class="btn file">Importar respaldo (JSON)<input type="file" accept="application/json" data-import hidden></label><button class="btn danger" data-act="reset">Borrar datos locales</button>`}</div>
  <p class="note">Descarga un respaldo cada semana. Los archivos contienen datos privados de clientes: guárdalos en un lugar seguro, nunca en el repositorio.</p></section></div>`;
}

const VIEWS = { resumen: ['Resumen', vResumen], clientes: ['Clientes', vClientes], proyectos: ['Proyectos', vProyectos], prospectos: ['Prospectos', vProspectos], contenido: ['Contenido', vContenido], paises: ['Países', vPaises], herramientas: ['Herramientas', vHerramientas], finanzas: ['Finanzas', vFinanzas], ajustes: ['Ajustes', vAjustes] };

function shell() {
  if (!VIEWS[view]) view = 'resumen';
  app.innerHTML = `<header class="top"><div class="brand"><span class="tag tag--ecto">33r · privado</span><h1>Control</h1></div><div class="who">${store.live ? `<span class="muted">${esc(D.currentUser() || '')}</span><button class="btn sm" data-act="out">Salir</button>` : pill('Modo local', 'warn')}</div></header>
  ${store.live ? '' : `<p class="banner" role="note"><b>Modo local:</b> los datos viven solo en este navegador y nadie más los ve. Conecta Supabase para compartirlos entre Daniel y Juan.</p>`}
  ${msg ? `<p class="banner err" role="alert">${esc(msg)}</p>` : ''}
  <nav class="tabs" aria-label="Secciones">${Object.entries(VIEWS).map(([k, [l]]) => `<a href="#${k}" ${k === view ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
  <main id="content">${VIEWS[view][1]()}</main><dialog id="dlg"></dialog>`;
}

// ---------- formularios ----------
function openForm(table, id) {
  const sc = SCHEMA[table], row = id ? db[table].find((r) => r.id === id) : null; const dlg = $('#dlg'); const today = localDate();
  const val = (f) => (row ? row[f.k] : f.def === 'today' ? today : f.def === 'week' ? sundayOf(today) : f.def);
  const inputs = sc.fields.map((f) => {
    const v = val(f), req = f.req ? 'required' : ''; let ctl;
    if (f.type === 'check') { if (row || !f.onlyNew) return ''; ctl = `<label class="chk"><input type="checkbox" name="${f.k}" checked>Sí</label>`; }
    else if (f.type === 'int') ctl = `<input name="${f.k}" type="number" min="0" max="100" value="${v ?? ''}">`;
    else if (f.type === 'select') ctl = `<select name="${f.k}" ${req}>${options(f.o(), v ?? '')}</select>`;
    else if (f.type === 'textarea') ctl = `<textarea name="${f.k}" rows="3">${esc(v || '')}</textarea>`;
    else if (f.type === 'money') ctl = `<input name="${f.k}" inputmode="decimal" placeholder="0.00" value="${v ? (v / 100).toFixed(2) : ''}" ${req}>`;
    else if (f.type === 'tools') { const cur = new Set(row ? db.project_tools.filter((l) => l.project_id === row.id).map((l) => l.tool_id) : []); ctl = `<div class="checks">${db.tools.length ? db.tools.map((t) => `<label class="chk"><input type="checkbox" name="_tool" value="${t.id}" ${cur.has(t.id) ? 'checked' : ''}>${esc(t.name)}</label>`).join('') : '<small class="muted">Aún no hay herramientas: créalas en la pestaña Herramientas.</small>'}</div>`; }
    else ctl = `<input name="${f.k}" type="${f.type || 'text'}" value="${esc(v || '')}" ${f.list ? `list="dl-${f.k}"` : ''} ${req}>${f.list ? `<datalist id="dl-${f.k}">${countriesList().map((c) => `<option value="${esc(c)}">`).join('')}</datalist>` : ''}`;
    return `<label class="${f.wide ? 'wide' : ''}"><span>${esc(f.label)}${f.req ? ' *' : ''}</span>${ctl}${f.hint ? `<small class="muted">${esc(f.hint)}</small>` : ''}</label>`;
  }).join('');
  dlg.innerHTML = `<form method="dialog" id="frm" novalidate><div class="ph"><h2>${row ? 'Editar' : 'Nuevo'} · ${sc.title}</h2><button type="button" class="btn sm" data-close>Cerrar</button></div><div class="grid2">${inputs}</div><p class="err" id="ferr" role="alert"></p><div class="row"><button class="btn primary" type="submit">Guardar</button></div></form>`;
  dlg.showModal(); (dlg.querySelector('input,select') || dlg).focus();
  $('[data-close]', dlg).onclick = () => dlg.close();
  $('#frm').onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target), out = { ...(row || {}) }, err = $('#ferr');
    for (const f of sc.fields) { if (f.type === 'tools' || f.type === 'check') continue; let v = fd.get(f.k); v = v == null ? '' : String(v).trim(); if (f.req && !v) { err.textContent = `Falta: ${f.label}`; return; } if (f.type === 'money') { v = toCents(v); if (f.req && !v) { err.textContent = `Pon un monto mayor a 0 en: ${f.label}`; return; } } else if (f.type === 'int') v = v === '' ? 0 : Math.max(0, Math.min(100, Math.round(Number(v)) || 0)); else if (f.type === 'date' || f.type === 'select' && f.k.endsWith('_id')) v = v || null; out[f.k] = v; }
    const isNew = !row; out.id ||= newId(); try { await store.save(table, out); if (table === 'clients' && isNew && fd.get('_proj')) await store.save('projects', { id: newId(), client_id: out.id, name: out.name, country: out.country, city: out.city || '', kind: '', status: 'en_desarrollo', started_on: null, delivered_on: null, price_cents: 0, live_url: '', repo_url: '', notes: '' }); if (table === 'projects') await store.setLinks(out.id, fd.getAll('_tool')); dlg.close(); await refresh(); toast('Guardado'); } catch (x) { err.textContent = fail(x); }
  };
}
const fail = (e) => { const m = String(e.message || e); if (/JWT|auth|401/i.test(m)) { D.signOut(); setTimeout(boot, 0); return 'Tu sesión venció: entra de nuevo.'; } if (/relation .* does not exist|Could not find the table/i.test(m)) return 'Faltan las tablas del panel: ejecuta supabase/control.sql en Supabase.'; return m.slice(0, 200); };

async function copyText(t, ok) { try { await navigator.clipboard.writeText(t); toast(ok); } catch { const d = $('#dlg'); d.innerHTML = `<form method="dialog"><h2>Copia el texto</h2><textarea rows="10" style="width:100%" readonly>${esc(t)}</textarea><div class="row"><button class="btn">Cerrar</button></div></form>`; d.showModal(); d.querySelector('textarea').select(); } }
const COLS = 'negocio | pais | ciudad | rubro | puntaje | por_que | evidencia | canal | contacto | oferta | mensaje';
const cazapinPrompt = () => `Cazapin: prepara la lista semanal de 25 prospectos para la semana del domingo ${addDays(sundayOf(localDate()), 7)}. Mezcla España, Europa, México y Colombia (y otros rubros además de clínicas, según te indiqué). Solo fuentes públicas, con enlace de evidencia de cada dato, puntaje 0-100 de ajuste y primer mensaje listo, sin enviar nada.\n\nFORMATO OBLIGATORIO: entrégala en UN SOLO bloque de código (para copiarlo con un clic), en CSV con encabezado, una fila por prospecto, TODOS los campos entre comillas dobles, sin saltos de línea dentro de los campos y sin ningún texto fuera del bloque. Encabezado exacto:\n${COLS.replace(/ \| /g, ',')}\nrubro debe ser uno de: gastronomia, eventos, retail, salud, entretenimiento, gobierno_tech, distribucion, otro. canal: instagram, whatsapp, email, linkedin, web. puntaje: número entero. Si un dato no existe en fuentes públicas, déjalo vacío (""), nunca lo inventes. Si no te caben las 25, termina el bloque y avísame para pedirte «continúa».`;
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z_ ]/g, '').trim().replace(/ +/g, '_');
const ALIAS = { negocio: 'name', nombre: 'name', empresa: 'name', pais: 'country', ciudad: 'city', rubro: 'industry', puntaje: 'score', puntos: 'score', por_que: 'why', porque: 'why', evidencia: 'evidence_url', enlace: 'evidence_url', canal: 'channel', contacto: 'contact', oferta: 'offer', mensaje: 'first_message', dolor: 'pain', demo: 'demo_url', enlace_demo: 'demo_url', seguimientos: 'followups', cliente: 'client_name', fecha: 'publish_on', formato: 'format', titulo: 'title', copy: 'copy', visual: 'visual', hashtags: 'hashtags', primer_mensaje: 'first_message' };
function parseList(txt, opt = {}) {
  const KEY = opt.key || 'name', HEAD = opt.head || /negocio|nombre|empresa/i;
  const t = txt.trim(); let rows;
  if (t.startsWith('[')) rows = JSON.parse(t).map((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [ALIAS[norm(k)] || norm(k), v])));
  else {
    let lines = t.split(/\r?\n/).filter((l) => l.trim() && !/^\s*```/.test(l) && !/^\s*\|?[\s:|-]+\|?\s*$/.test(l)); const hi = lines.findIndex((l) => HEAD.test(l)); if (hi > 0) lines = lines.slice(hi); if (lines[0] && lines[0].includes('|')) lines = lines.filter((l) => l.includes('|')); if (lines.length < 2) throw new Error('Pega la cabecera y al menos una fila.');
    const sep = lines[0].includes('\t') ? '\t' : lines[0].includes('|') ? '|' : ',';
    const cells = (l) => (sep === ',' ? l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')) : l.split(sep)).map((c) => c.trim()).filter((c, i, a) => sep !== '|' || !((i === 0 || i === a.length - 1) && c === ''));
    const head = cells(lines[0]).map((h) => ALIAS[norm(h)] || norm(h));
    rows = lines.slice(1).map((l) => Object.fromEntries(cells(l).map((c, i) => [head[i], c])));
  }
  return rows.filter((r) => r[KEY]);
}
const langOf = (c) => ({ 'Japón': 'japonés', 'Estados Unidos': 'inglés', Portugal: 'portugués' }[c] || 'español');
const fichaBuscapin = (p) => `Buscapin: prepara la demo para este prospecto (te adjunto sus capturas de Instagram a continuación).\n\nNegocio: ${p.name}\nPaís / ciudad: ${p.country}${p.city ? ' / ' + p.city : ''}\nRubro: ${lab(L.industry, p.industry)}\nCanal / contacto: ${lab(L.channel, p.channel)} ${p.contact || ''}\nPor qué encaja (Cazapin): ${p.why || '—'}\nOferta sugerida: ${p.offer || '—'}\nEvidencia: ${p.evidence_url || '—'}\nIdioma del mensaje: ${langOf(p.country)}\n\nLa demo tiene SOLO 3 partes: «Cómo probarla», «Lo que ve tu cliente» y «Lo que ves tú». Al final entrégame el BLOQUE PARA EL PANEL: un solo bloque de código CSV con el encabezado exacto negocio,pais,dolor,demo,oferta,mensaje (todos los campos entre comillas dobles, sin saltos de línea dentro de los campos); en «demo» pon {enlace} si aún no está publicada.`;
const fichaRedactin = (p) => `Redactín: prepara el acercamiento a este prospecto.\n\nNegocio: ${p.name}\nPaís / ciudad: ${p.country}${p.city ? ' / ' + p.city : ''}\nRubro: ${lab(L.industry, p.industry)}\nCanal / contacto: ${lab(L.channel, p.channel)} ${p.contact || ''}\nDolor detectado: ${p.pain || p.why || '—'}\nOferta: ${p.offer || '—'}\nEnlace de la demo: ${p.demo_url || '[AÚN SIN ENLACE]'}\nIdioma: ${langOf(p.country)}\n\nEntrégame: primer mensaje (corto) y seguimientos a los días 2, 5 y 9. Al final, el BLOQUE PARA EL PANEL: un solo bloque de código CSV con el encabezado exacto negocio,pais,mensaje,seguimientos (todos los campos entre comillas dobles, sin saltos de línea dentro de los campos; separa los seguimientos con « || »).`;
const luchoPrompt = (c) => { const m = F.contenido.month || addDays(`${localDate().slice(0, 7)}-01`, 32).slice(0, 7); return `Lucho: prepara el calendario de contenido de ${m} para este cliente.\n\nCliente: ${c.name}\nRubro: ${lab(L.industry, c.industry)}\nPaís / ciudad: ${c.country}${c.city ? ' / ' + c.city : ''}\nMarca y voz: ${c.brand || '(no definida: pregúntame lo mínimo antes de empezar)'}\nVolumen: 12 piezas (3 por semana), mezcla de formatos.\n\nFORMATO OBLIGATORIO: un solo bloque de código CSV con el encabezado exacto cliente,fecha,canal,formato,titulo,copy,visual,hashtags. En «cliente» repite exactamente: ${c.name}. fecha en formato AAAA-MM-DD dentro de ${m}. canal: instagram, tiktok, facebook, linkedin, whatsapp u otro. formato: post, carrusel, reel, historia u otro. Todos los campos entre comillas dobles, sin saltos de línea dentro de los campos y sin texto fuera del bloque.`; };
function resultForm() {
  const d = $('#dlg');
  d.innerHTML = `<form method="dialog" id="rf" novalidate><div class="ph"><h2>Pegar resultado de Buscapin / Redactín</h2><button type="button" class="btn sm" data-close>Cerrar</button></div><p class="muted">Pega el bloque CSV que te dio el agente. Se busca cada prospecto por <b>negocio + país</b> y se completan sus campos (dolor, demo, oferta, mensaje, seguimientos). Si trae enlace de demo, pasa a «Demo lista».</p><textarea name="t" rows="10" style="width:100%" required></textarea><p class="err" id="ferr" role="alert"></p><div class="row"><button class="btn primary" type="submit">Actualizar prospectos</button></div></form>`;
  d.showModal(); $('[data-close]', d).onclick = () => d.close();
  $('#rf').onsubmit = async (e) => { e.preventDefault(); const err = $('#ferr'); try {
    const list = parseList(new FormData(e.target).get('t')); let n = 0; const miss = [];
    for (const r of list) { const nm = String(r.name).toLowerCase(), ct = String(r.country || '').toLowerCase();
      const p = db.prospects.find((x) => x.name.toLowerCase() === nm && (!ct || x.country.toLowerCase() === ct)) || db.prospects.find((x) => x.name.toLowerCase() === nm);
      if (!p) { miss.push(r.name); continue; }
      const out = { ...p }; for (const k of ['pain', 'offer', 'first_message', 'followups']) if (r[k]) out[k] = String(r[k]);
      if (r.demo_url && /^https?:\/\//i.test(r.demo_url)) { out.demo_url = r.demo_url; if (p.status === 'nuevo') out.status = 'demo_lista'; }
      await store.save('prospects', out); n++; }
    d.close(); await refresh(); toast(`${n} actualizado(s)${miss.length ? ` · sin coincidencia: ${miss.slice(0, 3).join(', ')}` : ''}`); } catch (x) { err.textContent = fail(x); } };
}
function contentForm() {
  const d = $('#dlg'), cl = db.clients.find((c) => c.id === F.contenido.client);
  d.innerHTML = `<form method="dialog" id="cf" novalidate><div class="ph"><h2>Pegar calendario de Lucho</h2><button type="button" class="btn sm" data-close>Cerrar</button></div><p class="muted">Pega el bloque CSV de Lucho (cliente,fecha,canal,formato,titulo,copy,visual,hashtags). Cada pieza entra como «Idea» para que la apruebes.${cl ? ` Si falta el cliente en una fila, se usa <b>${esc(cl.name)}</b>.` : ''}</p><textarea name="t" rows="10" style="width:100%" required></textarea><p class="err" id="ferr" role="alert"></p><div class="row"><button class="btn primary" type="submit">Importar</button></div></form>`;
  d.showModal(); $('[data-close]', d).onclick = () => d.close();
  $('#cf').onsubmit = async (e) => { e.preventDefault(); const err = $('#ferr'); try {
    const list = parseList(new FormData(e.target).get('t'), { key: 'title', head: /titulo|fecha/i }); let n = 0, skip = 0; const seen = new Set(db.content.map((c) => `${c.client_id}|${c.publish_on}|${c.title}`.toLowerCase()));
    for (const r of list) { const c = db.clients.find((x) => x.name.toLowerCase() === String(r.client_name || '').toLowerCase()) || cl; if (!c || !/^\d{4}-\d{2}-\d{2}$/.test(r.publish_on || '')) { skip++; continue; }
      const k = `${c.id}|${r.publish_on}|${r.title}`.toLowerCase(); if (seen.has(k)) { skip++; continue; } seen.add(k);
      const ch = L.cchan.some(([v]) => v === norm(r.channel)) ? norm(r.channel) : 'otro', fm = L.cformat.some(([v]) => v === norm(r.format)) ? norm(r.format) : 'otro';
      await store.save('content', { id: newId(), client_id: c.id, publish_on: r.publish_on, channel: ch, format: fm, title: String(r.title).slice(0, 160), copy: r.copy || '', visual: r.visual || '', hashtags: r.hashtags || '', status: 'idea', notes: '' }); n++; }
    d.close(); await refresh(); toast(`${n} pieza(s) importada(s)${skip ? ` · ${skip} omitida(s) (cliente, fecha o repetidas)` : ''}`); } catch (x) { err.textContent = fail(x); } };
}
function importForm() {
  const d = $('#dlg'); const wk = F.prospectos.week || sundayOf(localDate());
  d.innerHTML = `<form method="dialog" id="pf" novalidate><div class="ph"><h2>Pegar lista de Cazapin</h2><button type="button" class="btn sm" data-close>Cerrar</button></div><p class="muted">Pega la tabla que entrega Cazapin (columnas: <code>${COLS}</code>) o un JSON. Se guardan en la semana del domingo <b>${wk}</b>. Los que ya existen (mismo negocio y país) se omiten.</p><textarea name="t" rows="10" style="width:100%" required></textarea><p class="err" id="ferr" role="alert"></p><div class="row"><button class="btn primary" type="submit">Importar</button></div></form>`;
  d.showModal(); $('[data-close]', d).onclose = null; $('[data-close]', d).onclick = () => d.close();
  $('#pf').onsubmit = async (e) => { e.preventDefault(); const err = $('#ferr'); try {
    const list = parseList(new FormData(e.target).get('t')), seen = new Set(db.prospects.map((p) => `${p.name}|${p.country}`.toLowerCase())); let n = 0;
    for (const r of list) { const k = `${r.name}|${r.country || 'España'}`.toLowerCase(); if (seen.has(k)) continue; seen.add(k); n++;
      const ind = L.industry.some(([v]) => v === norm(r.industry)) ? norm(r.industry) : 'otro', ch = L.channel.some(([v]) => v === norm(r.channel)) ? norm(r.channel) : 'otro';
      await store.save('prospects', { id: newId(), week: wk, name: String(r.name).slice(0, 120), country: r.country || 'España', city: r.city || '', industry: ind, score: Math.max(0, Math.min(100, Math.round(Number(r.score)) || 0)), channel: ch, contact: r.contact || '', evidence_url: /^https?:\/\//i.test(r.evidence_url || '') ? r.evidence_url : '', why: r.why || '', offer: r.offer || '', first_message: r.first_message || '', status: 'nuevo', next_action: '', next_on: null, client_id: null, notes: '' }); }
    d.close(); await refresh(); toast(`${n} prospecto(s) importados${list.length - n ? `, ${list.length - n} repetidos omitidos` : ''}`); } catch (x) { err.textContent = fail(x); } };
}

function confirmBox(text) { return new Promise((res) => { const d = $('#dlg'); d.innerHTML = `<form method="dialog"><h2>${esc(text)}</h2><p class="muted">No se puede deshacer.</p><div class="row"><button class="btn" value="no">Cancelar</button><button class="btn danger" value="yes">Sí, borrar</button></div></form>`; d.showModal(); d.onclose = () => res(d.returnValue === 'yes'); }); }

// ---------- eventos ----------
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-new],[data-edit],[data-del],[data-paid],[data-link],[data-tab],[data-act],[data-copy],[data-win],[data-sent],[data-ficha],[data-ccopy]'); if (!t || !db) return;
  try {
    if (t.dataset.new) return openForm(t.dataset.new);
    if (t.dataset.edit) { const [tb, id] = t.dataset.edit.split(':'); return openForm(tb, id); }
    if (t.dataset.del) { const [tb, id] = t.dataset.del.split(':'); const r = db[tb].find((x) => x.id === id); if (await confirmBox(`¿Borrar «${r.name || r.concept || r.title}»?`)) { await store.remove(tb, id); await refresh(); toast('Borrado'); } return; }
    if (t.dataset.paid) { const r = db.income.find((x) => x.id === t.dataset.paid); await store.save('income', { ...r, status: 'cobrado' }); await refresh(); return toast('Marcado como cobrado'); }
    if (t.dataset.link) { const [p, tl] = t.dataset.link.split('|'); const cur = db.project_tools.filter((l) => l.project_id === p).map((l) => l.tool_id); await store.setLinks(p, cur.includes(tl) ? cur.filter((x) => x !== tl) : [...cur, tl]); return refresh(); }
    if (t.dataset.tab) { F.finanzas.tab = t.dataset.tab; F.finanzas.month = ''; return render(); }
    if (t.dataset.copy) { const r = db.prospects.find((x) => x.id === t.dataset.copy); return copyText(r.first_message, 'Mensaje copiado'); }
    if (t.dataset.sent) { const r = db.prospects.find((x) => x.id === t.dataset.sent); await store.save('prospects', markSent(r)); await refresh(); return toast('Marcado como enviado · seguimiento en 2 días'); }
    if (t.dataset.ccopy) { const r = db.content.find((x) => x.id === t.dataset.ccopy); return copyText([r.copy, r.hashtags].filter(Boolean).join('\n\n'), 'Texto copiado'); }
    if (t.dataset.ficha) { const [w, id] = t.dataset.ficha.split(':'), r = db.prospects.find((x) => x.id === id); return copyText(w === 'b' ? fichaBuscapin(r) : fichaRedactin(r), w === 'b' ? 'Ficha copiada: pégala en Buscapin con las capturas' : 'Ficha copiada: pégala en Redactín'); }
    if (t.dataset.win) { const r = db.prospects.find((x) => x.id === t.dataset.win), cid = newId(); await store.save('clients', { id: cid, name: r.name, country: r.country, city: r.city || '', industry: r.industry || 'otro', status: 'activo', contact: r.contact || '', since: localDate(), mrr_cents: 0, notes: r.why || '' }); await store.save('prospects', { ...r, client_id: cid }); await refresh(); return toast('Ahora es cliente: completa su proyecto'); }
    const a = t.dataset.act;
    if (a === 'pprompt') return copyText(cazapinPrompt(), 'Pedido copiado: pégalo en Cazapin');
    if (a === 'pimport') return importForm();
    if (a === 'presult') return resultForm();
    if (a === 'limport') return contentForm();
    if (a === 'lprompt') { const c = db.clients.find((x) => x.id === F.contenido.client); if (!c) return toast('Elige primero un cliente en el filtro'); return copyText(luchoPrompt(c), 'Pedido copiado: pégalo en Lucho'); }
    if (a === 'out') { D.signOut(); return boot(); }
    if (a === 'json') return downloadFile(`33r-control-${localDate()}.json`, JSON.stringify(db, null, 2), 'application/json');
    if (a === 'csv-projects') return downloadFile(`33r-proyectos-${localDate()}.csv`, toCSV(S.projectStats, [{ label: 'Proyecto', get: (p) => p.name }, { label: 'Cliente', get: (p) => p.client }, { label: 'País', get: (p) => p.country }, { label: 'Ciudad', get: (p) => p.city }, { label: 'Estado', get: (p) => p.status }, { label: 'Herramientas', get: (p) => p.tools.join(' | ') }, { label: 'Precio USD', get: (p) => (p.price_cents / 100).toFixed(2) }, { label: 'Cobrado USD', get: (p) => (p.collected / 100).toFixed(2) }, { label: 'Costos USD', get: (p) => (p.direct / 100).toFixed(2) }, { label: 'Neto USD', get: (p) => (p.net / 100).toFixed(2) }]), 'text/csv');
    if (a === 'csv-clients') return downloadFile(`33r-clientes-${localDate()}.csv`, toCSV(S.clientStats, [{ label: 'Cliente', get: (c) => c.name }, { label: 'País', get: (c) => c.country }, { label: 'Estado', get: (c) => c.status }, { label: 'Proyectos', get: (c) => c.projects }, { label: 'Mensualidad USD', get: (c) => (c.mrr_cents / 100).toFixed(2) }, { label: 'Cobrado USD', get: (c) => (c.collected / 100).toFixed(2) }, { label: 'Por cobrar USD', get: (c) => (c.pending / 100).toFixed(2) }]), 'text/csv');
    if (a === 'csv-fin') { const rows = [...db.income.map((r) => ({ ...r, t: 'ingreso' })), ...db.costs.map((r) => ({ ...r, t: 'costo' }))].sort((x, y) => y.date.localeCompare(x.date)); return downloadFile(`33r-finanzas-${localDate()}.csv`, toCSV(rows, [{ label: 'Fecha', get: (r) => r.date }, { label: 'Tipo', get: (r) => r.t }, { label: 'Concepto', get: (r) => r.concept }, { label: 'Proyecto', get: (r) => db.projects.find((p) => p.id === r.project_id)?.name || '' }, { label: 'Estado', get: (r) => r.status || '' }, { label: 'Monto USD', get: (r) => (r.amount_cents / 100).toFixed(2) }]), 'text/csv'); }
    if (a === 'import') { await store.importAll(readLocalRaw()); await refresh(); return toast('Datos locales subidos a Supabase'); }
    if (a === 'reset') { if (await confirmBox('¿Borrar todos los datos locales de este navegador?')) { await store.reset(false); await refresh(); toast('Datos locales borrados'); } }
  } catch (x) { msg = fail(x); render(); }
});
document.addEventListener('change', async (e) => {
  const cs = e.target.closest('[data-cst]'); if (cs) { try { const r = db.content.find((x) => x.id === cs.dataset.cst); await store.save('content', { ...r, status: cs.value }); await refresh(); } catch (x) { msg = fail(x); render(); } return; }
  const ps = e.target.closest('[data-pst]'); if (ps) { try { const r = db.prospects.find((x) => x.id === ps.dataset.pst); await store.save('prospects', ps.value === 'contactado' && !r.contacted_on ? markSent(r) : { ...r, status: ps.value }); await refresh(); } catch (x) { msg = fail(x); render(); } return; }
  const fl = e.target.closest('[data-f]'); if (fl) { F[view][fl.dataset.f] = fl.value; return render(); }
  if (e.target.matches('[data-fm]')) { F.finanzas.month = e.target.value; return render(); }
  if (e.target.matches('[data-import]')) { try { const data = JSON.parse(await e.target.files[0].text()); if (!data.clients) throw new Error('El archivo no parece un respaldo del panel.'); await store.replaceAll(data); await refresh(); toast('Respaldo importado'); } catch (x) { msg = fail(x); render(); } }
});
document.addEventListener('input', (e) => { if (e.target.id === 'q') { F[view].q = e.target.value; const pos = e.target.selectionStart; render(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); } });
addEventListener('hashchange', () => { view = (location.hash || '#resumen').slice(1); msg = ''; render(); });

function render() { S = summarize(db); shell(); }
async function refresh() { db = await store.load(); msg = ''; render(); }

function login(m = '', email = '') {
  app.innerHTML = `<form class="login" id="lf"><span class="tag tag--ecto">33r · privado</span><h1>Control</h1><label>Correo<input name="email" type="email" autocomplete="username" value="${esc(email)}" required></label><label>Contraseña<input name="pw" type="password" autocomplete="current-password" required></label><p class="err" role="alert">${esc(m)}</p><button class="btn primary">Entrar</button></form>`;
  $('#lf').onsubmit = async (e) => { e.preventDefault(); const f = new FormData(e.target); try { await D.signIn(f.get('email'), f.get('pw')); boot(); } catch { login('Correo o contraseña incorrectos.', String(f.get('email'))); } };
}

async function boot() {
  if (store.live && !D.currentUser()) return login();
  try { db = await store.load(); render(); } catch (x) { const m = fail(x); if (store.live && !D.currentUser()) return login(m); app.innerHTML = `<p class="banner err" role="alert">${esc(m)}</p>`; }
}
boot();
