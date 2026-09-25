/* REEF Records · Océano en vista cenital (shader WebGL) + ondas del cursor */
(() => {
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Páginas interiores (sin scroll.js): el mar queda fijo en el abismo, como en la sección de la causa
  window.REEF = window.REEF || { prof: 1 };

  /* ───────── Mar en vista cenital (WebGL) ───────── */
  const mar = document.getElementById('mar');
  const gl = mar.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  const raton = { x: -999, y: -999, px: -999, py: -999, activo: false };
  let pulsoMar = { x: 0.5, y: 0.5, t: -100 };

  if (gl) {
    const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
    const fs = `
      precision highp float;
      uniform vec2 uRes;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec3 uPulse;
      uniform float uProf;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return -1.0 + 2.0*mix(mix(hash(i), hash(i+vec2(1.,0.)), u.x),
                              mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), u.x), u.y);
      }
      float octava(vec2 uv, float ch){
        uv += noise(uv);
        vec2 wv = 1.0 - abs(sin(uv));
        vec2 swv = abs(cos(uv));
        wv = mix(wv, swv, wv);
        return pow(1.0 - pow(wv.x*wv.y, 0.65), ch);
      }
      float altura(vec2 p){
        float t = uTime * 0.55;
        float freq = 0.16, amp = 0.6, ch = 4.0, h = 0.0;
        mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < 5; i++){
          float d = octava((p + t) * freq, ch);
          d += octava((p - t) * freq, ch);
          h += d * amp;
          p = m * p; freq *= 1.9; amp *= 0.22;
          ch = mix(ch, 1.0, 0.2);
        }
        return h;
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        float asp = uRes.x / uRes.y;
        vec2 p = vec2(uv.x * asp, uv.y) * 22.0;

        vec2 m = vec2(uMouse.x * asp, uMouse.y) * 22.0;
        float dm = length(p - m);
        p += normalize(p - m + 0.0001) * sin(dm * 1.4 - uTime * 3.0) * exp(-dm * 0.35) * 0.35;

        vec2 c = vec2(uPulse.x * asp, uPulse.y) * 22.0;
        float dc = length(p - c);
        float edad = uTime - uPulse.z;
        float anillo = exp(-pow(dc - edad * 9.0, 2.0) * 0.08) * exp(-edad * 0.9);
        p += normalize(p - c + 0.0001) * anillo * 0.9;

        float e = 0.08;
        float h = altura(p);
        float hx = altura(p + vec2(e, 0.0));
        float hy = altura(p + vec2(0.0, e));
        vec3 n = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 2.2));

        vec3 profundo = vec3(0.035, 0.16, 0.30);
        vec3 medio    = vec3(0.13, 0.40, 0.62);
        vec3 somero   = vec3(0.26, 0.58, 0.78);
        vec3 cielo    = vec3(0.70, 0.84, 0.95);
        vec3 marca    = vec3(0.396, 0.482, 0.714);

        float hn = clamp(h * 0.55, 0.0, 1.0);
        vec3 col = mix(profundo, medio, smoothstep(0.1, 0.7, hn));
        col = mix(col, somero, smoothstep(0.55, 1.0, hn) * 0.7);

        float incl = 1.0 - n.z;
        col = mix(col, cielo, clamp(incl * 1.4, 0.0, 0.45));

        vec3 L = normalize(vec3(0.35, 0.55, 0.9));
        vec3 R = reflect(-L, n);
        float spec = pow(max(R.z, 0.0), 120.0);
        col += vec3(0.9, 0.95, 1.0) * spec * 0.55;

        float espuma = smoothstep(1.05, 1.45, h) * (0.5 + 0.5 * noise(p * 3.0 + uTime));
        col = mix(col, vec3(0.88, 0.94, 1.0), espuma * 0.35);
        col = mix(col, vec3(0.9, 0.95, 1.0), anillo * 0.12);

        col = mix(col, col * (marca * 1.6), 0.18);
        // Descenso: al bajar, la luz se apaga y el agua se vuelve abisal
        float pr = smoothstep(0.0, 1.0, uProf);
        col = mix(col, vec3(0.012, 0.045, 0.09) + col * 0.12, pr * 0.9);
        gl_FragColor = vec4(col, 1.0);
      }
      `;

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

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uPulse = gl.getUniformLocation(prog, 'uPulse');
    const uProf = gl.getUniformLocation(prog, 'uProf');

    const ESCALA = 0.55; // resolución interna reducida para fluidez
    let pintado = false; // en el abismo basta un cuadro; se repinta si el lienzo cambia de tamaño
    function ajustarMar() {
      mar.width = Math.round(window.innerWidth * ESCALA);
      mar.height = Math.round(window.innerHeight * ESCALA);
      gl.viewport(0, 0, mar.width, mar.height);
      pintado = false;
    }
    ajustarMar();
    window.addEventListener('resize', ajustarMar);

    const suave = { x: 0.5, y: -2 };
    const inicio = performance.now();
    window.__tiempoMar = () => (performance.now() - inicio) / 1000 * (reducido ? 0.35 : 1);

    (function pintar() {
      if (window.REEF.prof > 0.995 && pintado) { requestAnimationFrame(pintar); return; }
      pintado = true;
      const t = window.__tiempoMar();
      const objX = raton.activo ? raton.x / window.innerWidth : suave.x;
      const objY = raton.activo ? 1 - raton.y / window.innerHeight : -2;
      suave.x += (objX - suave.x) * 0.06;
      suave.y += (objY - suave.y) * 0.06;
      gl.uniform2f(uRes, mar.width, mar.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, suave.x, suave.y);
      gl.uniform3f(uPulse, pulsoMar.x, pulsoMar.y, pulsoMar.t);
      gl.uniform1f(uProf, window.REEF.prof);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(pintar);
    })();
  }



  /* ───────── Cursor: estela y ondas sobre el agua ───────── */
  window.addEventListener('pointermove', e => {
    raton.x = e.clientX; raton.y = e.clientY; raton.activo = true;
  });
  document.documentElement.addEventListener('pointerleave', () => { raton.activo = false; });
  function onda(x, y) {
    if (!window.__tiempoMar) return;
    pulsoMar = { x: x / window.innerWidth, y: 1 - y / window.innerHeight, t: window.__tiempoMar() };
  }
  window.addEventListener('pointerdown', e => {
    if (e.target.closest('.accion, .marca, main') || window.REEF.prof > 0.5) return;
    onda(e.clientX, e.clientY);
  });
  const accion = document.getElementById('accion');
  if (accion) accion.addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    onda(r.left + r.width / 2, r.top + r.height / 2);
    setTimeout(() => window.REEF.entrar(), reducido ? 0 : 350);
  });
})();
