// Entrada principal. Crítico (linterna, reveal, demo, form) al instante; lo pesado (niebla, GSAP, datos, huevo) en idle tras `load`.
import { initSpot, setGyro } from './spot.js';
import { initReveal, initManifesto } from './reveal.js';
import { initDuo } from './duo.js';
import { initForm } from './form.js';
import { bindTracking, track } from './analytics.js';

const coarse = matchMedia('(pointer: coarse)').matches;
bindTracking();
initSpot(); initReveal(); initDuo(); initForm();

// Nav sólida al hacer scroll
const nav = document.querySelector('[data-nav]');
const onScroll = () => nav?.classList.toggle('is-solid', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// Pista y giroscopio (solo táctil)
const hint = document.querySelector('.hero__hint');
if (hint && coarse) hint.textContent = hint.dataset.hintTouch;
const gyroBtn = document.querySelector('[data-gyro]');
if (gyroBtn && coarse && typeof DeviceOrientationEvent !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gyroBtn.hidden = false; let on = false;
  gyroBtn.addEventListener('click', async () => { on = await setGyro(!on); gyroBtn.textContent = on ? gyroBtn.dataset.on : gyroBtn.dataset.off; });
}

// Industrias → filtran el portafolio
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ind]'); if (!b) return;
  window.__pf = b.dataset.ind; dispatchEvent(new CustomEvent('work:filter', { detail: { industry: b.dataset.ind } }));
  track('filter_change', { industry: b.dataset.ind, from: 'industries' });
  document.getElementById('trabajo')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});

const idle = window.requestIdleCallback || ((f) => setTimeout(f, 250));
const later = () => idle(async () => {
  const hero = document.querySelector('.hero');
  const [{ initMist }, { initWork }, { initEgg }] = await Promise.all([import('./mist.js'), import('./work.js'), import('./egg.js')]);
  if (hero) initMist(hero);
  initWork(); initEgg(); initManifesto();
});
document.readyState === 'complete' ? later() : addEventListener('load', later, { once: true });
