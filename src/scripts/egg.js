// Huevo de pascua: escribir «33r» o tocar 3 veces el logo → el sitio se revela con la linterna 3 s y aparece el mensaje oculto.
import { track } from './analytics.js';
export function initEgg() {
  const dlg = document.getElementById('egg'); if (!dlg) return;
  const layer = dlg.querySelector('.egg__light'); const card = dlg.querySelector('.egg__card');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let busy = false;
  const close = () => { dlg.close(); busy = false; card.classList.remove('on'); };
  const open = (x = innerWidth / 2, y = innerHeight / 2) => {
    if (busy) return; busy = true; track('easter_egg');
    layer.style.setProperty('--ex', x + 'px'); layer.style.setProperty('--ey', y + 'px');
    dlg.showModal();
    if (reduce) { layer.style.setProperty('--r', '0px'); layer.style.setProperty('--dark', '.9'); card.classList.add('on'); return; }
    const t0 = performance.now(); const R = Math.hypot(innerWidth, innerHeight) * 1.1;
    layer.style.setProperty('--dark', '.97');
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1300); const e = 1 - Math.pow(1 - p, 3);
      layer.style.setProperty('--r', `${(e * R).toFixed(0)}px`);
      if (t - t0 < 3000 && dlg.open) requestAnimationFrame(step);
      else if (dlg.open) { layer.style.setProperty('--dark', '.82'); card.classList.add('on'); card.querySelector('a')?.focus(); }
    };
    requestAnimationFrame(step);
  };
  let buf = '';
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input,textarea,select,[contenteditable]') || e.metaKey || e.ctrlKey) return;
    buf = (buf + e.key.toLowerCase()).slice(-3); if (buf === '33r') { buf = ''; open(); }
  });
  let taps = 0, timer = 0;
  document.querySelectorAll('[data-egg-logo]').forEach((el) => el.addEventListener('click', (e) => {
    taps++; clearTimeout(timer); timer = setTimeout(() => (taps = 0), 800);
    if (taps >= 3) { taps = 0; e.preventDefault(); open(e.clientX, e.clientY); }
  }));
  dlg.querySelectorAll('[data-egg-close]').forEach((b) => b.addEventListener('click', close));
  dlg.addEventListener('cancel', () => { busy = false; card.classList.remove('on'); });
  dlg.querySelector('a[href="#demo"]')?.addEventListener('click', () => { window.__src = 'easter-egg'; close(); });
}
