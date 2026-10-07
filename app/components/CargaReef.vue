<template>
  <div
    v-if="visible" class="carga" :class="{ saliendo }"
    role="progressbar" aria-label="Cargando REEF Records" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="pct"
  >
    <div class="carga-rayos" aria-hidden="true"></div>
    <div class="carga-burbujas" aria-hidden="true"><span v-for="b in BURBUJAS" :key="b.i" :style="b.estilo"></span></div>

    <!-- los tiburones del símbolo de REEF (TiburonesREEF.svg) se llenan según avanza la carga.
         Lo lleno es metal líquido: cromo en la escala del azul REEF con gotas de agua en relieve -->
    <svg class="carga-tiburones" :viewBox="`0 0 ${ANCHO} ${ALTO}`" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="carga-forma">
          <path v-for="(d, i) in FORMAS" :key="i" :d="d" />
        </clipPath>
        <!-- cromo: bandas claras y oscuras como el cielo y el mar reflejados en el metal -->
        <linearGradient id="carga-cromo" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stop-color="#f4f7ff" />
          <stop offset="0.16" stop-color="#a3b0d3" />
          <stop offset="0.3" stop-color="#4f63a0" />
          <stop offset="0.44" stop-color="#e0e5f0" />
          <stop offset="0.58" stop-color="#8495c5" />
          <stop offset="0.74" stop-color="#2c3a68" />
          <stop offset="0.88" stop-color="#c1cae2" />
          <stop offset="1" stop-color="#657bb6" />
        </linearGradient>
        <!-- relieve del borde + gotas (ruido umbralizado) iluminados como metal mojado -->
        <filter id="carga-metal" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="relieve" />
          <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="1" seed="11" result="ruido" />
          <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 -3.1" result="manchas" />
          <feGaussianBlur in="manchas" stdDeviation="0.7" result="gotas" />
          <feComposite in="gotas" in2="SourceAlpha" operator="in" result="gotasDentro" />
          <feComposite in="relieve" in2="gotasDentro" operator="arithmetic" k2="1" k3="0.9" result="altura" />
          <feSpecularLighting in="altura" surfaceScale="6" specularConstant="1.3" specularExponent="30" lighting-color="#ffffff" result="brillo">
            <feDistantLight azimuth="235" elevation="46" />
          </feSpecularLighting>
          <feComposite in="brillo" in2="SourceAlpha" operator="in" result="brilloDentro" />
          <feDiffuseLighting in="altura" surfaceScale="2.2" diffuseConstant="1.1" lighting-color="#ffffff" result="sombra">
            <feDistantLight azimuth="235" elevation="58" />
          </feDiffuseLighting>
          <feBlend in="SourceGraphic" in2="sombra" mode="multiply" result="base" />
          <feComposite in="base" in2="SourceAlpha" operator="in" result="baseDentro" />
          <feComposite in="brilloDentro" in2="baseDentro" operator="arithmetic" k2="1" k3="1" />
        </filter>
        <!-- nivel: lo que está bajo la marea se ve; la ola corre en su borde -->
        <mask id="carga-nivel" maskUnits="userSpaceOnUse" x="0" y="0" :width="ANCHO" :height="ALTO">
          <g :style="marea">
            <path class="ola atras" :d="OLA" fill="#808080" />
            <path class="ola frente" :d="OLA" fill="#ffffff" />
            <rect x="0" y="9" :width="ANCHO * 2" :height="ALTO + 20" fill="#ffffff" />
          </g>
        </mask>
      </defs>
      <!-- vacío: el contorno de cada tiburón, como vidrio oscuro -->
      <g class="carga-vacio"><path v-for="(d, i) in FORMAS" :key="i" :d="d" /></g>
      <!-- lleno: el metal mojado, descubierto hasta la marea -->
      <g mask="url(#carga-nivel)">
        <g filter="url(#carga-metal)"><path v-for="(d, i) in FORMAS" :key="i" :d="d" fill="url(#carga-cromo)" /></g>
      </g>
      <!-- la línea de la marea, que brilla donde toca a los tiburones -->
      <g clip-path="url(#carga-forma)">
        <g :style="marea"><path class="ola linea" :d="OLA_LINEA" /></g>
      </g>
      <g class="carga-borde"><path v-for="(d, i) in FORMAS" :key="i" :d="d" /></g>
    </svg>

    <p class="carga-texto" aria-hidden="true">Llenando el arrecife <span>{{ pct }} %</span></p>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Animación de carga del inicio: los tiburones del símbolo de REEF se llenan de metal líquido
   mientras carga la página (documento, imágenes y tipografías), sobre un fondo de mar con rayos de luz
   y burbujas. Al llenarse se desvanece y deja ver el hero. */
import { esReducido } from '~/utils/gl'
import { TIBURONES as FORMAS, TIBURONES_ANCHO as ANCHO, TIBURONES_ALTO as ALTO } from '~/data/tiburones'

// ola: 4 crestas por ancho, dibujada dos veces de largo para correr sin saltos
const OLA = (() => {
  const l = ANCHO / 4, a = 4.5
  let d = 'M0,9'
  for (let i = 0; i < 8; i++) d += ` q${(l / 4).toFixed(2)},${-a} ${(l / 2).toFixed(2)},0 t${(l / 2).toFixed(2)},0`
  return `${d} V30 H0 Z`
})()
// la misma ola, solo la cresta (sin cerrar), para dibujar la línea de la marea
const OLA_LINEA = OLA.replace(' V30 H0 Z', '')
// burbujas en posiciones fijas (las mismas en el servidor y en el navegador)
const BURBUJAS = Array.from({ length: 14 }, (_, i) => ({
  i,
  estilo: {
    left: `${(i * 37 + 11) % 100}%`,
    width: `${4 + (i * 7) % 9}px`, height: `${4 + (i * 7) % 9}px`,
    animationDuration: `${7 + (i * 5) % 6}s`,
    animationDelay: `${-(i * 0.9).toFixed(1)}s`
  }
}))

const visible = ref(true)
const saliendo = ref(false)
const nivel = ref(0)
const pct = computed(() => Math.round(nivel.value * 100))
const marea = computed(() => ({ transform: `translateY(${((1 - nivel.value) * (ALTO + 14) - 14).toFixed(2)}px)` }))

let raf = 0, espera: ReturnType<typeof setTimeout> | undefined
function salir() {
  saliendo.value = true
  espera = setTimeout(() => { visible.value = false }, 900)
}

onMounted(() => {
  // de vuelta desde otra página a /#causa no hay carga: se entra directo a la sección
  if (location.hash === '#causa') { visible.value = false; return }
  const reducido = esReducido()
  const t0 = performance.now()
  const MINIMO = reducido ? 300 : 1800   // tiempo mínimo para que el llenado se alcance a ver
  const MAXIMO = 8000                    // nunca más de esto, aunque algo tarde en cargar
  let cargado = document.readyState === 'complete'
  if (!cargado) window.addEventListener('load', () => { cargado = true }, { once: true })
  let fuentes = !document.fonts
  document.fonts?.ready.then(() => { fuentes = true })

  const paso = (t: number) => {
    const dt = t - t0
    const listo = (cargado && fuentes && dt > MINIMO) || dt > MAXIMO
    // mientras carga, el agua sube hasta el 90 % cada vez más lento; al terminar, llena el resto
    const objetivo = listo ? 1 : 0.9 * (1 - Math.exp(-dt / 1400))
    nivel.value += (objetivo - nivel.value) * (reducido ? 1 : listo ? 0.09 : 0.07)
    if (listo && nivel.value > 0.995) { nivel.value = 1; salir(); return }
    raf = requestAnimationFrame(paso)
  }
  raf = requestAnimationFrame(paso)
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); clearTimeout(espera) })

// llegada directa a /#causa: se oculta antes del primer pintado, sin esperar a la hidratación
useHead({
  script: [{ key: 'carga-causa', tagPosition: 'head', innerHTML: 'if(location.hash===\'#causa\')document.documentElement.setAttribute(\'data-sin-carga\',\'\')' }]
})
</script>
