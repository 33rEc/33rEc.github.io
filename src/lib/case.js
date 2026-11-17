// Plantilla ÚNICA de caso de estudio: reto → cliente objetivo → idea → las dos pantallas → mecánicas → resultados → link en vivo.
// Se usa en build (páginas estáticas) y en el navegador (404.html para proyectos creados después del build).
import { loc } from '../js/data.js';
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function caseHTML(p, t) {
  const c = t.caseStudy, w = t.work, lang = t.lang;
  const screen = (url, label, ph) => `<figure class="cs-screen">${url ? `<img src="${esc(url)}" alt="${esc(label)}" loading="lazy" decoding="async">` : `<div class="cs-ph" aria-hidden="true"><span class="tag">${esc(w.demo)}</span></div>`}<figcaption class="tag">${esc(label)}</figcaption></figure>`;
  const types = (p.solution_types || []).map((k) => w.types[k]).filter(Boolean);
  const metrics = (p.metrics || []).filter((m) => m?.value);
  const results = loc(p, 'results', lang);
  const live = p.status === 'en_vivo' && p.live_url, demo = p.kind === 'demo';
  return `
  <article class="cs">
    <header class="cs-hero wrap">
      <a class="tag cs-back" href="${t.home}#trabajo">${esc(c.back)}</a>
      <div class="cs-badges"><span class="badge ${live ? 'badge--live' : ''}">${live ? esc(w.live) : esc(w.study)}</span>${demo ? `<span class="badge">${esc(w.demoKind)}</span>` : ''}${p.published ? '' : `<span class="badge badge--draft">${esc(c.draftNote)}</span>`}</div>
      <h1>${esc(p.client)}</h1>
      <p class="cs-meta tag"><span class="tag--ecto">${esc(w.industries[p.industry] || '')}</span> · ${esc(types.join(' · '))}${p.city || p.country ? ` · ${esc([p.city, p.country].filter(Boolean).join(', '))}` : ''}${p.year ? ` · ${esc(p.year)}` : ''}</p>
      <p class="cs-star"><span class="tag">${esc(w.star)}</span>${esc(loc(p, 'star_mechanic', lang))}</p>
    </header>
    <section class="wrap cs-grid">
      <div><p class="tag tag--ecto">${esc(c.challenge)}</p><p class="cs-p">${esc(loc(p, 'challenge', lang))}</p></div>
      <div><p class="tag tag--ecto">${esc(c.target)}</p><p class="cs-p">${esc(loc(p, 'target_client', lang))}</p></div>
      <div class="cs-wide"><p class="tag tag--ecto">${esc(c.idea)}</p><p class="cs-p cs-big">${esc(loc(p, 'solution', lang))}</p></div>
    </section>
    <section class="wrap" aria-label="${esc(c.screens)}">
      <p class="tag tag--ecto">${esc(c.screens)}</p>
      <div class="cs-screens">${screen(p.screens?.sell || p.cover_url, c.sell)}${screen(p.screens?.control, c.control)}</div>
    </section>
    ${(p.mechanics || []).length ? `<section class="wrap"><p class="tag tag--ecto">${esc(c.mechanics)}</p><ul class="cs-mech">${p.mechanics.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></section>` : ''}
    <section class="wrap"><p class="tag tag--ecto">${esc(c.results)}</p>
      ${metrics.length ? `<ul class="cs-metrics">${metrics.map((m) => `<li><b>${esc(m.value)}</b><span class="tag">${esc(m.label)}</span></li>`).join('')}</ul>` : ''}
      ${results ? `<p class="cs-p">${esc(results)}</p>` : metrics.length ? '' : `<p class="cs-p muted">${esc(c.pending)}</p>`}
      ${demo ? `<p class="cs-p muted">${esc(c.demoNote)}</p>` : ''}
      ${p.live_url ? `<p><a class="btn btn--primary" href="${esc(p.live_url)}" target="_blank" rel="noopener" data-track="live_site_click">${esc(demo ? w.visitDemo : c.live)} ↗</a></p>` : ''}
    </section>
    <section class="wrap cs-cta"><h2>${esc(c.cta)}</h2><a class="btn btn--primary" href="${t.home}#demo" data-track="demo_cta_click" data-where="case">${esc(c.ctaBtn)}</a></section>
  </article>`;
}
