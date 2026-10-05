<template>
  <section ref="heroe" class="m-portada" :class="{ listo, cambiando }" aria-labelledby="merch-t">
    <!-- vidrio esmerilado: toda la foto se dispersa en partículas finas -->
    <svg class="m-filtro" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="m-esmerilado" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="2" result="ondas" />
        <feDisplacementMap in="SourceGraphic" in2="ondas" scale="9" xChannelSelector="R" yChannelSelector="G" result="curva" />
        <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="1" seed="9" result="fino" />
        <feDisplacementMap in="curva" in2="fino" scale="16" xChannelSelector="R" yChannelSelector="B" result="spray1" />
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" seed="23" result="fino2" />
        <feDisplacementMap in="spray1" in2="fino2" scale="6" xChannelSelector="G" yChannelSelector="R" />
      </filter>
    </svg>
    <div class="m-vidrio">
      <img
        class="m-camiseta" :src="foto.src" :srcset="foto.srcset" :sizes="tamanos"
        :width="foto.ancho" :height="foto.alto" :alt="foto.alt" fetchpriority="high"
      >
    </div>
    <!-- la misma foto, nítida solo alrededor del estampado; se empaña al subir la colección -->
    <div class="m-nitida">
      <img
        class="m-camiseta" :src="foto.src" :srcset="foto.srcset" :sizes="tamanos"
        :width="foto.ancho" :height="foto.alto" alt="" aria-hidden="true"
      >
    </div>
    <div class="m-grano" aria-hidden="true"></div>
    <span class="m-rotulo" aria-hidden="true">{{ PORTADA[corte].rotulo }}</span>

    <div ref="pestanas" class="m-cortes" role="group" aria-label="Ver el corte">
      <button
        v-for="c in CORTES" :key="c.id" type="button"
        :aria-pressed="String(c.id === corte)" @click="elegir(c.id)"
      >{{ c.texto }}</button>
    </div>

    <div ref="texto" class="m-portada-texto">
      <div>
        <p class="m-edicion">Edición 01 — Pacífico</p>
        <h1 id="merch-t" lang="la">Mobula birostris</h1>
      </div>
      <div class="m-portada-lado">
        <a class="m-cta" href="#coleccion">Ver colección
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1v10M1.5 6.5 6 11l4.5-4.5" stroke="currentColor" stroke-width="1.2" /></svg>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/* REEF Records · Merch: portada. La camiseta principal de cada corte detrás de un vidrio esmerilado;
   solo el estampado se ve nítido. La foto se escala y se ubica con las cajas de PORTADA para que la
   camiseta quepa entre el selector de corte y el texto en cualquier pantalla. */
import { PORTADA, type FotoPortada, type Genero } from '~/data/merch'
import { esReducido } from '~/utils/gl'

const CORTES: { id: Genero, texto: string }[] = [
  { id: 'hombre', texto: 'Hombre' },
  { id: 'mujer', texto: 'Mujer' }
]

const corte = ref<Genero>('hombre')      // botón elegido
const mostrado = ref<Genero>('hombre')   // foto en pantalla: cambia cuando termina el fundido
const foto = computed(() => PORTADA[mostrado.value])
const listo = ref(false)
const cambiando = ref(false)
// antes de medir: lo que suele ocupar la foto (en móvil la imagen es más ancha que la pantalla)
const tamanos = ref('(max-width: 760px) 130vw, 48vw')

const heroe = ref<HTMLElement | null>(null)
const pestanas = ref<HTMLElement | null>(null)
const texto = ref<HTMLElement | null>(null)

function medir(f: FotoPortada) {
  const h = heroe.value!
  const w = h.clientWidth
  const alto = Math.min(h.clientHeight, window.innerHeight)   // la portada tiene alto mínimo
  const r = h.getBoundingClientRect()
  const arriba = pestanas.value!.getBoundingClientRect().bottom - r.top + 36
  const angosto = w < 760
  // en pantallas angostas el texto queda debajo de la camiseta; abajo también va el rótulo del corte
  const abajo = angosto
    ? r.bottom - texto.value!.getBoundingClientRect().top - (h.clientHeight - alto) + 40
    : 64
  const disp = Math.max(160, alto - arriba - abajo)
  const C = f.camiseta, E = f.estampado
  const s = Math.min((disp * (angosto ? 1 : 0.84)) / C.h, (w * (angosto ? 0.84 : 0.34)) / C.w)
  const x = w / 2 - (C.x + C.w / 2) * s
  const y = arriba + (disp - C.h * s) / 2 - C.y * s
  // zona nítida: el estampado con holgura; sus bordes se difuminan en el CSS
  const hx = E.w * 0.26, hy = E.h * 0.1
  return {
    vars: {
      '--cx': x, '--cy': y, '--cw': f.ancho * s,
      '--rx': x + (C.x + C.w / 2) * s, '--ry': y + (C.y + C.h) * s + 14,
      '--mx': (E.x - hx) * s, '--my': (E.y - hy) * s, '--mw': (E.w + 2 * hx) * s, '--mh': (E.h + 2 * hy) * s
    },
    tamanos: `${Math.ceil(f.ancho * s)}px`
  }
}

function aplicar(m: ReturnType<typeof medir>) {
  for (const [k, v] of Object.entries(m.vars)) heroe.value!.style.setProperty(k, `${v.toFixed(1)}px`)
  tamanos.value = m.tamanos
}

function ubicar() {
  if (!heroe.value) return
  aplicar(medir(foto.value))
  listo.value = true
}

const cargadas = new Map<Genero, Promise<void>>()
function cargar(g: Genero) {
  if (!cargadas.has(g)) {
    const f = PORTADA[g], im = new Image()
    im.sizes = medir(f).tamanos
    im.srcset = f.srcset
    im.src = f.src
    cargadas.set(g, im.decode().catch(() => {}))
  }
  return cargadas.get(g)!
}

let turno = 0
async function elegir(g: Genero) {
  corte.value = g
  if (g === mostrado.value && !cambiando.value) return
  const id = ++turno
  cambiando.value = true
  await Promise.all([cargar(g), new Promise(r => setTimeout(r, esReducido() ? 0 : 260))])
  if (id !== turno) return
  mostrado.value = g
  aplicar(medir(PORTADA[g]))
  await nextTick()
  // el navegador puede elegir otro tamaño del srcset que el precargado: se espera la imagen real
  await heroe.value?.querySelector<HTMLImageElement>('.m-vidrio img')?.decode().catch(() => {})
  if (id !== turno) return
  cambiando.value = false
}

let observa: ResizeObserver | null = null
let raf = 0
onMounted(() => {
  ubicar()
  observa = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(ubicar) })
  observa.observe(heroe.value!)
  document.fonts?.ready.then(ubicar)   // el título cambia de alto cuando llega la tipografía
  const precargar = () => cargar('mujer')
  if ('requestIdleCallback' in window) requestIdleCallback(precargar, { timeout: 3000 })
  else setTimeout(precargar, 1500)
})
onBeforeUnmount(() => { observa?.disconnect(); cancelAnimationFrame(raf) })
</script>
