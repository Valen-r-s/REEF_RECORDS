/* REEF Records · Estado del scroll compartido entre capas */
(() => {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const suave = x => x * x * (3 - 2 * x);

  // prof: 0 en la superficie → 1 en el fondo (sección 2)
  // forma: 0 = nieve marina dispersa → 1 = tiburón formado
  // aparece: opacidad de la capa del tiburón
  window.REEF = { prof: 0, forma: 0, aparece: 0, scroll: 0 };
  const objetivo = { prof: 0, forma: 0, aparece: 0 };

  const heroe = document.getElementById('inicio');

  function leer() {
    const s = window.scrollY / window.innerHeight;   // 1 = una pantalla hacia abajo
    objetivo.prof = suave(clamp(s / 1.1));
    objetivo.aparece = suave(clamp((s - 0.2) / 0.5));
    objetivo.forma = suave(clamp((s - 0.35) / 0.75));
    window.REEF.scroll = s;
    // el contenido del hero sube y se desvanece al descender
    if (heroe) {
      const h = clamp(s / 0.7);
      heroe.style.opacity = 1 - h;
      heroe.style.transform = reducido ? 'none' : `translateY(${-h * 70}px)`;
      heroe.style.visibility = h >= 1 ? 'hidden' : 'visible';
    }
  }
  window.addEventListener('scroll', leer, { passive: true });
  window.addEventListener('resize', leer);
  leer();

  // suavizado continuo para que nada salte aunque el scroll sea brusco
  let antes = performance.now();
  (function paso(ahora = performance.now()) {
    const dt = Math.min((ahora - antes) / 1000, 0.1);
    antes = ahora;
    const k = reducido ? 1 : 1 - Math.exp(-dt * 4.5);   // independiente de los fps
    for (const c of ['prof', 'forma', 'aparece']) {
      window.REEF[c] += (objetivo[c] - window.REEF[c]) * k;
    }
    requestAnimationFrame(paso);
  })();

  // aparición de textos
  const revelables = document.querySelectorAll('.revelar');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); } });
    }, { threshold: 0.2 });
    revelables.forEach(el => obs.observe(el));
  } else {
    revelables.forEach(el => el.classList.add('visible'));
  }
})();
