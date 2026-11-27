// CÁLCULOS DEL PANEL DE CONTROL. Funciones puras (sin DOM ni red): se prueban con scripts/test-control-calc.mjs.
// Todo el dinero va en CENTAVOS enteros (USD). Fechas 'YYYY-MM-DD'.
//
// Criterios (importan para leer bien los números):
//  · «Cobrado» = ingresos con status 'cobrado'; «por cobrar» = 'pendiente'; «vencido» = pendiente con fecha pasada.
//  · «Costos registrados» = lo que se anotó en el libro de costos (gastos reales).
//  · «Costo mensual de herramientas» = tools.monthly_cost_cents (presupuesto/proyección, NO se suma a los costos registrados: evita contar dos veces).
//  · Prorrateo: el costo mensual de una herramienta se reparte en partes iguales entre los proyectos NO cerrados que la usan.
//  · Neto de un proyecto = cobrado − costos directos registrados a ese proyecto.
const n = (v) => Number(v) || 0;
const by = (arr, key) => { const m = new Map(); for (const x of arr) m.set(x[key], x); return m; };
const pad = (v) => String(v).padStart(2, '0');
export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (s) => String(s || '').slice(0, 7);
export const addMonths = (key, k) => { const [y, m] = key.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
export const fmt = (cents, cur = 'USD', locale = 'es-EC') => new Intl.NumberFormat(locale, { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n(cents) / 100);
export const toCents = (v) => Math.round(parseFloat(String(v).replace(',', '.')) * 100) || 0;

export function summarize(db, now = new Date()) {
  const clients = db.clients || [], projects = db.projects || [], tools = db.tools || [], links = db.project_tools || [], income = db.income || [], costs = db.costs || [];
  const today = localDate(now), thisMonth = monthKey(today);
  const projById = by(projects, 'id'), toolById = by(tools, 'id'), clientById = by(clients, 'id');
  const open = (p) => p && p.status !== 'cerrado';

  // herramientas ↔ proyectos
  const toolProjects = new Map(), projectTools = new Map();
  for (const l of links) {
    const p = projById.get(l.project_id), t = toolById.get(l.tool_id); if (!p || !t) continue;
    if (!projectTools.has(p.id)) projectTools.set(p.id, []); projectTools.get(p.id).push(t.id);
    if (open(p)) { if (!toolProjects.has(t.id)) toolProjects.set(t.id, new Set()); toolProjects.get(t.id).add(p.id); }
  }
  const toolMonthlyFor = (pid) => (projectTools.get(pid) || []).reduce((s, tid) => { const set = toolProjects.get(tid); return s + (set && set.has(pid) ? n(toolById.get(tid).monthly_cost_cents) / set.size : 0); }, 0);

  // ingresos y costos por proyecto
  const collectedBy = {}, pendingBy = {}, directBy = {};
  for (const i of income) { const k = i.project_id || '_'; if (i.status === 'cobrado') collectedBy[k] = n(collectedBy[k]) + n(i.amount_cents); else pendingBy[k] = n(pendingBy[k]) + n(i.amount_cents); }
  for (const c of costs) { const k = c.project_id || '_'; directBy[k] = n(directBy[k]) + n(c.amount_cents); }

  const projectStats = projects.map((p) => {
    const collected = n(collectedBy[p.id]), pending = n(pendingBy[p.id]), direct = n(directBy[p.id]);
    return { ...p, client: clientById.get(p.client_id)?.name || '—', tools: (projectTools.get(p.id) || []).map((id) => toolById.get(id).name),
      collected, pending, direct, net: collected - direct, toolMonthly: Math.round(toolMonthlyFor(p.id)), owed: Math.max(0, n(p.price_cents) - collected - pending) };
  });
  const clientStats = clients.map((c) => {
    const ps = projectStats.filter((p) => p.client_id === c.id); const direct = ps.reduce((s, p) => s + p.direct, 0);
    const collected = income.filter((i) => i.status === 'cobrado' && (i.client_id === c.id || ps.some((p) => p.id === i.project_id))).reduce((s, i) => s + n(i.amount_cents), 0);
    const pend = income.filter((i) => i.status !== 'cobrado' && (i.client_id === c.id || ps.some((p) => p.id === i.project_id))).reduce((s, i) => s + n(i.amount_cents), 0);
    return { ...c, projects: ps.length, live: ps.filter((p) => p.status === 'en_vivo').length, collected, pending: pend, direct, net: collected - direct };
  });

  // series de 12 meses
  const months = Array.from({ length: 12 }, (_, i) => addMonths(thisMonth, i - 11));
  const series = months.map((m) => ({ month: m,
    income: income.filter((i) => i.status === 'cobrado' && monthKey(i.date) === m).reduce((s, i) => s + n(i.amount_cents), 0),
    costs: costs.filter((c) => monthKey(c.date) === m).reduce((s, c) => s + n(c.amount_cents), 0) }));

  // países
  const countries = {};
  for (const p of projectStats) {
    const k = p.country || 'Sin país'; const c = (countries[k] ||= { country: k, projects: 0, live: 0, clients: new Set(), collected: 0, pending: 0, direct: 0, toolCount: {} });
    c.projects++; if (p.status === 'en_vivo') c.live++; if (p.client_id) c.clients.add(p.client_id); c.collected += p.collected; c.pending += p.pending; c.direct += p.direct;
    for (const t of p.tools) c.toolCount[t] = (c.toolCount[t] || 0) + 1;
  }
  const byCountry = Object.values(countries).map((c) => ({ ...c, clients: c.clients.size, net: c.collected - c.direct, topTools: Object.entries(c.toolCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t, k]) => `${t} (${k})`) })).sort((a, b) => b.projects - a.projects);

  // herramientas
  const toolStats = tools.map((t) => { const set = toolProjects.get(t.id) || new Set(); return { ...t, projects: set.size, perProject: set.size ? Math.round(n(t.monthly_cost_cents) / set.size) : 0, idle: set.size === 0 }; });
  const byCategory = {}; for (const t of toolStats) byCategory[t.category || 'otro'] = n(byCategory[t.category || 'otro']) + n(t.monthly_cost_cents);

  // totales
  const collectedTotal = income.filter((i) => i.status === 'cobrado').reduce((s, i) => s + n(i.amount_cents), 0);
  const pendingList = income.filter((i) => i.status !== 'cobrado');
  const mrr = clients.filter((c) => c.status === 'activo').reduce((s, c) => s + n(c.mrr_cents), 0);
  const toolRunRate = tools.reduce((s, t) => s + n(t.monthly_cost_cents), 0);
  const cur = series[series.length - 1];
  const kpis = {
    clientsActive: clients.filter((c) => c.status === 'activo').length, prospects: clients.filter((c) => c.status === 'prospecto').length,
    projectsLive: projects.filter((p) => p.status === 'en_vivo').length, projectsOpen: projects.filter(open).length, countries: byCountry.filter((c) => c.country !== 'Sin país').length,
    collectedTotal, collectedMonth: cur.income, costsMonth: cur.costs, resultMonth: cur.income - cur.costs,
    pending: pendingList.reduce((s, i) => s + n(i.amount_cents), 0), overdue: pendingList.filter((i) => i.date < today).reduce((s, i) => s + n(i.amount_cents), 0),
    mrr, toolRunRate, projectedMonthly: mrr - toolRunRate,
    committed: projects.reduce((s, p) => s + n(p.price_cents), 0),
  };

  // alertas accionables (las repetitivas se agrupan en una sola línea)
  const alerts = [];
  const names = (arr, f = (x) => x.name) => { const l = arr.map((x) => `«${f(x)}»`); return l.length > 3 ? `${l.slice(0, 3).join(', ')} y ${l.length - 3} más` : l.join(', '); };
  const group = (arr, lead, f) => { if (arr.length) alerts.push({ level: 'info', text: `${lead} (${arr.length}): ${names(arr, f)}` }); };
  for (const i of pendingList.filter((x) => x.date < today)) alerts.push({ level: 'warn', text: `Cobro vencido: ${i.concept} · ${fmt(i.amount_cents)} (${i.date})` });
  for (const p of projectStats.filter((p) => p.owed > 0 && open(p) && p.price_cents)) alerts.push({ level: 'warn', text: `«${p.name}»: faltan ${fmt(p.owed)} por registrar de ${fmt(p.price_cents)} acordados` });
  group(projectStats.filter((p) => p.status === 'en_vivo' && !(clientById.get(p.client_id)?.mrr_cents > 0)), 'En vivo sin mensualidad del cliente', (p) => p.name);
  group(toolStats.filter((t) => t.idle && t.billing !== 'gratis'), 'Herramientas sin proyecto asignado', (t) => t.name);
  group(toolStats.filter((t) => t.billing !== 'gratis' && !t.monthly_cost_cents), 'Herramientas sin costo mensual definido', (t) => t.name);
  group(projectStats.filter((p) => open(p) && !p.tools.length), 'Proyectos sin herramientas asignadas', (p) => p.name);
  group(clientStats.filter((c) => c.status === 'activo' && !c.projects), 'Clientes activos sin proyectos', (c) => c.name);

  return { kpis, series, byCountry, projectStats, clientStats, toolStats, byCategory, alerts };
}

/** Matriz proyecto × herramienta para la vista de herramientas. */
export function toolMatrix(db) {
  const set = new Set((db.project_tools || []).map((l) => `${l.project_id}|${l.tool_id}`));
  return { projects: (db.projects || []).filter((p) => p.status !== 'cerrado'), tools: db.tools || [], has: (p, t) => set.has(`${p}|${t}`) };
}

export function toCSV(rows, cols) {
  const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.map((c) => esc(c.label)).join(','), ...rows.map((r) => cols.map((c) => esc(c.get(r))).join(','))].join('\n');
}
