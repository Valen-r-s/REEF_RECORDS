/* REEF Records · Ciencia: mapa de distribución (shader WebGL)
   La tierra se rasteriza una vez a una textura; los hexágonos se calculan en el fragment shader
   a partir de una textura de densidad (un texel por celda hexagonal). */
(() => {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.getElementById('mapa');
  const lectura = document.getElementById('mapa-lectura');
  const gl = cv && cv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true });
  if (!gl || !window.ESPECIES) return;

  // Recorte equirectangular: sin el Ártico profundo ni la Antártida, donde no hay registros
  const LAT_N = 80, LAT_S = -60, ALTO = LAT_N - LAT_S;
  const RAIZ3 = Math.sqrt(3);
  const TIERRA_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json';

  /* ───────── Shaders ───────── */
  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
  const fs = `
    precision highp float;
    uniform vec2 uRes, uTex, uHover;
    uniform float uT, uMezcla, uUnidad, uAlto, uEcuador;
    uniform sampler2D uTierra, uDatosA, uDatosB;

    const vec2 S = vec2(1.0, 1.7320508);
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    // distancia hexagonal: 0.5 en el borde
    float hexDist(vec2 p){ p = abs(p); return max(dot(p, S * 0.5), p.x); }
    // coordenadas locales (xy) e identificador (zw) de la celda hexagonal
    vec4 hexCoords(vec2 uv){
      vec4 hC = floor(vec4(uv, uv - vec2(0.5, 1.0)) / S.xyxy) + 0.5;
      vec4 h = vec4(uv - hC.xy * S, uv - (hC.zw + 0.5) * S);
      return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + 0.5);
    }
    vec4 sobre(vec4 fondo, vec3 c, float a){ return vec4(c * a + fondo.rgb * (1.0 - a), a + fondo.a * (1.0 - a)); }

    void main(){
      vec2 uv = gl_FragCoord.xy / uRes;
      vec2 grados = uv * vec2(360.0, uAlto);        // (lon + 180, lat - LAT_S)
      float pxGrado = uRes.x / 360.0;
      vec3 marca = vec3(0.40, 0.48, 0.71);
      vec3 azul = vec3(0.13, 0.53, 0.87);
      vec3 claro = vec3(0.62, 0.84, 1.0);
      vec4 col = vec4(0.0);

      // retícula punteada cada 30°, ecuador algo más marcado
      vec2 f = fract(grados / 30.0);
      vec2 dl = min(f, 1.0 - f) * 30.0 * pxGrado;
      float vert = (1.0 - smoothstep(0.3, 1.3, dl.x)) * step(0.5, fract(grados.y * 0.6));
      float hori = (1.0 - smoothstep(0.3, 1.3, dl.y)) * step(0.5, fract(grados.x * 0.6));
      float ecuador = 1.0 - smoothstep(0.3, 1.3, abs(grados.y - uEcuador) * pxGrado);
      col = sobre(col, marca, max(max(vert, hori) * 0.11, ecuador * 0.2));

      // tierra (R) y costa (G)
      vec4 t = texture2D(uTierra, uv);
      col = sobre(col, vec3(0.006, 0.016, 0.032), t.r * 0.94);
      col = sobre(col, marca, t.g * 0.28);

      // hexágonos de distribución
      float hexPx = uUnidad * pxGrado;
      float aa = 1.2 / hexPx;
      vec4 h = hexCoords(grados / uUnidad);
      vec2 id = floor(h.zw * 2.0 + 0.5);
      vec2 tc = (id + 0.5) / uTex;
      float semilla = hash(id);
      // cada celda cambia de especie a su ritmo
      float k = clamp(uMezcla * 1.6 - semilla * 0.6, 0.0, 1.0);
      k = k * k * (3.0 - 2.0 * k);
      float v = mix(texture2D(uDatosA, tc).r, texture2D(uDatosB, tc).r, k);
      float pop = 1.0 - sin(k * 3.14159) * 0.6;
      float hd = hexDist(h.xy);
      float r = length(h.xy);

      if (v > 0.002) {
        float vv = pow(v, 0.8);
        float pulso = 0.5 + 0.5 * sin(uT * 1.7 + semilla * 6.2832);
        // barrido de sonar que recorre el mapa de oeste a este
        float centroX = h.z * uUnidad;
        float tras = mod(fract(uT * 0.035) * 420.0 - 30.0 - centroX + 360.0, 360.0);
        float sonar = exp(-tras * 0.06) * step(tras, 120.0);
        // celda con poco registro: hexágono fino con un punto; con mucho: círculo que desborda la celda
        float lw = max(1.0 / hexPx, 0.035);
        float marco = 1.0 - smoothstep(lw * 0.5, lw * 0.5 + aa, abs(hd - 0.33));
        float relleno = smoothstep(0.34, 0.34 - aa, hd);
        float rr = mix(0.10, 0.56, vv) * pop * (0.93 + 0.07 * pulso);
        float nucleo = smoothstep(rr + aa, rr, r);
        float halo = exp(-r * r / (rr * rr + 0.02) * 1.2);
        float pequena = 1.0 - smoothstep(0.15, 0.45, vv);
        col = sobre(col, azul, relleno * (0.10 + 0.12 * sonar) * pop * pequena);
        col = sobre(col, mix(azul, claro, 0.45 + 0.4 * sonar), marco * (0.75 + 0.25 * sonar) * pop * pequena);
        col = sobre(col, azul, halo * 0.25 * vv * pop);
        col = sobre(col, mix(azul, claro, (1.0 - r / max(rr, 0.001)) * 0.45 * vv + 0.35 * sonar), nucleo * 0.95);
      }

      // celda bajo el cursor
      if (length(id - uHover) < 0.5) {
        float lw = 1.4 / hexPx;
        col = sobre(col, claro, (1.0 - smoothstep(lw * 0.5, lw * 0.5 + aa, abs(hd - 0.47))) * 0.9);
        col = sobre(col, claro, smoothstep(0.48, 0.48 - aa, hd) * 0.08);
      }
      gl_FragColor = col;
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
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['uRes', 'uTex', 'uHover', 'uT', 'uMezcla', 'uUnidad', 'uAlto', 'uEcuador', 'uTierra', 'uDatosA', 'uDatosB']
    .forEach(n => U[n] = gl.getUniformLocation(prog, n));
  gl.uniform1i(U.uTierra, 0);
  gl.uniform1i(U.uDatosA, 1);
  gl.uniform1i(U.uDatosB, 2);
  gl.uniform1f(U.uAlto, ALTO);
  gl.uniform1f(U.uEcuador, -LAT_S);

  function textura(unidad, filtro) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unidad);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  /* ───────── Tierra ───────── */
  const TW = 2048, TH = Math.round(TW * ALTO / 360);
  const lienzoTierra = document.createElement('canvas');
  lienzoTierra.width = TW; lienzoTierra.height = TH;
  const texTierra = textura(0, gl.LINEAR);
  let mascara = null;   // píxeles de la tierra para descartar puntos en tierra firme

  function subirTierra() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texTierra);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lienzoTierra);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }
  subirTierra();

  async function cargarTierra() {
    if (!window.d3 || !window.topojson) return;
    try {
      const topo = await fetch(TIERRA_URL).then(r => r.json());
      const tierra = topojson.feature(topo, topo.objects.land);
      const escala = TW / (2 * Math.PI);
      const proy = d3.geoEquirectangular().scale(escala).translate([TW / 2, escala * LAT_N * Math.PI / 180]);
      const c = lienzoTierra.getContext('2d');
      const trazo = d3.geoPath(proy, c);
      c.fillStyle = '#f00';
      c.beginPath(); trazo(tierra); c.fill();
      mascara = c.getImageData(0, 0, TW, TH).data;
      // la costa va en el canal verde, sumada sobre el relleno
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = '#0f0'; c.lineWidth = 2.2;
      c.beginPath(); trazo(tierra); c.stroke();
      subirTierra();
      puntos = {};
      agrupar();
    } catch (e) {
      console.warn('Mapa: no se pudo cargar el contorno de la tierra', e);
    }
  }
  const enTierra = (lat, lon) => {
    if (!mascara) return false;
    const x = Math.min(TW - 1, Math.floor((lon + 180) / 360 * TW));
    const y = Math.min(TH - 1, Math.floor((LAT_N - lat) / ALTO * TH));
    return mascara[(y * TW + x) * 4] > 127;
  };

  /* ───────── Puntos y hexágonos ───────── */
  // generador con semilla: el mapa se ve igual en cada visita
  function azarConSemilla(semilla) {
    return () => {
      semilla |= 0; semilla = semilla + 0x6D2B79F5 | 0;
      let t = Math.imul(semilla ^ semilla >>> 15, 1 | semilla);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  let puntos = {};
  function puntosDe(id) {
    if (puntos[id]) return puntos[id];
    const azar = azarConSemilla(id === 'manta' ? 7 : 13);
    const gauss = () => Math.sqrt(-2 * Math.log(azar() + 1e-9)) * Math.cos(2 * Math.PI * azar());
    const lista = [];
    for (const [lat, lon, peso, disp] of ESPECIES[id].zonas) {
      const n = Math.round(peso * 3);
      for (let i = 0, intentos = 0; i < n && intentos < n * 12; intentos++) {
        const la = lat + gauss() * disp * 0.55;
        let lo = lon + gauss() * disp * 0.7;
        lo = ((lo + 540) % 360) - 180;
        if (la <= LAT_S || la >= LAT_N || enTierra(la, lo)) continue;
        lista.push([la, lo]);
        i++;
      }
    }
    return puntos[id] = lista;
  }

  // misma celda que calcula hexCoords en el shader, con el identificador doblado a enteros
  function celda(x, y) {
    const ax = Math.floor(x) + 0.5, ay = Math.floor(y / RAIZ3) + 0.5;
    const bx = Math.floor(x - 0.5) + 0.5, by = Math.floor((y - 1) / RAIZ3) + 0.5;
    const d1 = (x - ax) ** 2 + (y - ay * RAIZ3) ** 2;
    const d2 = (x - bx - 0.5) ** 2 + (y - (by + 0.5) * RAIZ3) ** 2;
    return d1 < d2 ? [Math.round(ax * 2), Math.round(ay * 2)] : [Math.round(bx * 2 + 1), Math.round(by * 2 + 1)];
  }

  let unidad = 0, texW = 1, texH = 1;
  const texDatos = { manta: textura(1, gl.NEAREST), martillo: textura(2, gl.NEAREST) };
  const conteos = {};
  function agrupar() {
    texW = Math.ceil(720 / unidad) + 4;
    texH = Math.ceil(2 * ALTO / (unidad * RAIZ3)) + 4;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    for (const id of Object.keys(texDatos)) {
      const cuenta = new Map();
      for (const [lat, lon] of puntosDe(id)) {
        const [ix, iy] = celda((lon + 180) / unidad, (lat - LAT_S) / unidad);
        const k = ix + iy * texW;
        cuenta.set(k, (cuenta.get(k) || 0) + 1);
      }
      const max = Math.max(1, ...cuenta.values());
      const bytes = new Uint8Array(texW * texH);
      for (const [k, n] of cuenta) bytes[k] = Math.max(8, Math.round(n / max * 255));
      conteos[id] = cuenta;
      gl.activeTexture(gl.TEXTURE0 + (id === 'manta' ? 1 : 2));
      gl.bindTexture(gl.TEXTURE_2D, texDatos[id]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, texW, texH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
    }
    gl.uniform2f(U.uTex, texW, texH);
  }

  /* ───────── Tamaño ───────── */
  let dpr = 1;
  function ajustar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ancho = cv.clientWidth;
    cv.width = Math.round(ancho * dpr);
    cv.height = Math.round(cv.clientHeight * dpr);
    gl.viewport(0, 0, cv.width, cv.height);
    // hexágonos de ~12 px en pantalla
    const nueva = Math.min(8, Math.max(2.6, 360 / (ancho / 12)));
    if (Math.abs(nueva - unidad) > 0.05) { unidad = nueva; agrupar(); }
  }
  new ResizeObserver(ajustar).observe(cv);
  ajustar();

  /* ───────── Cambio de especie ───────── */
  // A = especie visible, B = especie destino; uMezcla anima de A a B celda por celda
  let desde = 'manta', hacia = 'manta', mezcla = 1, t0 = 0;
  function enlazar() {
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texDatos[desde]);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texDatos[hacia]);
  }
  enlazar();
  document.addEventListener('especie', e => {
    if (e.detail === hacia) return;
    desde = mezcla < 0.5 ? desde : hacia;
    hacia = e.detail;
    mezcla = 0; t0 = performance.now();
    enlazar();
    lectura.textContent = lectura.dataset.inicial;
  });

  /* ───────── Cursor: celda y coordenadas ───────── */
  const hover = [-99, -99];
  const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(1)}° ${v >= 0 ? pos : neg}`;
  function leer(e) {
    const r = cv.getBoundingClientRect();
    const lon = (e.clientX - r.left) / r.width * 360 - 180;
    const lat = LAT_N - (e.clientY - r.top) / r.height * ALTO;
    const [ix, iy] = celda((lon + 180) / unidad, (lat - LAT_S) / unidad);
    hover[0] = ix; hover[1] = iy;
    const n = conteos[hacia] && conteos[hacia].get(ix + iy * texW) || 0;
    lectura.textContent = `${fmt(lat, 'N', 'S')} · ${fmt(lon, 'E', 'O')} — ${n ? n + (n === 1 ? ' registro' : ' registros') : 'sin registros'}`;
  }
  cv.addEventListener('pointermove', leer);
  cv.addEventListener('pointerdown', leer);   // en pantallas táctiles, un toque elige la celda
  cv.addEventListener('pointerleave', e => {
    if (e.pointerType !== 'mouse') return;
    hover[0] = hover[1] = -99;
    lectura.textContent = lectura.dataset.inicial;
  });
  lectura.dataset.inicial = lectura.textContent;

  /* ───────── Dibujo ───────── */
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(cv);
  const inicio = performance.now();
  (function dibujar(ahora = performance.now()) {
    requestAnimationFrame(dibujar);
    if (!visible) return;
    if (mezcla < 1) mezcla = reducido ? 1 : Math.min(1, (ahora - t0) / 1800);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uRes, cv.width, cv.height);
    gl.uniform1f(U.uT, (ahora - inicio) / 1000 * (reducido ? 0.2 : 1));
    gl.uniform1f(U.uMezcla, mezcla);
    gl.uniform1f(U.uUnidad, unidad);
    gl.uniform2f(U.uHover, hover[0], hover[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  })();

  cargarTierra();
})();
