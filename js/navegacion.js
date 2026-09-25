/* REEF Records · Navegación: el hero solo se deja con "Entra al arrecife"; navbar fuera del hero */
(() => {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const causa = document.getElementById('causa');
  const nav = document.getElementById('navegacion');
  const menu = document.getElementById('nav-menu');
  let dentro = false, animando = false, piso = 0;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const medirPiso = () => { piso = causa.getBoundingClientRect().top + window.scrollY; };
  const suaveEntrada = p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

  function ir(y, dur, fin) {
    animando = true;
    html.classList.add('sin-suave');
    const y0 = window.scrollY, t0 = performance.now();
    (function paso(t = performance.now()) {
      const p = dur ? Math.min(1, (t - t0) / dur) : 1;
      window.scrollTo(0, y0 + (y - y0) * suaveEntrada(p));
      if (p < 1) return requestAnimationFrame(paso);
      animando = false;
      html.classList.remove('sin-suave');
      fin && fin();
    })();
  }

  function mostrarNav(si) {
    html.classList.toggle('dentro', si);
    nav.inert = !si;
    nav.setAttribute('aria-hidden', String(!si));
    if (!si) cerrarMenu();
  }

  function entrar() {
    if (dentro || animando) return;
    medirPiso();
    ir(piso, reducido ? 0 : 2400, () => {
      dentro = true;
      html.classList.remove('anclado');
      mostrarNav(true);
      document.getElementById('causa-t').focus({ preventScroll: true });
    });
  }

  function volver() {
    if (!dentro || animando) return;
    dentro = false;
    mostrarNav(false);
    html.classList.add('anclado');
    ir(0, reducido ? 0 : 1800, () => document.getElementById('accion').focus({ preventScroll: true }));
  }

  window.REEF.entrar = entrar;
  window.REEF.volver = volver;

  // Hero anclado: sin rueda, táctil ni teclado
  html.classList.add('anclado');
  mostrarNav(false);
  const teclas = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar']);
  let toqueY = 0;
  window.addEventListener('wheel', e => {
    if (!dentro || animando || (e.deltaY < 0 && window.scrollY <= piso + 1)) e.preventDefault();
  }, { passive: false });
  window.addEventListener('touchstart', e => { toqueY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (e.target.closest('.nav-lista')) return;
    const subiendo = e.touches[0].clientY > toqueY;
    if (!dentro || animando || (subiendo && window.scrollY <= piso + 1)) e.preventDefault();
  }, { passive: false });
  window.addEventListener('keydown', e => {
    if (!teclas.has(e.key) || e.target.closest('input, textarea, select, button')) return;
    if (!dentro || animando) e.preventDefault();
  });
  // Ya dentro, el scroll nunca vuelve a subir al hero
  window.addEventListener('scroll', () => {
    if (dentro && !animando && window.scrollY < piso - 1) window.scrollTo(0, piso);
  }, { passive: true });
  window.addEventListener('resize', () => {
    medirPiso();
    if (dentro && !animando) window.scrollTo(0, Math.max(window.scrollY, piso));
  });

  // Llegada desde otra página con index.html#causa: entrar directo
  if (location.hash === '#causa') {
    requestAnimationFrame(() => {
      medirPiso();
      window.scrollTo(0, piso);
      dentro = true;
      html.classList.remove('anclado');
      mostrarNav(true);
    });
  }

  // Menú móvil
  function cerrarMenu() {
    nav.classList.remove('abierto');
    menu.setAttribute('aria-expanded', 'false');
  }
  menu.addEventListener('click', () => {
    const abierto = nav.classList.toggle('abierto');
    menu.setAttribute('aria-expanded', String(abierto));
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarMenu(); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', e => {
    if (a.getAttribute('href') === '#') e.preventDefault();   // páginas aún sin crear: destino en data-ruta
    cerrarMenu();
  }));
})();
