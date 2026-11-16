// Logo 33r: tras la secuencia inicial (~5.5 s) queda en reposo limpio.
// Hover / tap repite solo el reflejo Ɛ3. Con reduced-motion no hace nada (versión estática).
export function bindLogoReplay(root = document) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll('.logo--m.is-anim').forEach((svg) => {
    let busy = true;
    setTimeout(() => { svg.classList.add('is-settled'); busy = false; }, 5600);
    const replay = () => {
      if (busy) return; busy = true;
      svg.classList.add('is-flip');
      setTimeout(() => { svg.classList.remove('is-flip'); busy = false; }, 2300);
    };
    svg.addEventListener('pointerenter', replay);
    svg.addEventListener('click', replay);
  });
}
