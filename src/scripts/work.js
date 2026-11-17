// Portafolio: se pinta desde la capa de datos (seed o Supabase). Filtros por industria y tipo.
import { getProjects, loc } from '../js/data.js';
import { track } from './analytics.js';
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function initWork() {
  const root = document.querySelector('[data-work]'); if (!root) return;
  const L = JSON.parse(root.dataset.labels), lang = root.dataset.lang, base = root.dataset.base;
  const grid = root.querySelector('[data-grid]'), empty = root.querySelector('[data-empty]'), status = root.querySelector('[data-status]');
  const preview = new URLSearchParams(location.search).has('preview');
  let all = []; const f = { industry: '', type: '' };
  try { all = await getProjects({ drafts: preview }); } catch (e) { console.warn('[work]', e); }

  const card = (p) => {
    const live = p.status === 'en_vivo', demo = p.kind === 'demo';
    const name = esc(p.client), href = `${base}${esc(p.slug)}${preview ? '?preview=1' : ''}`;
    const cover = p.cover_url ? `<img src="${esc(p.cover_url)}" alt="${name}" loading="lazy" decoding="async">` : `<span class="pcard__ph" aria-hidden="true">${esc(p.client[0])}</span>`;
    const vid = p.video_url ? `<video muted loop playsinline preload="none" data-src="${esc(p.video_url)}" aria-hidden="true"></video>` : '';
    const res = (p.metrics?.[0] ? `${esc(p.metrics[0].value)} ${esc(p.metrics[0].label)}` : '') || esc(loc(p, 'results', lang));
    const types = (p.solution_types || []).map((k) => L.types[k]).filter(Boolean).join(' · ');
    const sig = loc(p, 'signature', lang);
    return `<article class="card pcard" data-slug="${esc(p.slug)}" style="--accent:${esc(p.accent || '')}">
      <div class="pcard__shot">${cover}${vid}
        ${sig ? `<div class="pcard__sig"><i aria-hidden="true">✦</i><span><b>${esc(sig)}</b></span></div>` : ''}
        <div class="pcard__badges"><span class="badge ${live ? 'badge--live' : ''}">${live ? L.live : L.study}</span>${demo ? `<span class="badge">${L.demoKind}</span>` : ''}${p.published ? '' : `<span class="badge badge--draft">${L.draft}</span>`}</div>
      </div>
      <div class="pcard__body">
        <div class="pcard__meta"><span class="tag tag--ecto">${esc(L.industries[p.industry] || '')}</span><span class="tag">${esc(types)}</span></div>
        <h3>${name}</h3>
        <p class="pcard__star"><b>${L.star}:</b> ${esc(loc(p, 'star_mechanic', lang))}</p>
        ${res ? `<p class="pcard__res"><b>${L.result}:</b> ${res}</p>` : ''}
        <div class="pcard__foot"><a class="btn" href="${href}" data-case="${esc(p.slug)}">${L.open}</a>${p.live_url ? `<a class="btn btn--primary" href="${esc(p.live_url)}" target="_blank" rel="noopener" data-track="live_site_click">${demo ? L.visitDemo : L.visit} ↗</a>` : ''}</div>
      </div></article>`;
  };

  const render = () => {
    const list = all.filter((p) => (!f.industry || p.industry === f.industry) && (!f.type || (p.solution_types || []).includes(f.type)));
    grid.innerHTML = list.map(card).join('');
    const none = all.length === 0; empty.hidden = !none;
    status.textContent = !none && list.length === 0 ? L.noMatch : ''; status.hidden = !status.textContent;
    root.querySelectorAll('[data-industry]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.industry === f.industry)));
    root.querySelectorAll('[data-type]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.type === f.type)));
  };
  root.addEventListener('click', (e) => {
    const bi = e.target.closest('[data-industry]'), bt = e.target.closest('[data-type]'), c = e.target.closest('[data-case]');
    if (bi) { f.industry = bi.dataset.industry; track('filter_change', { industry: f.industry }); render(); }
    if (bt) { f.type = bt.dataset.type; track('filter_change', { type: f.type }); render(); }
    if (c) track('case_open', { slug: c.dataset.case });
  });
  addEventListener('work:filter', (e) => { f.industry = e.detail.industry; f.type = ''; render(); });
  // video corto en loop solo al pasar el cursor (carga diferida)
  grid.addEventListener('pointerenter', (e) => {
    const v = e.target.querySelector?.('video[data-src]'); if (!v) return;
    if (!v.src) v.src = v.dataset.src; v.classList.add('on'); v.play().catch(() => {});
  }, true);
  grid.addEventListener('pointerleave', (e) => { const v = e.target.querySelector?.('video.on'); if (v) { v.pause(); v.classList.remove('on'); } }, true);
  if (window.__pf !== undefined) { f.industry = window.__pf; window.__pf = undefined; }
  render();

  // Sección «Hecho a medida»: el rasgo único de cada proyecto (mismos datos que el portafolio)
  const sigRoot = document.querySelector('[data-signatures]');
  if (sigRoot) {
    const base2 = sigRoot.dataset.base, open = sigRoot.dataset.open;
    sigRoot.innerHTML = all.filter((p) => loc(p, 'signature', lang)).map((p) => `<li><a class="sig__row" style="--accent:${esc(p.accent || '')}" href="${base2}${esc(p.slug)}${preview ? '?preview=1' : ''}" data-case="${esc(p.slug)}">
      <span class="sig__who"><b>${esc(p.client)}</b><span class="tag">${esc(L.industries[p.industry] || '')}</span></span>
      <span class="sig__what">${esc(loc(p, 'signature', lang))}</span><span class="sig__txt">${esc(loc(p, 'signature_text', lang))}</span><span class="sig__go">${esc(open)} →</span></a></li>`).join('');
    sigRoot.closest('section').hidden = !sigRoot.children.length;
    sigRoot.addEventListener('click', (e) => { const c = e.target.closest('[data-case]'); if (c) track('case_open', { slug: c.dataset.case, from: 'a-medida' }); });
  }
}
