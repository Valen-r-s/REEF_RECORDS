<template>
  <canvas id="nieve" ref="lienzo" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
/* REEF Records · Nieve marina (WebGL sobre three.js: Points + RawShaderMaterial)
   La misma deriva de partículas que acompaña al tiburón en la sección de la causa, sola, como fondo. */
import {
  AddEquation, BufferGeometry, CustomBlending, InterleavedBuffer, InterleavedBufferAttribute,
  OneFactor, Points, RawShaderMaterial, Scene, Vector2
} from 'three'
import { camaraNula, crearRenderer, esReducido, fijarTamano } from '~/utils/gl'

const lienzo = ref<HTMLCanvasElement | null>(null)
let limpiar = () => {}

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
    }`
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
    }`

onMounted(() => {
  const reducido = esReducido()
  const cv = lienzo.value!
  const renderer = crearRenderer(cv, { antialias: false, alpha: true, premultipliedAlpha: true })
  if (!renderer) return

  const CANTIDAD = window.innerWidth < 700 ? 700 : 1600
  const azar = (a: number, b: number) => a + Math.random() * (b - a)
  const datos: number[] = []   // inicio x,y | semilla, profundidad, tamaño
  for (let i = 0; i < CANTIDAD; i++) {
    datos.push(azar(-1.9, 1.9), azar(-1.15, 1.15), Math.random(), Math.random(), azar(1.2, 3.8))
  }

  const bufer = new InterleavedBuffer(new Float32Array(datos), 5)
  const geometria = new BufferGeometry()
  geometria.setAttribute('aInicio', new InterleavedBufferAttribute(bufer, 2, 0))
  geometria.setAttribute('aDato', new InterleavedBufferAttribute(bufer, 3, 2))
  geometria.setDrawRange(0, CANTIDAD)

  const U = { uT: { value: 0 }, uAsp: { value: 1 }, uDpr: { value: 1 }, uMouse: { value: new Vector2() } }
  const material = new RawShaderMaterial({
    vertexShader: vs, fragmentShader: fs, uniforms: U,
    transparent: true, depthTest: false, depthWrite: false,
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
    const t = (performance.now() - inicio) / 1000 * (reducido ? 0.35 : 1)
    suave.x += (cursor.x - suave.x) * 0.08
    suave.y += (cursor.y - suave.y) * 0.08
    U.uT.value = t
    U.uAsp.value = asp
    U.uDpr.value = dpr
    U.uMouse.value.set(suave.x, suave.y)
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
