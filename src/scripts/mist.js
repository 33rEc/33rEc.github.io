// Niebla ligera + estela del cursor (canvas 2D, ≤48 partículas con sprite prerenderizado). Se carga en idle y se pausa fuera de pantalla.
import { getPos } from './spot.js';
export function initMist(host) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true'); canvas.className = 'mist';
  host.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  let w = 0, h = 0, run = false, raf = 0, ps = [], trail = [];
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 96;
  const sc = sprite.getContext('2d'); const g = sc.createRadialGradient(48, 48, 0, 48, 48, 48);
  g.addColorStop(0, 'rgba(237,234,227,.5)'); g.addColorStop(1, 'rgba(237,234,227,0)'); sc.fillStyle = g; sc.fillRect(0, 0, 96, 96);
  const resize = () => {
    const r = host.getBoundingClientRect(); w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = w < 700 ? 22 : 44;
    ps = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 40 + Math.random() * 110, vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .08, a: .02 + Math.random() * .05 }));
  };
  new ResizeObserver(resize).observe(host); resize();
  let lastT = 0, px = -999, py = -999;
  host.addEventListener('pointermove', (e) => { const r = host.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; }, { passive: true });
  const tick = (t) => {
    raf = 0; if (!run) return;
    ctx.clearRect(0, 0, w, h);
    const s = getPos(host); const cx = s ? s.x * w : -999, cy = s ? s.y * h : -999;
    for (const p of ps) {
      p.x += p.vx; p.y += p.vy;
      const dx = p.x - cx, dy = p.y - cy, d2 = dx * dx + dy * dy;
      if (d2 < 22000) { const f = (1 - d2 / 22000) * 0.6; p.x += (dx / Math.sqrt(d2 + 1)) * f; p.y += (dy / Math.sqrt(d2 + 1)) * f; }
      if (p.x < -p.r) p.x = w + p.r; if (p.x > w + p.r) p.x = -p.r; if (p.y < -p.r) p.y = h + p.r; if (p.y > h + p.r) p.y = -p.r;
      ctx.globalAlpha = p.a * (d2 < 90000 ? 2.2 : 1); ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    // estela (afterimage) del halo
    if (t - lastT > 38 && cx > -900) { trail.push({ x: cx, y: cy, t }); lastT = t; }
    trail = trail.filter((q) => t - q.t < 900);
    for (const q of trail) {
      const age = (t - q.t) / 900; ctx.globalAlpha = (1 - age) * 0.16;
      ctx.strokeStyle = age < 0.5 ? '#9CF6D4' : '#A99BFF'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(q.x, q.y, 24 + age * 70, 0, 6.2832); ctx.stroke();
    }
    ctx.globalAlpha = 1; raf = requestAnimationFrame(tick);
  };
  const go = (on) => { run = on && !document.hidden; if (run && !raf) raf = requestAnimationFrame(tick); };
  new IntersectionObserver((es) => go(es[0].isIntersecting)).observe(host);
  document.addEventListener('visibilitychange', () => go(!document.hidden));
}
