<template>
  <canvas id="tiburon" ref="lienzo" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
/* REEF Records · Tiburón zorro de partículas (WebGL sobre three.js: Points + RawShaderMaterial)
   La nieve marina dispersa se reúne en un tiburón hecho de hebras de luz al bajar a la sección 2. */
import {
  AddEquation, BufferGeometry, CustomBlending, InterleavedBuffer, InterleavedBufferAttribute,
  OneFactor, Points, RawShaderMaterial, Scene, Vector2
} from 'three'
import { camaraNula, crearRenderer, esReducido, fijarTamano } from '~/utils/gl'

const lienzo = ref<HTMLCanvasElement | null>(null)
const reef = useReef()
let limpiar = () => {}

/* ── Trazos del tiburón (vista lateral, unidades de un lienzo de 400 × 140) ── */
const TRAZOS: [string, number, number][] = [
  // [trazo SVG, hebras, amplitud de dispersión]
  ['M20,80 C40,66 90,56 150,58 L168,57 C175,42 183,30 190,25 C192,38 196,50 205,59 C240,62 270,66 292,72 C322,60 352,38 394,8 C368,44 340,70 306,81 C318,87 330,96 342,104 C322,101 306,95 292,89 C270,93 240,96 202,98 C197,104 192,110 186,113 C184,107 182,102 178,100 C150,101 120,100 100,98 C92,110 84,124 72,133 C74,119 76,107 80,96 C60,94 36,90 20,80 Z', 14, 5],
  ['M26,79 C90,72 180,74 240,78 C262,79 280,77 296,77', 9, 4],          // línea lateral
  ['M292,74 C324,58 356,34 392,10', 7, 3.5],                              // lóbulo superior de la cola
  ['M170,58 C178,44 184,34 190,26', 5, 2.5],                              // aleta dorsal
  ['M84,97 C80,110 76,122 73,131', 5, 2.5],                               // aleta pectoral
  ['M298,86 C312,92 326,98 340,104', 4, 2.5],                             // lóbulo inferior
  ['M60,70 C62,76 62,82 60,88', 3, 1.2],                                  // branquias
  ['M66,69 C68,76 68,83 66,90', 3, 1.2],
  ['M72,68 C74,75 74,83 72,90', 3, 1.2],
  ['M44,86 C60,92 90,97 120,99 C160,100 190,99 210,98', 6, 3.5]           // vientre interior
]

/* ── Shaders ── */
const vs = `
    attribute vec2 aBase;
    attribute vec2 aNormal;
    attribute vec4 aDato;     // recorrido, semilla, profundidad, tamaño
    attribute vec2 aInicio;
    attribute float aTipo;
    uniform float uT, uForma, uAsp, uEscala, uDpr, uGiro;
    uniform vec2 uCentro, uPos, uMouse;
    varying float vBrillo, vAlfa, vTipo, vTono;

    void main() {
      float s = aDato.y;
      float prof = aDato.z;
      vec2 q;
      float forma = 1.0;

      if (aTipo < 0.5) {
        vec2 p = aBase;
        // nado: la ondulación crece hacia la cola
        float cola = smoothstep(140.0, 400.0, p.x);
        p.y += sin(p.x * 0.016 - uT * 1.05) * 11.0 * cola;
        p.y += sin(uT * 0.45) * 2.5;
        // las hebras respiran
        p += aNormal * sin(aDato.x * 0.045 + uT * (0.5 + s * 0.7) + s * 25.0) * (1.2 + prof * 2.8);

        q = (p - uCentro) * uEscala;
        q.y = -q.y;
        float c = cos(uGiro), sn = sin(uGiro);
        q = mat2(c, sn, -sn, c) * q + uPos;

        // se forma a partir de la nieve marina, cada hebra a su ritmo
        forma = clamp(uForma * 1.3 - s * 0.3, 0.0, 1.0);
        forma = forma * forma * (3.0 - 2.0 * forma);
        vec2 ini = aInicio + vec2(sin(uT * 0.21 + s * 31.0), cos(uT * 0.17 + s * 47.0)) * 0.06;
        q = mix(ini, q, forma);
      } else {
        // deriva lenta de la nieve marina, con vuelta al borde
        vec2 v = vec2(sin(s * 12.0) * 0.012, 0.018 + s * 0.02);
        q = aInicio + v * uT + vec2(sin(uT * 0.3 + s * 40.0) * 0.03, 0.0);
        q = mod(q + vec2(1.9, 1.15), vec2(3.8, 2.3)) - vec2(1.9, 1.15);
      }

      // el cursor aparta las partículas con suavidad
      vec2 d = q - uMouse;
      float dm = length(d);
      q += normalize(d + 1e-4) * 0.07 * exp(-dm * dm * 30.0);

      gl_Position = vec4(q.x / uAsp, q.y, 0.0, 1.0);

      float pulso = 0.5 + 0.5 * sin(aDato.x * 0.03 - uT * 2.0 + s * 6.2831);
      vBrillo = pow(pulso, 4.0);
      vTipo = aTipo;
      vTono = s;
      vAlfa = (aTipo < 0.5)
        ? mix(0.3, 1.0, forma) * (0.55 + 0.45 * (1.0 - prof)) * 1.25
        : 0.25 + 0.35 * (1.0 - prof);
      gl_PointSize = aDato.w * uDpr * (1.0 + vBrillo * 0.9) * (1.0 - prof * 0.35);
    }`
const fs = `
    precision mediump float;
    uniform float uOpac;
    varying float vBrillo, vAlfa, vTipo, vTono;
    void main() {
      float r = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, r);
      a *= a;
      vec3 turquesa = vec3(0.0, 0.66, 0.91);
      vec3 marca = vec3(0.40, 0.48, 0.71);
      vec3 espuma = vec3(0.82, 0.96, 1.0);
      vec3 c;
      if (vTipo < 0.5) {
        c = mix(turquesa, espuma, vBrillo * 0.85);
        c = mix(c, marca, step(0.82, vTono) * 0.6);
      } else {
        c = mix(turquesa * 0.8, marca, step(0.6, vTono));
      }
      float k = a * vAlfa * uOpac;
      gl_FragColor = vec4(c * k, k);
    }`

onMounted(() => {
  const reducido = esReducido()
  const cv = lienzo.value!
  const renderer = crearRenderer(cv, { antialias: false, alpha: true, premultipliedAlpha: true })
  if (!renderer) return

  const DENSIDAD = window.innerWidth < 700 ? 1.2 : 0.8   // unidades entre partículas por hebra
  const AMBIENTE = window.innerWidth < 700 ? 700 : 1600

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0')
  svg.style.position = 'absolute'; svg.style.visibility = 'hidden'
  document.body.appendChild(svg)

  const datos: number[] = []   // base x,y | normal x,y | recorrido, semilla, profundidad, tamaño | inicio x,y | tipo
  const azar = (a: number, b: number) => a + Math.random() * (b - a)
  const inicioAleatorio = () => [azar(-1.9, 1.9), azar(-1.15, 1.15)] as [number, number]

  for (const [d, hebras, amp] of TRAZOS) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', d)
    svg.appendChild(p)
    const largo = p.getTotalLength()
    const n = Math.floor(largo / DENSIDAD)
    const pts: [number, number][] = []
    for (let i = 0; i <= n; i++) {
      const q = p.getPointAtLength((i / n) * largo)
      pts.push([q.x, q.y])
    }
    for (let h = 0; h < hebras; h++) {
      const semilla = Math.random()
      const prof = Math.random()
      const a1 = azar(-amp, amp), a2 = azar(-amp, amp) * 0.6
      const f1 = azar(0.008, 0.025), f2 = azar(0.03, 0.07)
      const ph1 = azar(0, 6.28), ph2 = azar(0, 6.28)
      for (let i = 0; i < pts.length; i++) {
        if (Math.random() < 0.18) continue           // huecos: hebras punteadas como en la referencia
        const a = pts[Math.max(0, i - 1)]!, b = pts[Math.min(pts.length - 1, i + 1)]!
        let nx = -(b[1] - a[1]), ny = b[0] - a[0]
        const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l
        const u = i * DENSIDAD
        const off = a1 * Math.sin(u * f1 + ph1) + a2 * Math.sin(u * f2 + ph2)
        const [ix, iy] = inicioAleatorio()
        datos.push(
          pts[i]![0] + nx * off, pts[i]![1] + ny * off,
          nx, ny,
          u, semilla, prof, azar(2.0, 4.2),
          ix, iy,
          0
        )
      }
    }
  }
  // nieve marina ambiental
  for (let i = 0; i < AMBIENTE; i++) {
    const [ix, iy] = inicioAleatorio()
    datos.push(0, 0, 0, 0, Math.random() * 1000, Math.random(), Math.random(), azar(1.2, 3.8), ix, iy, 1)
  }
  svg.remove()
  const STRIDE = 11
  const total = datos.length / STRIDE

  const bufer = new InterleavedBuffer(new Float32Array(datos), STRIDE)
  const geometria = new BufferGeometry()
  geometria.setAttribute('aBase', new InterleavedBufferAttribute(bufer, 2, 0))
  geometria.setAttribute('aNormal', new InterleavedBufferAttribute(bufer, 2, 2))
  geometria.setAttribute('aDato', new InterleavedBufferAttribute(bufer, 4, 4))
  geometria.setAttribute('aInicio', new InterleavedBufferAttribute(bufer, 2, 8))
  geometria.setAttribute('aTipo', new InterleavedBufferAttribute(bufer, 1, 10))
  geometria.setDrawRange(0, total)

  const U = {
    uT: { value: 0 }, uForma: { value: 0 }, uAsp: { value: 1 }, uEscala: { value: 1 }, uDpr: { value: 1 },
    uGiro: { value: 0 }, uCentro: { value: new Vector2() }, uPos: { value: new Vector2() },
    uMouse: { value: new Vector2() }, uOpac: { value: 0 }
  }
  const material = new RawShaderMaterial({
    vertexShader: vs, fragmentShader: fs, uniforms: U,
    transparent: true, depthTest: false, depthWrite: false,
    // suma de luz: las hebras brillan donde se cruzan (gl.blendFunc(ONE, ONE))
    blending: CustomBlending, blendEquation: AddEquation, blendSrc: OneFactor, blendDst: OneFactor
  })
  const puntos = new Points(geometria, material)
  puntos.frustumCulled = false
  const escena = new Scene()
  escena.add(puntos)
  const camara = camaraNula()

  let dpr = 1, asp = 1
  function ajustar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    fijarTamano(renderer!, Math.round(window.innerWidth * dpr), Math.round(window.innerHeight * dpr))
    asp = window.innerWidth / window.innerHeight
  }
  ajustar()
  window.addEventListener('resize', ajustar)

  // cursor en coordenadas del tiburón (alto de pantalla = 2)
  const cursor = { x: 9, y: 9 }, suave = { x: 9, y: 9 }
  const alMover = (e: PointerEvent) => {
    cursor.x = (e.clientX / window.innerWidth * 2 - 1) * asp
    cursor.y = 1 - e.clientY / window.innerHeight * 2
  }
  const alSalir = () => { cursor.x = 9; cursor.y = 9 }
  window.addEventListener('pointermove', alMover)
  document.documentElement.addEventListener('pointerleave', alSalir)

  let raf = 0
  const inicio = performance.now()
  function dibujar() {
    raf = requestAnimationFrame(dibujar)
    const op = reef.aparece
    cv.style.opacity = op > 0.001 ? '1' : '0'
    if (op <= 0.001) return

    const t = (performance.now() - inicio) / 1000 * (reducido ? 0.35 : 1)
    suave.x += (cursor.x - suave.x) * 0.08
    suave.y += (cursor.y - suave.y) * 0.08

    const movil = asp < 0.9
    // ancho del tiburón en pantalla y posición de su centro
    const ancho = movil ? asp * 1.75 : Math.min(asp * 1.02, 2.1)
    const pos: [number, number] = movil ? [0.0, 0.68] : [asp * 0.43, 0.08]
    pos[0] += Math.sin(t * 0.23) * 0.035
    pos[1] += Math.sin(t * 0.31) * 0.025

    U.uT.value = t
    U.uForma.value = reef.forma
    U.uAsp.value = asp
    U.uEscala.value = ancho / 380
    U.uDpr.value = dpr
    U.uGiro.value = 0.1 + Math.sin(t * 0.2) * 0.03
    U.uCentro.value.set(205, 70)
    U.uPos.value.set(pos[0], pos[1])
    U.uMouse.value.set(suave.x, suave.y)
    U.uOpac.value = op
    renderer!.render(escena, camara)
  }
  dibujar()

  limpiar = () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', ajustar)
    window.removeEventListener('pointermove', alMover)
    document.documentElement.removeEventListener('pointerleave', alSalir)
    geometria.dispose(); material.dispose(); renderer!.dispose()
  }
})

onBeforeUnmount(() => limpiar())
</script>
