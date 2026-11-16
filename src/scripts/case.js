import { bindTracking } from './analytics.js';
bindTracking();
const nav = document.querySelector('[data-nav]');
const f = () => nav?.classList.toggle('is-solid', scrollY > 24); addEventListener('scroll', f, { passive: true }); f();
