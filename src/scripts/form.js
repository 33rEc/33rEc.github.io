// Formulario de demo → createLead() (Supabase). Honeypot anti-spam. Si no hay backend, ofrece WhatsApp (no finge enviar).
import { createLead } from '../js/data.js';
import { track } from './analytics.js';
export function initForm() {
  const form = document.querySelector('[data-demo-form]'); if (!form) return;
  const M = JSON.parse(form.dataset.msg), ok = document.querySelector('[data-ok]'), err = form.querySelector('[data-err]'), btn = form.querySelector('button[type=submit]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.hidden = true;
    const data = Object.fromEntries(new FormData(form));
    let bad = null;
    form.querySelectorAll('[required]').forEach((el) => { const miss = !el.value.trim(); el.setAttribute('aria-invalid', String(miss)); if (miss && !bad) bad = el; });
    if (bad) { err.textContent = M.req; err.hidden = false; bad.focus(); return; }
    if (data.website) return;                       // honeypot
    btn.disabled = true; btn.textContent = M.sending;
    try {
      await createLead({ ...data, lang: form.dataset.lang, source: window.__src || 'web' });
      track('lead_submit', { goal: data.goal, country: data.country });
      form.hidden = true; ok.hidden = false; ok.focus();
    } catch (e2) {
      console.warn('[lead]', e2.message);
      err.textContent = M.err; err.hidden = false; btn.disabled = false; btn.textContent = M.submit;
    }
  });
  form.addEventListener('input', (e) => e.target.removeAttribute?.('aria-invalid'));
}
