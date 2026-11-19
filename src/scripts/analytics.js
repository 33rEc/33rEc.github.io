// Eventos clave → GA4 (gtag) y Microsoft Clarity. Solo existen tras el consentimiento (src/scripts/consent.js).
// Eventos: demo_cta_click, lead_submit, whatsapp_click, case_open, filter_change, live_site_click, easter_egg
export function track(event, props = {}) {
  try {
    window.dataLayer?.push({ event, ...props });
    if (typeof window.gtag === 'function') window.gtag('event', event, props);
    if (typeof window.plausible === 'function') window.plausible(event, { props });
    if (typeof window.clarity === 'function') window.clarity('event', event);   // Clarity: evento personalizado (filtrable en grabaciones)
    if (import.meta.env.DEV) console.debug('[track]', event, props);
  } catch { /* la analítica nunca debe romper la página */ }
}
export function bindTracking(root = document) {
  root.addEventListener('click', (e) => {
    const el = e.target.closest?.('[data-track]');
    if (el) track(el.dataset.track, { where: el.dataset.where || undefined, label: el.textContent?.trim().slice(0, 40) });
  });
}
