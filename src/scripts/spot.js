// LINTERNA ESPECTRAL. Un solo rAF actualiza variables CSS (--mx --my en px, --px --py en -1..1) de cada [data-spot] visible.
// El CSS hace el resto (gradiente + máscara). Ratón: sigue al cursor. Táctil: sigue al dedo y deriva sola. Giroscopio: opcional.
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = new Map();
let raf = 0, last = 0, gyroOn = false;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const getPos = (el) => state.get(el);

function write(el, s) {
  el.style.setProperty('--mx', `${(s.x * s.w).toFixed(1)}px`);
  el.style.setProperty('--my', `${(s.y * s.h).toFixed(1)}px`);
  el.style.setProperty('--px', ((s.x - 0.5) * 2).toFixed(3));
  el.style.setProperty('--py', ((s.y - 0.5) * 2).toFixed(3));
}

function frame(now) {
  raf = 0;
  const dt = Math.min(64, now - last || 16); last = now;
  const k = 1 - Math.exp(-dt / 90);
  let any = false;
  state.forEach((s, el) => {
    if (!s.visible) return;
    any = true;
    const idle = now - s.last > (s.coarse ? 1200 : 3500);
    if (idle && !gyroOn) {               // deriva ambiental: la presencia sigue ahí aunque no la muevas
      const t = now + s.phase;
      s.tx = 0.5 + 0.3 * Math.sin(t * 0.00031);
      s.ty = 0.42 + 0.18 * Math.sin(t * 0.00047 + 1.3);
    }
    s.x += (s.tx - s.x) * k; s.y += (s.ty - s.y) * k;
    write(el, s);
  });
  if (any && !document.hidden) raf = requestAnimationFrame(frame);
}
const kick = () => { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };

export function initSpot() {
  const els = [...document.querySelectorAll('[data-spot]')];
  const coarse = matchMedia('(pointer: coarse)').matches;
  const static_ = reduce();
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const s = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4, w: r.width, h: r.height, visible: false, last: -1e9, coarse, phase: i * 2000 };
    state.set(el, s); write(el, s);
  });
  if (static_) { document.documentElement.dataset.motion = 'off'; return; }  // halo fijo, versión estática

  const ro = new ResizeObserver((es) => es.forEach((e) => { const s = state.get(e.target); if (s) { s.w = e.contentRect.width; s.h = e.contentRect.height; } }));
  const io = new IntersectionObserver((es) => { es.forEach((e) => { const s = state.get(e.target); s.visible = e.isIntersecting; }); kick(); }, { rootMargin: '100px' });
  els.forEach((el) => { ro.observe(el); io.observe(el); });

  const move = (e) => {
    if (gyroOn) return;
    const now = performance.now();
    state.forEach((s, el) => {
      if (!s.visible) return;
      const r = el.getBoundingClientRect(), a = (el.closest('[data-spot-area]') || el).getBoundingClientRect();  // área de detección puede ser mayor que el elemento
      if (e.clientX >= a.left && e.clientX <= a.right && e.clientY >= a.top && e.clientY <= a.bottom) {
        s.tx = (e.clientX - r.left) / r.width; s.ty = (e.clientY - r.top) / r.height; s.last = now;
      }
    });
    kick();
  };
  addEventListener('pointermove', move, { passive: true });
  addEventListener('pointerdown', move, { passive: true });
  document.addEventListener('visibilitychange', kick);
}

/** Giroscopio opcional (pide permiso en iOS). Devuelve true si quedó activo. */
export async function setGyro(on) {
  if (!on) { gyroOn = false; removeEventListener('deviceorientation', onTilt); return false; }
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return false;
    }
  } catch { return false; }
  gyroOn = true; addEventListener('deviceorientation', onTilt, { passive: true }); return true;
}
function onTilt(e) {
  if (e.gamma == null) return;
  const now = performance.now();
  state.forEach((s) => { if (s.visible) { s.tx = 0.5 + clamp(e.gamma / 35, -1, 1) * 0.42; s.ty = 0.42 + clamp(((e.beta ?? 50) - 50) / 35, -1, 1) * 0.38; s.last = now; } });
  kick();
}
