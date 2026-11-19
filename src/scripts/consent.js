// Consentimiento + carga de GA4 y Microsoft Clarity. NADA se carga hasta que la persona acepta (RGPD/ePrivacy: hay público en España).
// Los IDs vienen de variables públicas PUBLIC_GA4_ID y PUBLIC_CLARITY_ID (ver CONTEXTO-CLAUDE.md §10). Sin IDs no se muestra ni se carga nada.
const KEY = '33r_consent';
const get = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const set = (v) => { try { localStorage.setItem(KEY, v); } catch { /* sin storage: se pregunta cada vez */ } };

export function loadAnalytics({ ga4, clarity }) {
  if (window.__analyticsLoaded) return; window.__analyticsLoaded = true;
  if (ga4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', ga4, { anonymize_ip: true });
    const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`; document.head.appendChild(s);
  }
  if (clarity) {
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    const s = document.createElement('script'); s.async = true; s.src = `https://www.clarity.ms/tag/${encodeURIComponent(clarity)}`; document.head.appendChild(s);
  }
}

export function initConsent() {
  const box = document.getElementById('consent'); if (!box) return;
  const cfg = { ga4: box.dataset.ga4, clarity: box.dataset.clarity };
  const show = () => { box.hidden = false; };
  const hide = () => { box.hidden = true; };
  const state = get();
  if (state === 'granted') loadAnalytics(cfg); else if (state !== 'denied') show();
  box.querySelector('[data-consent=accept]').addEventListener('click', () => { set('granted'); hide(); loadAnalytics(cfg); });
  box.querySelector('[data-consent=reject]').addEventListener('click', () => { set('denied'); hide(); });
  document.querySelectorAll('[data-consent-open]').forEach((b) => b.addEventListener('click', show));  // reabrir desde el pie de página
}
