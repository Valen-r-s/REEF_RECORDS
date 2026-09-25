/* REEF Records · Nieve marina (WebGL)
   La misma deriva de partículas que acompaña al tiburón en la sección de la causa, sola, como fondo. */
(() => {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.getElementById('nieve');
  const gl = cv && cv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true });
  if (!gl) return;

  const CANTIDAD = window.innerWidth < 700 ? 700 : 1600;
  const azar = (a, b) => a + Math.random() * (b - a);
  const datos = [];   // inicio x,y | semilla, profundidad, tamaño
  for (let i = 0; i < CANTIDAD; i++) {
    datos.push(azar(-1.9, 1.9), azar(-1.15, 1.15), Math.random(), Math.random(), azar(1.2, 3.8));
  }

  const vs = `
    attribute vec2 aInicio;
    attribute vec3 aDato;     // semilla, profundidad, tamaño
    uniform float uT, uAsp, uDpr;
    uniform vec2 uMouse;
    varying float vAlfa, vTono;
    void main() {
      float s = aDato.x, prof = aDato.y;
      // deriva lenta, con vuelta al borde
      vec2 v = vec2(sin(s * 12.0) * 0.012, 0.018 + s * 0.02);
      vec2 q = aInicio + v * uT + vec2(sin(uT * 0.3 + s * 40.0) * 0.03, 0.0);
      q = mod(q + vec2(1.9, 1.15), vec2(3.8, 2.3)) - vec2(1.9, 1.15);
      // el cursor aparta las partículas con suavidad
      vec2 d = q - uMouse;
      q += normalize(d + 1e-4) * 0.07 * exp(-dot(d, d) * 30.0);
      gl_Position = vec4(q.x / uAsp, q.y, 0.0, 1.0);
      vTono = s;
      vAlfa = 0.25 + 0.35 * (1.0 - prof);
      gl_PointSize = aDato.z * uDpr * (1.0 - prof * 0.35);
    }`;
  const fs = `
    precision mediump float;
    varying float vAlfa, vTono;
    void main() {
      float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
      a *= a;
      vec3 turquesa = vec3(0.0, 0.66, 0.91);
      vec3 marca = vec3(0.40, 0.48, 0.71);
      vec3 c = mix(turquesa * 0.8, marca, step(0.6, vTono));
      float k = a * vAlfa;
      gl_FragColor = vec4(c * k, k);
    }`;

  function compilar(tipo, src) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compilar(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(datos), gl.STATIC_DRAW);
  const atributo = (nombre, tam, desp) => {
    const loc = gl.getAttribLocation(prog, nombre);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, tam, gl.FLOAT, false, 5 * 4, desp * 4);
  };
  atributo('aInicio', 2, 0);
  atributo('aDato', 3, 2);

  const U = {};
  ['uT', 'uAsp', 'uDpr', 'uMouse'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  let dpr = 1, asp = 1;
  function ajustar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(window.innerWidth * dpr);
    cv.height = Math.round(window.innerHeight * dpr);
    asp = window.innerWidth / window.innerHeight;
    gl.viewport(0, 0, cv.width, cv.height);
  }
  ajustar();
  window.addEventListener('resize', ajustar);

  const cursor = { x: 9, y: 9 }, suave = { x: 9, y: 9 };
  window.addEventListener('pointermove', e => {
    cursor.x = (e.clientX / window.innerWidth * 2 - 1) * asp;
    cursor.y = 1 - e.clientY / window.innerHeight * 2;
  });
  document.documentElement.addEventListener('pointerleave', () => { cursor.x = 9; cursor.y = 9; });

  const inicio = performance.now();
  (function dibujar() {
    requestAnimationFrame(dibujar);
    const t = (performance.now() - inicio) / 1000 * (reducido ? 0.35 : 1);
    suave.x += (cursor.x - suave.x) * 0.08;
    suave.y += (cursor.y - suave.y) * 0.08;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uAsp, asp);
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform2f(U.uMouse, suave.x, suave.y);
    gl.drawArrays(gl.POINTS, 0, CANTIDAD);
  })();
})();
