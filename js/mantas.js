/* REEF Records · Sombras de mantarrayas (canvas 2D) */
(() => {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── Sombras de mantarrayas ───────── */
  const lienzo = document.getElementById('sombras');
  const sc = lienzo.getContext('2d');
  const RES = 0.4; // se dibuja a baja resolución para que la sombra se vea difusa
  let SW, SH;
  function ajustarSombras() {
    SW = window.innerWidth; SH = window.innerHeight;
    lienzo.width = Math.round(SW * RES);
    lienzo.height = Math.round(SH * RES);
  }
  ajustarSombras();
  window.addEventListener('resize', ajustarSombras);

  const lento = reducido ? 0.4 : 1;
  const azar = (a, b) => a + Math.random() * (b - a);

  // Dos mantas gigantes que deambulan por toda la pantalla
  const factorPantalla = () => Math.min(1, Math.max(0.45, SW / 1400));
  function crearManta(tam, prof, x, y) {
    return {
      tam, prof, x, y,
      rumbo: Math.random() * Math.PI * 2,
      vel: (26 - prof * 6) * lento,
      giro: 0.22 * lento,                 // radianes por segundo, giros amplios
      aleteo: (0.18 + Math.random() * 0.03) * lento,  // un aleteo completo cada ~5 s
      alfa: 0.72 - prof * 0.2,
      desenfoque: 1.4 + prof * 2.2,
      t: Math.random() * 10,
      destino: null
    };
  }
  const mantas = [
    crearManta(3.1, 0.0, SW * 0.25, SH * 0.35),   // la grande
    crearManta(2.0, 0.5, SW * 0.75, SH * 0.7)     // la más pequeña, algo más profunda
  ];
  function nuevoDestino(m) {
    const borde = 120 * m.tam * factorPantalla() * 0.4;
    m.destino = {
      x: -borde + Math.random() * (SW + borde * 2),
      y: -borde + Math.random() * (SH + borde * 2)
    };
  }
  mantas.forEach(nuevoDestino);

  // Silueta vista desde arriba, trazada a partir de la ilustración de referencia.
  // Coordenadas de la referencia (cabeza arriba); se convierten a coordenadas locales mirando hacia +x.
  const MITAD_DERECHA = [
    // [inicio, control 1, control 2, fin]
    [[207, 36], [211, 36], [214, 35], [217, 33]],   // boca hacia la base de la aleta cefálica
    [[217, 33], [221, 30], [222, 25], [218, 23]],   // cara interna de la aleta (cóncava)
    [[218, 23], [216, 22], [213, 22], [211, 21]],   // punta enroscada hacia adentro
    [[211, 21], [215, 14], [230, 13], [234, 24]],   // lomo externo de la aleta
    [[234, 24], [238, 34], [246, 44], [256, 50]],   // costado de la cabeza
    [[256, 50], [262, 58], [270, 64], [282, 70]],   // cabeza al hombro
    [[282, 70], [332, 82], [372, 112], [404, 162]], // borde de ataque hasta la punta del ala
    [[404, 162], [360, 156], [300, 160], [262, 188]], // borde de salida (curva cóncava)
    [[262, 188], [240, 204], [228, 222], [218, 232]], // hacia la aleta pélvica
    [[218, 232], [214, 237], [210, 237], [207, 234]]  // base de la cola
  ];
  const K = 100 / 197;
  const aLocal = ([rx, ry]) => [-(ry - 118) * K, (rx - 207) * K];
  const derecha = MITAD_DERECHA.map(s => s.map(aLocal));
  const izquierda = derecha.slice().reverse().map(([p0, c1, c2, p3]) =>
    [[p3[0], -p3[1]], [c2[0], -c2[1]], [c1[0], -c1[1]], [p0[0], -p0[1]]]);
  const CONTORNO = derecha.concat(izquierda);
  const COLA = [aLocal([207, 232]), aLocal([209, 254]), aLocal([190, 262]), aLocal([146, 248])];

  function silueta(c, s, apertura, punta) {
    // cada punto se pliega según su distancia al cuerpo: la punta del ala va con retraso
    const pliega = ([x, y]) => {
      const d = Math.min(1, Math.abs(y) / 100);
      const f = apertura + (punta - apertura) * Math.pow(d, 1.5);
      return [x - (1 - f) * Math.abs(y) * 0.15, y * f];
    };
    c.beginPath();
    const ini = pliega(CONTORNO[0][0]);
    c.moveTo(ini[0], ini[1]);
    for (const [, c1, c2, p3] of CONTORNO) {
      const a1 = pliega(c1), a2 = pliega(c2), b3 = pliega(p3);
      c.bezierCurveTo(a1[0], a1[1], a2[0], a2[1], b3[0], b3[1]);
    }
    c.closePath();
    c.fill();

    // cola fina que se mece
    const vaiven = Math.sin(apertura * 9) * 3;
    const [p0, q1, q2, p3] = COLA;
    c.beginPath();
    c.moveTo(p0[0], p0[1] - 1.4);
    c.bezierCurveTo(q1[0], q1[1] - 1, q2[0], q2[1] + vaiven, p3[0], p3[1] + vaiven);
    c.bezierCurveTo(q2[0], q2[1] + vaiven + 0.8, q1[0], q1[1] + 1, p0[0], p0[1] + 1.4);
    c.closePath();
    c.fill();
  }

  let antes = performance.now();
  (function nadar(ahora) {
    const dt = Math.min((ahora - antes) / 1000, 0.05);
    antes = ahora;
    const visibles = Math.max(0, 1 - window.REEF.prof * 1.4);
    lienzo.style.opacity = visibles;
    if (visibles <= 0) { requestAnimationFrame(nadar); return; }
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.clearRect(0, 0, lienzo.width, lienzo.height);

    mantas.forEach(m => {
      m.t += dt;
      const dx = m.destino.x - m.x, dy = m.destino.y - m.y;
      if (Math.hypot(dx, dy) < 140) nuevoDestino(m);
      // giro suave hacia el destino
      let dif = Math.atan2(dy, dx) - m.rumbo;
      dif = Math.atan2(Math.sin(dif), Math.cos(dif));
      m.rumbo += Math.max(-m.giro * dt, Math.min(m.giro * dt, dif * 0.6 * dt * 2));
      // leve deriva para que el recorrido no sea mecánico
      m.rumbo += Math.sin(m.t * 0.23) * 0.02 * dt;
      // impulso en cada aletazo
      const fase = m.t * m.aleteo * Math.PI * 2;
      const impulso = 0.88 + 0.16 * Math.max(0, Math.sin(fase));
      m.x += Math.cos(m.rumbo) * m.vel * impulso * dt;
      m.y += Math.sin(m.rumbo) * m.vel * impulso * dt;

      // arriba/abajo visto desde arriba: el ala se acorta al subir o bajar y se extiende al pasar por el medio
      const suave = x => x * x * (3 - 2 * x);
      const ala = f => 0.74 + 0.26 * suave(Math.abs(Math.cos(f)));
      const apertura = ala(fase);
      const punta = ala(fase - 0.35);
      const s = m.tam * factorPantalla() * (1 + 0.02 * Math.sin(fase * 2 + 1));

      sc.setTransform(RES * s, 0, 0, RES * s, m.x * RES, m.y * RES);
      sc.rotate(m.rumbo);
      sc.filter = `blur(${m.desenfoque * RES * 2}px)`;
      sc.fillStyle = `rgba(2, 8, 22, ${m.alfa})`;
      silueta(sc, s, apertura, punta);
      sc.filter = 'none';
    });
    requestAnimationFrame(nadar);
  })(antes);


})();
