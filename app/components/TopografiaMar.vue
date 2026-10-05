<template>
  <canvas ref="lienzo" class="topografia" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
/* REEF Records · Causas: estampado topográfico en movimiento (WebGL sobre three.js).
   Curvas de nivel que derivan sobre un fondo en semitono con la escala del azul REEF, con faltas de tinta, motas y rayones,
   como una serigrafía. Viene de landing-mobula/causas.html. Se detiene fuera de pantalla. */
import { GLSL3, Vector2 } from 'three'
import { camaraNula, crearRenderer, esReducido, fijarTamano, pantallaCompleta } from '~/utils/gl'

const lienzo = ref<HTMLCanvasElement | null>(null)
let limpiar = () => {}

const vs = `in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
const fs = `
precision highp float;
uniform vec2 uRes, uRaton;
uniform float uT, uDpr;
out vec4 color;
float hash(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= .5; } return s; }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 px = gl_FragCoord.xy;
  vec2 p = px / uRes.y * 2.1 + uRaton * .06;
  float t = uT * .03;
  // campo de alturas deformado -> curvas de nivel
  vec3 q = vec3(p, t);
  vec2 w = vec2(fbm(q), fbm(q + vec3(5.2, 1.3, 2.8)));
  float v = fbm(vec3(p + 1.7 * w, t * 1.4)) * 10.;
  float d = abs(fract(v + .5) - .5) / max(fwidth(v), 1e-4);      // distancia a la curva más cercana, en px
  float grosor = (.7 + 1.1 * noise(vec3(p * 2.6, t))) * uDpr;      // la presión del trazo cambia a lo largo de la línea
  float linea = 1. - smoothstep(grosor - .8, grosor + .8, d);
  float grano = h2(floor(px / (1.6 * uDpr)));
  linea *= smoothstep(.05, .4, grano * .6 + noise(vec3(p * 16., 1.)) * .7);   // faltas de tinta
  // fondo en semitono girado
  float a = .785; vec2 hp = mat2(cos(a), -sin(a), sin(a), cos(a)) * px / (4.2 * uDpr);
  float tono = fbm(vec3(p * 1.3, t * .6 + 3.));
  float r = .16 + .26 * tono;
  float punto = 1. - smoothstep(r - .09, r + .09, length(fract(hp) - .5));
  vec3 hondo = vec3(.198, .241, .357), claro = vec3(.396, .482, .714);   // azul REEF a media luz y al 100 %
  vec3 col = mix(hondo, claro, tono * .55 + punto * .32);
  // motas y rayones
  float mancha = noise(vec3(p * 5., 7.));
  col = mix(col, vec3(.878, .898, .941), step(.982, h2(floor(px / (2. * uDpr)) + 3.)) * smoothstep(.45, .75, mancha) * .85);
  float raya = noise(vec3(p.x * 38., p.y * 1.6, 4.));
  col = mix(col, vec3(.757, .792, .886), smoothstep(.9, .97, raya) * .14);
  col = mix(col, vec3(.95, .96, .98), linea);
  vec2 uv = px / uRes - .5;
  col *= 1. - .35 * dot(uv, uv);
  color = vec4(col, 1.);
}`

onMounted(() => {
  const cv = lienzo.value!
  const renderer = crearRenderer(cv, { alpha: false, premultipliedAlpha: false })
  if (!renderer) return   // sin WebGL2 queda el azul de fondo del CSS
  const U = { uRes: { value: new Vector2() }, uRaton: { value: new Vector2() }, uT: { value: 0 }, uDpr: { value: 1 } }
  const { escena, material, geometria } = pantallaCompleta(vs, fs, U)
  material.glslVersion = GLSL3   // fwidth() sin extensiones
  const camara = camaraNula()
  const reducido = esReducido()
  // el trazo es fino: más resolución no se nota y cuesta mucho en pantallas grandes
  const dpr = Math.min(window.devicePixelRatio || 1, 1.25)

  const dibujar = (ms: number) => {
    U.uRes.value.set(cv.width, cv.height)
    U.uT.value = ms / 1000
    U.uDpr.value = dpr
    renderer.render(escena, camara)
  }
  const ajustar = () => {
    fijarTamano(renderer, Math.round(cv.clientWidth * dpr), Math.round(cv.clientHeight * dpr))
    if (reducido) dibujar(0)
  }
  const observaTamano = new ResizeObserver(ajustar)
  observaTamano.observe(cv)
  ajustar()

  const raton = { x: 0, y: 0 }
  const alMover = (e: PointerEvent) => { raton.x = e.clientX / innerWidth - .5; raton.y = .5 - e.clientY / innerHeight }
  window.addEventListener('pointermove', alMover, { passive: true })

  let visible = true, raf = 0
  const observaVista = new IntersectionObserver(([en]) => { visible = en!.isIntersecting })
  observaVista.observe(cv)
  const bucle = (ms: number) => {
    raf = requestAnimationFrame(bucle)
    if (!visible) return
    U.uRaton.value.x += (raton.x - U.uRaton.value.x) * .04
    U.uRaton.value.y += (raton.y - U.uRaton.value.y) * .04
    dibujar(ms)
  }
  if (reducido) dibujar(0)
  else raf = requestAnimationFrame(bucle)

  limpiar = () => {
    cancelAnimationFrame(raf)
    observaTamano.disconnect(); observaVista.disconnect()
    window.removeEventListener('pointermove', alMover)
    geometria.dispose(); material.dispose(); renderer.dispose()
  }
})
onBeforeUnmount(() => limpiar())
</script>
