<template>
  <figure class="animal">
    <canvas id="especie" ref="lienzo" aria-hidden="true"></canvas>
    <figcaption id="vista-texto">{{ vista }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
/* REEF Records · Ciencia: la especie en bitmap (shader WebGL sobre three.js)
   Cada silueta se describe con funciones de distancia, se ilumina y se reduce a una retícula
   de píxeles con tramado ordenado (Bayer 8×8). El cambio de especie ocurre píxel a píxel. */
import { Vector2 } from 'three'
import { camaraNula, crearRenderer, esReducido, fijarTamano, pantallaCompleta } from '~/utils/gl'

const props = defineProps<{ especie: string, vista: string }>()

const lienzo = ref<HTMLCanvasElement | null>(null)
// 0 = mantarraya, 1 = tiburón martillo (antes: evento "especie" en document)
let objetivo = props.especie === 'martillo' ? 1 : 0
watch(() => props.especie, id => { objetivo = id === 'martillo' ? 1 : 0 })
let limpiar = () => {}

const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
const fs = `
    precision highp float;
    uniform vec2 uRes, uRaton;
    uniform float uT, uMezcla, uCelda, uEscala;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
    float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
    float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }
    vec2 girar(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }

    float capsula(vec2 p, vec2 a, vec2 b, float r){
      vec2 pa = p - a, ba = b - a;
      return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)) - r;
    }
    float triangulo(vec2 p, vec2 p0, vec2 p1, vec2 p2){
      vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2;
      vec2 v0 = p - p0, v1 = p - p1, v2 = p - p2;
      vec2 q0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
      vec2 q1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
      vec2 q2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
      float s = sign(e0.x * e2.y - e0.y * e2.x);
      vec2 d = min(min(vec2(dot(q0, q0), s * (v0.x * e0.y - v0.y * e0.x)),
                       vec2(dot(q1, q1), s * (v1.x * e1.y - v1.y * e1.x))),
                       vec2(dot(q2, q2), s * (v2.x * e2.y - v2.y * e2.x)));
      return -sqrt(d.x) * sign(d.y);
    }

    // Mantarraya gigante, vista dorsal, cabeza hacia +y
    float manta(vec2 q, float t, float lw, float cu){
      float fase = t * 1.2;
      float ax = abs(q.x);
      // al aletear el ala se acorta vista desde arriba y la punta se arquea con retraso
      float span = 0.98 * (0.72 + 0.28 * smoothstep(0.0, 1.0, abs(cos(fase))));
      float u = clamp(ax / span, 0.0, 1.0);
      float y = q.y - sin(fase - 1.4 * u) * 0.09 * u * u;
      // borde de ataque convexo; borde de salida cóncavo; puntas echadas hacia atrás
      float frente = 0.34 - 0.54 * pow(u, 1.8);
      float atras = -0.46 + 0.26 * u + 0.13 * sin(3.14159 * u);
      atras = min(atras, mix(-0.54, atras, smoothstep(0.03, 0.10, ax)));   // aletas pélvicas
      float d = max(max(atras - y, y - frente), ax - span);
      d = min(d, capsula(vec2(ax, q.y), vec2(0.125, 0.30), vec2(0.10, 0.45), 0.03));   // aletas cefálicas
      float vaiven = sin(t * 2.2 + q.y * 5.0) * 0.035 * clamp(-q.y - 0.5, 0.0, 1.0);
      d = min(d, max(abs(q.x - vaiven) - max(0.01, cu * 0.6), max(-1.08 - q.y, q.y + 0.45)));   // cola
      if (d >= 0.0) return 0.0;

      float I = 0.28 + 0.55 * (1.0 - smoothstep(0.0, lw, -d));
      // manchas blancas de los hombros: la "T" dorsal característica de M. birostris
      float hombro = smoothstep(0.10, 0.20, u) * (1.0 - smoothstep(0.34, 0.50, u))
                   * smoothstep(-0.04, 0.06, y) * (1.0 - smoothstep(0.16, 0.26, y));
      float lomo = (1.0 - smoothstep(0.0, 0.05, ax)) * step(-0.45, q.y);
      I += 0.34 * hombro + 0.12 * lomo - 0.12 * u;
      if (ax < 0.085 && abs(q.y - 0.325) < max(0.012, cu * 0.5)) I *= 0.25;   // boca
      return clamp(I, 0.0, 1.0);
    }

    // Tiburón martillo común, vista dorsal, cabeza hacia +y
    float martillo(vec2 q, float t, float lw, float cu){
      float s = clamp((q.y + 0.95) / 1.45, 0.0, 1.0);           // 0 cola → 1 cabeza
      float x = q.x - sin(q.y * 3.2 - t * 3.0) * 0.075 * pow(1.0 - s, 1.6);   // nado: la onda crece hacia la cola
      float ax = abs(x);
      float w = 0.125 * smoothstep(0.0, 0.55, s) * (1.0 - 0.45 * smoothstep(0.7, 1.0, s)) + max(0.012, cu * 0.6);
      float d = max(ax - w, max(-0.95 - q.y, q.y - 0.52));
      // cefalofolio, con la muesca central de S. lewini
      float k = clamp(ax / 0.30, 0.0, 1.0);
      float fr = 0.585 - 0.075 * k * k - 0.02 * exp(-pow(ax / 0.035, 2.0));
      float tr = fr - 0.085 + 0.035 * k * k;
      d = min(d, max(max(q.y - fr, tr - q.y), ax - 0.30));
      d = min(d, triangulo(vec2(ax, q.y), vec2(0.07, 0.17), vec2(0.37, -0.10), vec2(0.08, 0.02)));    // pectorales
      d = min(d, triangulo(vec2(ax, q.y), vec2(0.04, -0.38), vec2(0.12, -0.50), vec2(0.03, -0.48)));  // pélvicas
      vec2 c = vec2(x, q.y);
      d = min(d, triangulo(c, vec2(-0.02, -0.88), vec2(0.02, -0.92), vec2(0.13, -1.32)));   // lóbulo caudal superior
      d = min(d, triangulo(c, vec2(-0.015, -0.90), vec2(0.015, -0.95), vec2(-0.08, -1.08))); // lóbulo inferior
      if (d >= 0.0) return 0.0;

      float I = 0.28 + 0.55 * (1.0 - smoothstep(0.0, lw, -d));
      I += 0.25 * (1.0 - smoothstep(0.0, max(0.018, cu * 0.7), ax)) * step(0.30, s) * step(s, 0.62);   // aleta dorsal
      I -= 0.10 * (1.0 - s);
      float ojo = length(vec2(ax - 0.285, q.y - (fr + tr) * 0.5));
      I = max(I, 1.0 - smoothstep(max(0.018, cu * 0.7), max(0.018, cu * 0.7) + lw * 0.5, ojo));   // ojos en los extremos
      return clamp(I, 0.0, 1.0);
    }

    void main(){
      vec2 celda = floor(gl_FragCoord.xy / uCelda);
      vec2 centro = (celda + 0.5) * uCelda;
      vec2 p = (centro - uRes * 0.5) / uEscala;
      float cu = uCelda / uEscala;           // tamaño de un píxel del bitmap en unidades de la silueta
      float lw = cu * 1.6;
      float t = uT;

      vec2 deriva = vec2(sin(t * 0.31) * 0.05, sin(t * 0.43) * 0.04);
      vec2 qm = girar(p - deriva, 0.35 + sin(t * 0.20) * 0.05) + vec2(0.0, -0.28);
      vec2 qs = girar(p - deriva, 1.05 + sin(t * 0.25) * 0.06) + vec2(0.0, -0.37);
      float Im = manta(qm, t, lw, cu);
      float Is = martillo(qs, t, lw, cu);

      // cambio de especie píxel a píxel, con una franja que parpadea
      float h = hash(celda);
      float I = mix(Im, Is, step(h, uMezcla));
      float franja = (1.0 - smoothstep(0.0, 0.06, abs(h - uMezcla))) * step(0.001, uMezcla) * step(uMezcla, 0.999);
      I = max(I, franja * step(0.55, hash(celda + floor(t * 18.0))) * step(0.001, max(Im, Is)) * 0.9);

      // barrido de escaneo y brillo bajo el cursor
      float dentro = step(0.001, I);
      I += dentro * 0.16 * exp(-pow((p.y - (fract(t * 0.12) * 3.2 - 1.6)) * 7.0, 2.0));
      float dr = length(centro - uRaton) / uEscala;
      I += dentro * 0.4 * exp(-dr * dr * 30.0);

      // tramado ordenado → píxel encendido o apagado
      float on = dentro * step(bayer8(celda) * 0.92 + 0.04, I);
      vec2 f = fract(gl_FragCoord.xy / uCelda);
      float cuadro = step(0.14, f.x) * step(f.x, 0.86) * step(0.14, f.y) * step(f.y, 0.86);

      vec3 marca = vec3(0.40, 0.48, 0.71), turquesa = vec3(0.0, 0.66, 0.91), espuma = vec3(0.82, 0.96, 1.0);
      vec3 c = mix(marca, turquesa, smoothstep(0.25, 0.6, I));
      c = mix(c, espuma, smoothstep(0.75, 1.0, I));
      float a = on * cuadro * (0.55 + 0.45 * min(I, 1.0));
      // retícula tenue de la pantalla de puntos
      float fondo = cuadro * 0.045 * (1.0 - smoothstep(0.6, 1.25, length(p)));
      gl_FragColor = vec4(c * a + marca * fondo * (1.0 - a), a + fondo * (1.0 - a));
    }`

onMounted(() => {
  const reducido = esReducido()
  const cv = lienzo.value!
  const renderer = crearRenderer(cv, { antialias: false, alpha: true, premultipliedAlpha: true })
  if (!renderer) return

  const U = {
    uRes: { value: new Vector2() }, uRaton: { value: new Vector2() },
    uT: { value: 0 }, uMezcla: { value: 0 }, uCelda: { value: 5 }, uEscala: { value: 1 }
  }
  const { escena, material, geometria } = pantallaCompleta(vs, fs, U)
  const camara = camaraNula()

  let dpr = 1
  function ajustar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    fijarTamano(renderer!, Math.round(cv.clientWidth * dpr), Math.round(cv.clientHeight * dpr))
  }
  const observaTamano = new ResizeObserver(ajustar)
  observaTamano.observe(cv)
  ajustar()

  // cursor en píxeles del lienzo (origen abajo, como gl_FragCoord)
  const raton = { x: -1e4, y: -1e4 }, suave = { x: -1e4, y: -1e4 }
  const alMover = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect()
    raton.x = (e.clientX - r.left) * dpr
    raton.y = (r.bottom - e.clientY) * dpr
    if (suave.x < -1e3) { suave.x = raton.x; suave.y = raton.y }
  }
  const alSalir = () => { raton.x = raton.y = suave.x = suave.y = -1e4 }
  window.addEventListener('pointermove', alMover)
  document.documentElement.addEventListener('pointerleave', alSalir)

  let mezcla = 0

  let visible = true
  const observaVista = new IntersectionObserver(([en]) => { visible = en!.isIntersecting })
  observaVista.observe(cv)
  let raf = 0
  const inicio = performance.now()
  let antes = inicio
  function dibujar(ahora = performance.now()) {
    raf = requestAnimationFrame(dibujar)
    const dt = Math.min((ahora - antes) / 1000, 0.1)
    antes = ahora
    if (!visible) return
    const paso = reducido ? 1 : dt / 1.3
    mezcla += Math.max(-paso, Math.min(paso, objetivo - mezcla))
    suave.x += (raton.x - suave.x) * 0.15
    suave.y += (raton.y - suave.y) * 0.15

    U.uRes.value.set(cv.width, cv.height)
    U.uRaton.value.set(suave.x, suave.y)
    U.uT.value = (ahora - inicio) / 1000 * (reducido ? 0.3 : 1)
    U.uMezcla.value = mezcla
    U.uCelda.value = Math.max(3, Math.round(5 * dpr))
    U.uEscala.value = Math.min(cv.width / 2.2, cv.height / 1.95)
    renderer!.render(escena, camara)
  }
  dibujar()

  limpiar = () => {
    cancelAnimationFrame(raf)
    observaTamano.disconnect(); observaVista.disconnect()
    window.removeEventListener('pointermove', alMover)
    document.documentElement.removeEventListener('pointerleave', alSalir)
    geometria.dispose(); material.dispose(); renderer!.dispose()
  }
})

onBeforeUnmount(() => limpiar())
</script>
