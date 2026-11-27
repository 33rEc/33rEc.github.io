// Prueba los cálculos del panel con números conocidos. Uso: node scripts/test-control-calc.mjs
import assert from 'node:assert/strict';
import { summarize, toCents, fmt, addMonths, toCSV } from '../src/scripts/control/calc.js';
const db = {
  clients: [{ id: 'c1', name: 'Cafe', status: 'activo', mrr_cents: 2000 }, { id: 'c2', name: 'Clínica', status: 'activo', mrr_cents: 0 }, { id: 'c3', name: 'Futuro', status: 'prospecto', mrr_cents: 0 }],
  projects: [
    { id: 'p1', client_id: 'c1', name: 'Café web', country: 'Ecuador', status: 'en_vivo', price_cents: 50000 },
    { id: 'p2', client_id: 'c2', name: 'Clínica panel', country: 'España', status: 'en_vivo', price_cents: 50000 },
    { id: 'p3', client_id: 'c2', name: 'Viejo', country: 'España', status: 'cerrado', price_cents: 10000 }],
  tools: [{ id: 't1', name: 'Supabase', category: 'backend', billing: 'mensual', monthly_cost_cents: 2500 }, { id: 't2', name: 'Vercel', category: 'hosting', billing: 'mensual', monthly_cost_cents: 2000 }, { id: 't3', name: 'GA4', category: 'analitica', billing: 'gratis', monthly_cost_cents: 0 }, { id: 't4', name: 'Sin uso', category: 'otro', billing: 'mensual', monthly_cost_cents: 500 }],
  project_tools: [{ project_id: 'p1', tool_id: 't1' }, { project_id: 'p2', tool_id: 't1' }, { project_id: 'p3', tool_id: 't1' }, { project_id: 'p1', tool_id: 't2' }],
  income: [
    { project_id: 'p1', client_id: 'c1', date: '2026-11-05', amount_cents: 15000, status: 'cobrado', concept: 'Anticipo' },
    { project_id: 'p1', client_id: 'c1', date: '2026-11-20', amount_cents: 35000, status: 'cobrado', concept: 'Saldo' },
    { project_id: 'p2', client_id: 'c2', date: '2026-10-10', amount_cents: 15000, status: 'cobrado', concept: 'Anticipo' },
    { project_id: 'p2', client_id: 'c2', date: '2026-11-01', amount_cents: 35000, status: 'pendiente', concept: 'Saldo' }],
  costs: [{ project_id: 'p1', date: '2026-11-03', amount_cents: 4000, concept: 'Dominio' }, { project_id: 'p2', date: '2026-10-12', amount_cents: 1000, concept: 'Licencia' }, { date: '2026-11-15', amount_cents: 2500, concept: 'Supabase' }],
};
const S = summarize(db, new Date(2026, 10, 27));   // 27-nov-2026
const k = S.kpis;
assert.equal(k.clientsActive, 2); assert.equal(k.prospects, 1); assert.equal(k.projectsLive, 2); assert.equal(k.projectsOpen, 2); assert.equal(k.countries, 2);
assert.equal(k.collectedTotal, 65000); assert.equal(k.collectedMonth, 50000); assert.equal(k.costsMonth, 6500); assert.equal(k.resultMonth, 43500);
assert.equal(k.pending, 35000); assert.equal(k.overdue, 35000, 'el cobro del 1-nov ya venció');
assert.equal(k.mrr, 2000); assert.equal(k.toolRunRate, 5000); assert.equal(k.projectedMonthly, -3000);
assert.equal(k.committed, 110000);
// prorrateo: Supabase 2500 entre p1 y p2 (p3 está cerrado) = 1250 c/u; Vercel 2000 solo p1 → p1 = 3250
const p1 = S.projectStats.find((p) => p.id === 'p1'), p2 = S.projectStats.find((p) => p.id === 'p2');
assert.equal(p1.toolMonthly, 3250); assert.equal(p2.toolMonthly, 1250);
assert.equal(p1.collected, 50000); assert.equal(p1.direct, 4000); assert.equal(p1.net, 46000); assert.equal(p1.owed, 0);
assert.equal(p2.pending, 35000); assert.equal(p2.owed, 0);
const es = S.byCountry.find((c) => c.country === 'España'); assert.equal(es.projects, 2); assert.equal(es.live, 1); assert.equal(es.clients, 1); assert.equal(es.collected, 15000);
assert.equal(S.series.length, 12); assert.equal(S.series[11].month, '2026-11'); assert.equal(S.series[10].income, 15000); assert.equal(S.series[10].costs, 1000);
assert.ok(S.toolStats.find((t) => t.id === 't4').idle); assert.equal(S.toolStats.find((t) => t.id === 't1').perProject, 1250);
assert.equal(S.byCategory.backend, 2500);
const txt = S.alerts.map((a) => a.text).join('|'); assert.ok(txt.includes('Cobro vencido')); assert.ok(txt.includes('En vivo sin mensualidad del cliente (1): «Clínica panel»')); assert.ok(txt.includes('Herramientas sin proyecto asignado (1): «Sin uso»'));
assert.equal(S.alerts.filter((a) => a.text.startsWith('En vivo sin mensualidad')).length, 1, 'se agrupan en una sola alerta');
assert.equal(toCents('12,50'), 1250); assert.equal(toCents('9.9'), 990); assert.equal(toCents(''), 0); assert.equal(addMonths('2026-01', -2), '2025-11');
assert.ok(fmt(123456).includes('1234,56') || fmt(123456).includes('1.234,56') || fmt(123456).includes('1,234.56'));
assert.equal(toCSV([{ a: 'x,y', b: 2 }], [{ label: 'A', get: (r) => r.a }, { label: 'B', get: (r) => r.b }]), 'A,B\n"x,y",2');
// base vacía no debe romper
const E = summarize({}); assert.equal(E.kpis.collectedTotal, 0); assert.equal(E.byCountry.length, 0);
console.log('✓ control/calc: todas las comprobaciones pasan');
