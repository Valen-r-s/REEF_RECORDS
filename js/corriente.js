/* REEF Records · Sección 2: tres objetos a la deriva unidos por una corriente punteada
   Cada objeto flota por su cuenta, se desplaza con el mouse (paralaje) y se deja atraer un poco
   cuando el cursor se acerca. La línea pasa por sus centros y ondula como una corriente marina. */
(() => {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const caja = document.getElementById('corriente');
  if (!caja) return;
  const svg = caja.querySelector('.corriente-trazo');
  const hilos = [...svg.querySelectorAll('.hilo')];
  const PROFUNDIDAD = [0.7, 1, 0.85];   // cuánto responde cada objeto al paralaje
  const objetos = [...caja.querySelectorAll('.objeto')].map((el, i) => ({ el, i, dx: 0, dy: 0, prof: PROFUNDIDAD[i] || 1 }));

  // Páginas aún sin crear: el destino queda en data-ruta
  objetos.forEach(({ el }) => el.addEventListener('click', e => {
    if (el.getAttribute('href') === '#') e.preventDefault();
  }));

  function medir() { svg.setAttribute('viewBox', `0 0 ${caja.clientWidth} ${caja.clientHeight}`); }
  new ResizeObserver(medir).observe(caja);
  medir();

  // mouse: normalizado (-1..1) para el paralaje y en píxeles para la atracción
  const raton = { x: 0, y: 0, px: -1e4, py: -1e4 };
  window.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    raton.x = e.clientX / window.innerWidth * 2 - 1;
    raton.y = e.clientY / window.innerHeight * 2 - 1;
    raton.px = e.clientX; raton.py = e.clientY;
  });
  document.documentElement.addEventListener('pointerleave', () => {
    raton.x = raton.y = 0; raton.px = raton.py = -1e4;
  });

  // Tramo ondulado de a hacia b: la onda se anula en los extremos, así la línea toca cada objeto
  function tramo(a, b, fase, amp, pts) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const largo = Math.hypot(dx, dy) || 1;
    const nx = -dy / largo, ny = dx / largo;
    const pasos = Math.max(16, Math.round(largo / 8));
    for (let k = 1; k <= pasos; k++) {
      const s = k / pasos;
      const w = Math.sin(Math.PI * s) * Math.sin(Math.PI * 3 * s + fase) * amp * largo;
      pts.push([a[0] + dx * s + nx * w, a[1] + dy * s + ny * w]);
    }
  }

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(caja);

  let antes = performance.now();
  (function paso(ahora = performance.now()) {
    requestAnimationFrame(paso);
    const dt = Math.min((ahora - antes) / 1000, 0.1);
    antes = ahora;
    if (!visible) return;
    const t = ahora / 1000;
    const k = 1 - Math.exp(-dt * 2.5);
    const r = caja.getBoundingClientRect();

    for (const o of objetos) {
      let tx = 0, ty = 0;
      if (!reducido) {
        // flotación propia
        tx = Math.sin(t * 0.45 + o.i * 2.1) * 7;
        ty = Math.cos(t * 0.38 + o.i * 1.3) * 9;
        // paralaje con el mouse
        tx += raton.x * 22 * o.prof;
        ty += raton.y * 16 * o.prof;
        // atracción suave hacia el cursor cercano
        const ax = raton.px - (r.left + o.el.offsetLeft + o.dx);
        const ay = raton.py - (r.top + o.el.offsetTop + o.dy);
        const alcance = o.el.offsetWidth * 1.3;
        const d = Math.hypot(ax, ay);
        if (d < alcance) {
          const f = (1 - d / alcance) ** 2 * 0.14;
          tx += ax * f; ty += ay * f;
        }
      }
      o.dx += (tx - o.dx) * k;
      o.dy += (ty - o.dy) * k;
      o.el.style.setProperty('--dx', o.dx.toFixed(2) + 'px');
      o.el.style.setProperty('--dy', o.dy.toFixed(2) + 'px');
    }

    // la corriente entra por fuera, cruza los tres objetos y sale por el otro extremo
    const c = objetos.map(o => [o.el.offsetLeft + o.dx, o.el.offsetTop + o.dy]);
    const n = c.length - 1;
    const ini = [c[0][0] - (c[1][0] - c[0][0]) * 0.9, c[0][1] - (c[1][1] - c[0][1]) * 0.9];
    const fin = [c[n][0] + (c[n][0] - c[n - 1][0]) * 0.9, c[n][1] + (c[n][1] - c[n - 1][1]) * 0.9];
    const puntos = [ini, ...c, fin];
    const ola = reducido ? 0 : t * 0.6;

    hilos.forEach((h, j) => {
      const pts = [puntos[0]];
      for (let s = 0; s < puntos.length - 1; s++) {
        tramo(puntos[s], puntos[s + 1], ola * (j ? 1 : 0.8) + s * 1.7 + j * 2.4, j ? 0.09 : 0.06, pts);
      }
      h.setAttribute('d', 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'));
      // los puntos fluyen corriente abajo
      if (!reducido) h.style.strokeDashoffset = (-t * (j ? 22 : 14)).toFixed(1);
    });
  })();
})();
