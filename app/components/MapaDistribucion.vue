<template>
  <section class="mapa" aria-labelledby="mapa-t">
    <h2 id="mapa-t" class="oculto">Distribución</h2>
    <canvas id="mapa" ref="lienzo" role="img" :aria-label="etiqueta"></canvas>
    <div class="mapa-pie">
      <p class="leyenda">
        <svg viewBox="0 0 20 22" aria-hidden="true"><path d="M10 1.5 18.2 6.2v9.6L10 20.5 1.8 15.8V6.2z" /><circle cx="10" cy="11" r="3.4" /></svg>
        Distribución aproximada · a mayor círculo, más registros
      </p>
      <p id="mapa-lectura" class="lectura" aria-hidden="true">{{ lectura }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
/* REEF Records · Ciencia: mapa de distribución (shader WebGL sobre three.js)
   La tierra se rasteriza una vez a una textura; los hexágonos se calculan en el fragment shader
   a partir de una textura de densidad (un texel por celda hexagonal). */
import {
  CanvasTexture, ClampToEdgeWrapping, DataTexture, LinearFilter, NearestFilter, RedFormat, UnsignedByteType, Vector2
} from 'three'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { ESPECIES } from '~/data/ciencia-datos'
import { camaraNula, crearRenderer, esReducido, fijarTamano, pantallaCompleta } from '~/utils/gl'

const props = defineProps<{ especie: string, etiqueta: string }>()

const INICIAL = 'Toca o pasa el cursor por el mapa'
const lectura = ref(INICIAL)
const lienzo = ref<HTMLCanvasElement | null>(null)
let alCambiar: (id: string) => void = () => {}
let limpiar = () => {}

// Cambio de especie (antes: evento "especie" en document)
watch(() => props.especie, id => alCambiar(id))

/* ───────── Shaders ───────── */
const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
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
    }`

onMounted(() => {
  const reducido = esReducido()
  const cv = lienzo.value!
  const renderer = crearRenderer(cv, { antialias: false, alpha: true, premultipliedAlpha: true })
  if (!renderer) return

  // Recorte equirectangular: sin el Ártico profundo ni la Antártida, donde no hay registros
  const LAT_N = 80, LAT_S = -60, ALTO = LAT_N - LAT_S
  const RAIZ3 = Math.sqrt(3)
  const TIERRA_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json'

  /* ───────── Tierra ───────── */
  const TW = 2048, TH = Math.round(TW * ALTO / 360)
  const lienzoTierra = document.createElement('canvas')
  lienzoTierra.width = TW; lienzoTierra.height = TH
  const texTierra = new CanvasTexture(lienzoTierra)
  texTierra.minFilter = LinearFilter; texTierra.magFilter = LinearFilter
  texTierra.wrapS = texTierra.wrapT = ClampToEdgeWrapping
  texTierra.generateMipmaps = false
  texTierra.flipY = true
  let mascara: Uint8ClampedArray | null = null   // píxeles de la tierra para descartar puntos en tierra firme

  const U = {
    uRes: { value: new Vector2() }, uTex: { value: new Vector2() }, uHover: { value: new Vector2() },
    uT: { value: 0 }, uMezcla: { value: 1 }, uUnidad: { value: 0 },
    uAlto: { value: ALTO }, uEcuador: { value: -LAT_S },
    uTierra: { value: texTierra }, uDatosA: { value: null as DataTexture | null }, uDatosB: { value: null as DataTexture | null }
  }
  const { escena, material, geometria } = pantallaCompleta(vs, fs, U)
  const camara = camaraNula()

  function subirTierra() {
    texTierra.needsUpdate = true
  }

  async function cargarTierra() {
    try {
      const topo = await fetch(TIERRA_URL).then(r => r.json())
      const tierra = feature(topo, topo.objects.land)
      const escala = TW / (2 * Math.PI)
      const proy = geoEquirectangular().scale(escala).translate([TW / 2, escala * LAT_N * Math.PI / 180])
      const c = lienzoTierra.getContext('2d')!
      const trazo = geoPath(proy, c)
      c.fillStyle = '#f00'
      c.beginPath(); trazo(tierra as any); c.fill()
      mascara = c.getImageData(0, 0, TW, TH).data
      // la costa va en el canal verde, sumada sobre el relleno
      c.globalCompositeOperation = 'lighter'
      c.strokeStyle = '#0f0'; c.lineWidth = 2.2
      c.beginPath(); trazo(tierra as any); c.stroke()
      subirTierra()
      puntos = {}
      agrupar()
    } catch (e) {
      console.warn('Mapa: no se pudo cargar el contorno de la tierra', e)
    }
  }
  const enTierra = (lat: number, lon: number) => {
    if (!mascara) return false
    const x = Math.min(TW - 1, Math.floor((lon + 180) / 360 * TW))
    const y = Math.min(TH - 1, Math.floor((LAT_N - lat) / ALTO * TH))
    return mascara[(y * TW + x) * 4]! > 127
  }

  /* ───────── Puntos y hexágonos ───────── */
  // generador con semilla: el mapa se ve igual en cada visita
  function azarConSemilla(semilla: number) {
    return () => {
      semilla |= 0; semilla = semilla + 0x6D2B79F5 | 0
      let t = Math.imul(semilla ^ semilla >>> 15, 1 | semilla)
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
      return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
  }
  let puntos: Record<string, [number, number][]> = {}
  function puntosDe(id: string) {
    if (puntos[id]) return puntos[id]
    const azar = azarConSemilla(id === 'manta' ? 7 : 13)
    const gauss = () => Math.sqrt(-2 * Math.log(azar() + 1e-9)) * Math.cos(2 * Math.PI * azar())
    const lista: [number, number][] = []
    for (const [lat, lon, peso, disp] of ESPECIES[id]!.zonas) {
      const n = Math.round(peso * 3)
      for (let i = 0, intentos = 0; i < n && intentos < n * 12; intentos++) {
        const la = lat + gauss() * disp * 0.55
        let lo = lon + gauss() * disp * 0.7
        lo = ((lo + 540) % 360) - 180
        if (la <= LAT_S || la >= LAT_N || enTierra(la, lo)) continue
        lista.push([la, lo])
        i++
      }
    }
    return puntos[id] = lista
  }

  // misma celda que calcula hexCoords en el shader, con el identificador doblado a enteros
  function celda(x: number, y: number): [number, number] {
    const ax = Math.floor(x) + 0.5, ay = Math.floor(y / RAIZ3) + 0.5
    const bx = Math.floor(x - 0.5) + 0.5, by = Math.floor((y - 1) / RAIZ3) + 0.5
    const d1 = (x - ax) ** 2 + (y - ay * RAIZ3) ** 2
    const d2 = (x - bx - 0.5) ** 2 + (y - (by + 0.5) * RAIZ3) ** 2
    return d1 < d2 ? [Math.round(ax * 2), Math.round(ay * 2)] : [Math.round(bx * 2 + 1), Math.round(by * 2 + 1)]
  }

  let unidad = 0, texW = 1, texH = 1
  const texDatos: Record<string, DataTexture | null> = { manta: null, martillo: null }
  const conteos: Record<string, Map<number, number>> = {}
  function agrupar() {
    texW = Math.ceil(720 / unidad) + 4
    texH = Math.ceil(2 * ALTO / (unidad * RAIZ3)) + 4
    for (const id of Object.keys(texDatos)) {
      const cuenta = new Map<number, number>()
      for (const [lat, lon] of puntosDe(id)) {
        const [ix, iy] = celda((lon + 180) / unidad, (lat - LAT_S) / unidad)
        const k = ix + iy * texW
        cuenta.set(k, (cuenta.get(k) || 0) + 1)
      }
      const max = Math.max(1, ...cuenta.values())
      const bytes = new Uint8Array(texW * texH)
      for (const [k, n] of cuenta) bytes[k] = Math.max(8, Math.round(n / max * 255))
      conteos[id] = cuenta
      // un texel de un byte por celda (antes LUMINANCE; three.js en WebGL2 usa RED, el shader lee .r)
      const tex = new DataTexture(bytes, texW, texH, RedFormat, UnsignedByteType)
      tex.minFilter = NearestFilter; tex.magFilter = NearestFilter
      tex.wrapS = tex.wrapT = ClampToEdgeWrapping
      tex.generateMipmaps = false
      tex.unpackAlignment = 1
      tex.needsUpdate = true
      texDatos[id]?.dispose()
      texDatos[id] = tex
    }
    U.uTex.value.set(texW, texH)
    // Como en mapa.js (agrupar): subir cada textura la deja ligada a su unidad, manta → uDatosA y
    // martillo → uDatosB, sin volver a enlazar desde/hacia. Se reproduce tal cual por paridad;
    // efecto: tras cargar la tierra (o redimensionar) la pestaña Mantarraya muestra la distribución
    // del martillo hasta el primer cambio de especie. Informado a Val como fallo, sin corregir aquí.
    U.uDatosA.value = texDatos.manta!
    U.uDatosB.value = texDatos.martillo!
  }

  /* ───────── Tamaño ───────── */
  let dpr = 1
  function ajustar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    const ancho = cv.clientWidth
    fijarTamano(renderer!, Math.round(ancho * dpr), Math.round(cv.clientHeight * dpr))
    // hexágonos de ~12 px en pantalla
    const nueva = Math.min(8, Math.max(2.6, 360 / (ancho / 12)))
    if (Math.abs(nueva - unidad) > 0.05) { unidad = nueva; agrupar() }
  }

  /* ───────── Cambio de especie ───────── */
  // A = especie visible, B = especie destino; uMezcla anima de A a B celda por celda
  let desde = 'manta', hacia = 'manta', mezcla = 1, t0 = 0
  function enlazar() {
    U.uDatosA.value = texDatos[desde]!
    U.uDatosB.value = texDatos[hacia]!
  }
  const observaTamano = new ResizeObserver(ajustar)
  observaTamano.observe(cv)
  ajustar()
  enlazar()
  alCambiar = (id) => {
    if (id === hacia) return
    desde = mezcla < 0.5 ? desde : hacia
    hacia = id
    mezcla = 0; t0 = performance.now()
    enlazar()
    lectura.value = INICIAL
  }

  /* ───────── Cursor: celda y coordenadas ───────── */
  const hover: [number, number] = [-99, -99]
  const fmt = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(1)}° ${v >= 0 ? pos : neg}`
  function leer(e: PointerEvent) {
    const r = cv.getBoundingClientRect()
    const lon = (e.clientX - r.left) / r.width * 360 - 180
    const lat = LAT_N - (e.clientY - r.top) / r.height * ALTO
    const [ix, iy] = celda((lon + 180) / unidad, (lat - LAT_S) / unidad)
    hover[0] = ix; hover[1] = iy
    const n = conteos[hacia] && conteos[hacia]!.get(ix + iy * texW) || 0
    lectura.value = `${fmt(lat, 'N', 'S')} · ${fmt(lon, 'E', 'O')} — ${n ? n + (n === 1 ? ' registro' : ' registros') : 'sin registros'}`
  }
  const alSalir = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    hover[0] = hover[1] = -99
    lectura.value = INICIAL
  }
  cv.addEventListener('pointermove', leer)
  cv.addEventListener('pointerdown', leer)   // en pantallas táctiles, un toque elige la celda
  cv.addEventListener('pointerleave', alSalir)

  /* ───────── Dibujo ───────── */
  let visible = true
  const observaVista = new IntersectionObserver(([en]) => { visible = en!.isIntersecting })
  observaVista.observe(cv)
  let raf = 0
  const inicio = performance.now()
  function dibujar(ahora = performance.now()) {
    raf = requestAnimationFrame(dibujar)
    if (!visible) return
    if (mezcla < 1) mezcla = reducido ? 1 : Math.min(1, (ahora - t0) / 1800)
    U.uRes.value.set(cv.width, cv.height)
    U.uT.value = (ahora - inicio) / 1000 * (reducido ? 0.2 : 1)
    U.uMezcla.value = mezcla
    U.uUnidad.value = unidad
    U.uHover.value.set(hover[0], hover[1])
    renderer!.render(escena, camara)
  }
  dibujar()

  cargarTierra()

  limpiar = () => {
    cancelAnimationFrame(raf)
    observaTamano.disconnect(); observaVista.disconnect()
    cv.removeEventListener('pointermove', leer)
    cv.removeEventListener('pointerdown', leer)
    cv.removeEventListener('pointerleave', alSalir)
    Object.values(texDatos).forEach(t => t?.dispose())
    texTierra.dispose(); geometria.dispose(); material.dispose(); renderer!.dispose()
  }
})

onBeforeUnmount(() => limpiar())
</script>
