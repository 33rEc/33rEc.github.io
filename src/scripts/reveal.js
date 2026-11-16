// Texto/elementos que se materializan (no se deslizan). Respeta reduced-motion (visibles de entrada).
export function initReveal() {
  const els = document.querySelectorAll('.materialize');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
}
// Manifiesto: línea por línea con el scroll (GSAP cargado en idle; sin GSAP o con reduced-motion se ve completo).
export async function initManifesto() {
  const wrap = document.querySelector('[data-manifesto]');
  if (!wrap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  const lines = wrap.querySelectorAll('.m-line');
  wrap.classList.add('gsap-ready');
  gsap.set(lines, { opacity: 0.6, filter: 'blur(2px)' });  // legible de base (AA); el scroll solo intensifica
  lines.forEach((l) => gsap.to(l, { opacity: 1, filter: 'blur(0px)', ease: 'none', scrollTrigger: { trigger: l, start: 'top 82%', end: 'top 50%', scrub: true } }));
}
