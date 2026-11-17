// Panel privado. Login real (Supabase Auth); la seguridad la imponen las políticas RLS (tabla `admins`), no este código.
import * as D from '../js/data.js';
import { industries, types, dict } from '../i18n/index.js';
const W = dict.es.work;
const app = document.getElementById('app');
const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const LEAD_STATES = [['nuevo', 'Nuevo'], ['contactado', 'Contactado'], ['demo_enviada', 'Demo enviada'], ['ganado', 'Ganado'], ['perdido', 'Perdido']];
const GOALS = { vender: 'Vender más online', fidelizar: 'Fidelizar', ordenar: 'Ordenar operación', medida: 'A medida' };
let projects = [], leads = [], tab = 'projects';

if (!D.isLive()) {
  app.innerHTML = `<div class="login card"><h1>Panel</h1><p class="muted">Supabase aún no está conectado. Define <code>PUBLIC_SUPABASE_URL</code> y <code>PUBLIC_SUPABASE_ANON_KEY</code> (ver CONTEXTO-CLAUDE.md → «Conectar Supabase») y vuelve a desplegar.</p></div>`;
} else D.currentUser() ? dash() : login();

function login(msg = '') {
  app.innerHTML = `<form class="login card" id="lf"><h1>Panel 33r</h1>
    <label>Correo<input name="email" type="email" autocomplete="username" required></label>
    <label>Contraseña<input name="pw" type="password" autocomplete="current-password" required></label>
    <p class="msg" role="alert">${esc(msg)}</p><button class="btn btn--primary">Entrar</button></form>`;
  document.getElementById('lf').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    try { await D.signIn(f.get('email'), f.get('pw')); dash(); } catch { login('Correo o contraseña incorrectos.'); }
  });
}

async function dash() {
  try { [projects, leads] = await Promise.all([D.adminListProjects(), D.listLeads()]); }
  catch (e) { if (String(e.message).includes('auth') || String(e.message).includes('JWT')) { D.signOut(); return login('Sesión vencida.'); } app.innerHTML = `<p class="msg">${esc(e.message)}</p>`; return; }
  draw();
}

function draw() {
  const newLeads = leads.filter((l) => l.status === 'nuevo').length;
  app.innerHTML = `<div class="bar"><h1>Panel 33r</h1><div class="row"><span class="tag">${esc(D.currentUser())}</span><button class="btn" id="out">Salir</button></div></div>
    <div class="tabs bar"><button class="chip" data-tab="projects" aria-pressed="${tab === 'projects'}">Proyectos (${projects.length})</button><button class="chip" data-tab="leads" aria-pressed="${tab === 'leads'}">Leads (${leads.length}${newLeads ? ` · ${newLeads} nuevos` : ''})</button></div>
    <div id="body">${tab === 'projects' ? projectsView() : leadsView()}</div><dialog id="dlg"></dialog>`;
  document.getElementById('out').onclick = () => { D.signOut(); login(); };
  app.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { tab = b.dataset.tab; draw(); }));
  tab === 'projects' ? bindProjects() : bindLeads();
}

// ---------- Proyectos ----------
function projectsView() {
  return `<div class="bar"><h2>Proyectos</h2><button class="btn btn--primary" id="new">+ Nuevo proyecto</button></div>
  <p class="muted">Un proyecto aparece en la web solo si está <b>publicado</b> y su estado no es «oculto». Los borradores se ven en la web con <code>?preview=1</code>.</p>
  <div class="scroll"><table><thead><tr><th>Orden</th><th></th><th>Cliente</th><th>Industria</th><th>Estado</th><th>Publicación</th><th></th></tr></thead><tbody>
  ${projects.map((p, i) => `<tr data-id="${p.id}"><td class="row"><button class="btn" data-up ${i === 0 ? 'disabled' : ''} aria-label="Subir">↑</button><button class="btn" data-down ${i === projects.length - 1 ? 'disabled' : ''} aria-label="Bajar">↓</button></td>
    <td>${p.cover_url ? `<img class="thumb" src="${esc(p.cover_url)}" alt="">` : ''}</td><td><b>${esc(p.client)}</b><br><span class="tag">/${esc(p.slug)}</span></td><td>${esc(W.industries[p.industry] || '')}</td><td>${esc(p.status)}</td>
    <td class="${p.published ? 'st-pub' : 'st-borrador'}">${p.published ? 'Publicado' : 'Borrador'}</td>
    <td class="row"><button class="btn" data-pub>${p.published ? 'Ocultar' : 'Publicar'}</button><button class="btn" data-edit>Editar</button><button class="btn" data-del>Borrar</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Sin proyectos todavía.</td></tr>'}
  </tbody></table></div>`;
}
function bindProjects() {
  document.getElementById('new').onclick = () => editor(null);
  app.querySelectorAll('tr[data-id]').forEach((tr) => {
    const p = projects.find((x) => x.id === tr.dataset.id), i = projects.indexOf(p);
    tr.querySelector('[data-edit]').onclick = () => editor(p);
    tr.querySelector('[data-pub]').onclick = async () => { await D.saveProject({ id: p.id, published: !p.published }); dash(); };
    tr.querySelector('[data-del]').onclick = async () => { if (confirm(`¿Borrar «${p.client}»? No se puede deshacer.`)) { await D.deleteProject(p.id); dash(); } };
    const swap = async (j) => { const q = projects[j]; await Promise.all([D.saveProject({ id: p.id, sort_order: q.sort_order }), D.saveProject({ id: q.id, sort_order: p.sort_order })]); dash(); };
    tr.querySelector('[data-up]').onclick = () => swap(i - 1); tr.querySelector('[data-down]').onclick = () => swap(i + 1);
  });
}
function editor(p) {
  const v = p || { industry: 'gastronomia', status: 'caso_de_estudio', published: false, featured: false, solution_types: [], mechanics: [], metrics: [], screens: {}, en: {}, sort_order: (projects.at(-1)?.sort_order ?? 0) + 1, year: new Date().getFullYear(), country: 'Ecuador' };
  const dlg = document.getElementById('dlg'); const en = v.en || {};
  const up = (name, label, val) => `<label class="full">${label}<input name="${name}" value="${esc(val || '')}" placeholder="URL (o sube un archivo abajo)"><input type="file" data-up="${name}" accept="${name === 'video_url' ? 'video/*' : 'image/*'}"></label>`;
  dlg.innerHTML = `<form id="pf"><div class="bar"><h2>${p ? 'Editar' : 'Nuevo'} proyecto</h2><button type="button" class="btn" id="x">Cerrar</button></div><div class="grid2">
    <label>Cliente / nombre<input name="client" required value="${esc(v.client)}"></label>
    <label>Slug (URL)<input name="slug" pattern="[a-z0-9-]+" value="${esc(v.slug)}" placeholder="se genera del nombre"></label>
    <label>Industria<select name="industry">${industries.map((k) => `<option value="${k}" ${v.industry === k ? 'selected' : ''}>${W.industries[k]}</option>`).join('')}</select></label>
    <label>Relación<select name="kind">${[['cliente', 'Cliente'], ['demo', 'Demo funcional'], ['propio', 'Marca propia']].map(([k, l]) => `<option value="${k}" ${(v.kind || 'cliente') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label>Estado<select name="status">${[['en_vivo', 'En vivo'], ['caso_de_estudio', 'Caso de estudio'], ['oculto', 'Oculto']].map(([k, l]) => `<option value="${k}" ${v.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <fieldset class="full"><legend>Tipos de solución</legend>${types.map((k) => `<label class="chk"><input type="checkbox" name="st" value="${k}" ${v.solution_types?.includes(k) ? 'checked' : ''}>${W.types[k]}</label>`).join('')}</fieldset>
    <label>País<input name="country" value="${esc(v.country)}"></label><label>Ciudad<input name="city" value="${esc(v.city)}"></label>
    <label>Año<input name="year" type="number" value="${esc(v.year)}"></label><label>Link en vivo<input name="live_url" type="url" value="${esc(v.live_url)}" placeholder="https://…"></label>
    ${up('cover_url', 'Captura de portada', v.cover_url)}${up('video_url', 'Video corto (opcional, mp4 comprimido)', v.video_url)}
    ${up('screen_sell', 'Pantalla que vende (caso de estudio)', v.screens?.sell)}${up('screen_control', 'Pantalla que controla (caso de estudio)', v.screens?.control)}
    <label class="full">Mecánica estrella<input name="star_mechanic" value="${esc(v.star_mechanic)}"></label>
    <label class="full">Cliente objetivo<textarea name="target_client">${esc(v.target_client)}</textarea></label>
    <label class="full">Reto<textarea name="challenge">${esc(v.challenge)}</textarea></label>
    <label class="full">Solución / idea<textarea name="solution">${esc(v.solution)}</textarea></label>
    <label class="full">Mecánicas (una por línea)<textarea name="mechanics">${esc((v.mechanics || []).join('\n'))}</textarea></label>
    <label class="full">Métricas (una por línea: «Etiqueta | Valor»)<textarea name="metrics">${esc((v.metrics || []).map((m) => `${m.label} | ${m.value}`).join('\n'))}</textarea></label>
    <label class="full">Resultados (texto)<textarea name="results">${esc(v.results)}</textarea></label>
    <p class="tag full">Traducción al inglés (opcional)</p>
    ${['star_mechanic', 'target_client', 'challenge', 'solution', 'results'].map((k) => `<label class="full">EN · ${k}<textarea name="en_${k}">${esc(en[k])}</textarea></label>`).join('')}
    <label>Orden<input name="sort_order" type="number" value="${esc(v.sort_order)}"></label>
    <div class="row full"><label class="chk"><input type="checkbox" name="published" ${v.published ? 'checked' : ''}>Publicado (visible en la web)</label><label class="chk"><input type="checkbox" name="featured" ${v.featured ? 'checked' : ''}>Destacado</label></div>
    </div><p class="msg" id="pmsg" role="alert"></p><div class="row"><button class="btn btn--primary" type="submit">Guardar</button></div></form>`;
  dlg.showModal(); dlg.querySelector('#x').onclick = () => dlg.close();
  const f = dlg.querySelector('#pf'), msg = dlg.querySelector('#pmsg');
  f.querySelectorAll('[data-up]').forEach((inp) => (inp.onchange = async () => {
    const file = inp.files[0]; if (!file) return; msg.className = 'okmsg'; msg.textContent = 'Subiendo…';
    try { f.elements[inp.dataset.up].value = await D.uploadMedia(file, slugify(f.elements.client.value) || 'misc'); msg.textContent = 'Archivo subido ✓'; } catch (e) { msg.className = 'msg'; msg.textContent = 'No se pudo subir: ' + e.message; }
  }));
  f.onsubmit = async (e) => {
    e.preventDefault(); const g = (n) => f.elements[n].value.trim(); const lines = (n) => g(n).split('\n').map((s) => s.trim()).filter(Boolean);
    const row = {
      ...(p ? { id: p.id } : {}), client: g('client'), slug: g('slug') || slugify(g('client')), industry: g('industry'), status: g('status'), kind: g('kind'),
      solution_types: [...f.querySelectorAll('[name=st]:checked')].map((x) => x.value), country: g('country'), city: g('city'), year: Number(g('year')) || null, live_url: g('live_url'),
      cover_url: g('cover_url'), video_url: g('video_url'), screens: { sell: g('screen_sell'), control: g('screen_control') },
      star_mechanic: g('star_mechanic'), target_client: g('target_client'), challenge: g('challenge'), solution: g('solution'), results: g('results'),
      mechanics: lines('mechanics'), metrics: lines('metrics').map((l) => { const [label, ...r] = l.split('|'); return { label: label.trim(), value: r.join('|').trim() }; }),
      en: Object.fromEntries(['star_mechanic', 'target_client', 'challenge', 'solution', 'results'].map((k) => [k, g('en_' + k)]).filter(([, x]) => x)),
      sort_order: Number(g('sort_order')) || 100, published: f.elements.published.checked, featured: f.elements.featured.checked,
    };
    try { await D.saveProject(row); dlg.close(); dash(); } catch (er) { msg.className = 'msg'; msg.textContent = 'Error: ' + er.message; }
  };
}

// ---------- Leads ----------
function leadsView() {
  return `<div class="bar"><h2>Solicitudes de demo</h2></div><div class="scroll"><table><thead><tr><th>Fecha</th><th>Nombre / negocio</th><th>Objetivo</th><th>País</th><th>WhatsApp</th><th>Estado</th><th>Notas</th></tr></thead><tbody>
  ${leads.map((l) => `<tr data-id="${l.id}"><td>${new Date(l.created_at).toLocaleDateString('es-EC')}</td><td><b>${esc(l.name)}</b><br>${esc(l.business)}${l.link ? `<br><span class="tag">${esc(l.link)}</span>` : ''}</td><td>${esc(GOALS[l.goal] || l.goal)}</td><td>${esc(l.country)}</td>
    <td><a href="https://wa.me/${esc(l.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener">${esc(l.whatsapp)}</a></td>
    <td><select data-st>${LEAD_STATES.map(([k, t]) => `<option value="${k}" ${l.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select></td><td><input data-notes value="${esc(l.notes || '')}" placeholder="Notas"></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Aún no hay solicitudes.</td></tr>'}
  </tbody></table></div>`;
}
function bindLeads() {
  app.querySelectorAll('tr[data-id]').forEach((tr) => {
    const id = tr.dataset.id;
    tr.querySelector('[data-st]').onchange = (e) => D.updateLead(id, { status: e.target.value });
    tr.querySelector('[data-notes]').onchange = (e) => D.updateLead(id, { notes: e.target.value });
  });
}
