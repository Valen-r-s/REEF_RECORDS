<template>
  <p class="a-indicador" aria-live="polite">
    <span>{{ String(activo + 1).padStart(2, '0') }} / {{ String(n).padStart(2, '0') }}</span> {{ CARTAS[activo]!.titulo }}
  </p>

  <!-- anillo: las tarjetas van alrededor de un cilindro que gira; las de atrás muestran su reverso -->
  <section
    class="a-escenario" :class="{ arrastrando: arrastre !== null }"
    aria-roledescription="carrusel" :aria-label="`Tarjetas de ${a.nombre}`" tabindex="0"
    @keydown="alTecla" @pointerdown="alPresionar" @pointermove="alArrastrar" @pointerup="alSoltar" @pointercancel="alSoltar"
  >
    <div class="r-anillo" :style="{ transform: `translateZ(calc(-1 * var(--r-radio))) rotateY(${-angulo}deg)` }">
      <article
        v-for="(c, i) in LUGARES" :key="i"
        class="r-carta" :class="{ centro: i === lugar }"
        :style="{ transform: `rotateY(${i * PASO}deg) translateZ(var(--r-radio))`, '--a-sombra': sombra(i) }"
        :aria-hidden="i !== lugar ? 'true' : undefined" :aria-label="`${c.titulo} (${(i % n) + 1} de ${n})`"
        @click="alTocar(i)" @pointermove="i === lugar && brillar($event)" @pointerleave="brillo = {}"
      >
        <!-- ── Frente ── -->
        <div class="a-cara r-frente" :inert="i !== lugar || undefined" :style="i === lugar ? brillo : undefined">
          <template v-if="c.id === 'principal'">
            <img class="r-foto" :src="a.retrato" :alt="`Retrato de ${a.nombre}`" width="736" height="979">
            <div class="r-vidrio abajo">
              <img class="r-vidrio-fondo" :src="a.retrato" alt="">
              <p class="a-rotulo">{{ a.rol }}</p>
              <h2 class="r-nombre">{{ a.nombre }}</h2>
              <p class="a-sub">{{ a.ciudad }}</p>
            </div>
          </template>

          <template v-else-if="c.id === 'sobre'">
            <img class="r-foto" :src="fotos[0]!.src" :style="{ objectPosition: fotos[0]!.encuadre }" alt="" width="736" height="981">
            <div class="r-vidrio abajo">
              <img class="r-vidrio-fondo" :src="fotos[0]!.src" :style="{ objectPosition: fotos[0]!.encuadre }" alt="">
              <p class="a-rotulo">Sobre él</p>
              <p class="r-texto">{{ a.frase }}</p>
              <p class="a-rotulo">Lo que toca</p>
              <ul class="a-generos"><li v-for="g in a.generos.slice(0, 5)" :key="g">{{ g }}</li></ul>
              <a v-if="a.youtube" class="r-boton" :href="a.youtube" target="_blank" rel="noopener">
                <IconoRed red="youtube" /> Encuéntralo en YouTube<span class="a-oculto"> (se abre en una pestaña nueva)</span>
              </a>
            </div>
          </template>

          <template v-else-if="c.id === 'set'">
            <img class="r-foto oscura" :src="a.set" alt="" width="453" height="224">
            <div class="a-sc">
              <p class="a-sc-titulo"><span>{{ a.nombre }} en REEF Records</span><span>Video set</span></p>
              <p class="a-sc-autor"><span>REEF Records · {{ a.duracion }}</span></p>
            </div>
            <a v-if="a.soundcloud" class="r-play" :href="a.soundcloud" target="_blank" rel="noopener" :aria-label="`Escuchar el set de ${a.nombre} (se abre en una pestaña nueva)`">
              <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
            </a>
            <div class="a-sc-onda"><OndaSonido :semilla="a.slug" :duracion="a.duracion" /></div>
          </template>

          <template v-else-if="c.id === 'redes'">
            <img class="r-foto" :src="fotos[1]!.src" :style="{ objectPosition: fotos[1]!.encuadre }" alt="" width="736" height="1308">
            <div class="r-vidrio abajo">
              <img class="r-vidrio-fondo" :src="fotos[1]!.src" :style="{ objectPosition: fotos[1]!.encuadre }" alt="">
              <p class="a-rotulo">Síguelo</p>
              <ul class="r-redes">
                <li v-for="r in REDES" :key="r.red">
                  <a v-if="r.href" class="r-boton" :href="r.href" target="_blank" rel="noopener"><IconoRed :red="r.red" /> {{ r.nombre }}<span class="a-oculto"> (se abre en una pestaña nueva)</span></a>
                  <span v-else class="r-boton deshabilitado" aria-disabled="true"><IconoRed :red="r.red" /> {{ r.nombre }} · pronto</span>
                </li>
              </ul>
            </div>
          </template>

          <template v-else>
            <img class="r-foto" :src="fotos[2]!.src" :style="{ objectPosition: fotos[2]!.encuadre }" alt="" width="736" height="981">
            <div class="r-vidrio lleno">
              <img class="r-vidrio-fondo" :src="fotos[2]!.src" :style="{ objectPosition: fotos[2]!.encuadre }" alt="">
              <p class="a-rotulo">Por qué hace música</p>
              <blockquote class="a-cita">{{ a.porQueMusica }}</blockquote>
            </div>
          </template>
          <span class="a-brillo" aria-hidden="true"></span>
        </div>

        <!-- ── Reverso: el logo de REEF Records en blanco ── -->
        <div class="a-cara reverso" aria-hidden="true">
          <LogoReefCompleto />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
/* REEF Records · Música / artista, carrusel en anillo: 5 tarjetas alrededor de un
   cilindro que gira suave con flechas, teclado, arrastre o clic. Las de atrás muestran el reverso con el
   logo de REEF; la del frente se puede usar (enlaces y play). Fotos del artista con paneles de vidrio. */
import type { Artista } from '~/data/artistas'

const props = defineProps<{ a: Artista }>()
// fotos de las tarjetas 2, 4 y 5; mientras el artista no tenga fotos adicionales se usa su retrato
// con otro encuadre en cada una (el vidrio más fuerte de la última disimula la repetición)
const ENCUADRES = ['50% 18%', '50% 85%', '50% 50%']
const fotos = computed(() => [0, 1, 2].map(i => {
  const propia = props.a.fotos?.[i]
  return { src: propia ?? props.a.retrato, encuadre: propia ? '50% 50%' : ENCUADRES[i]! }
}))
const REDES = computed(() => [
  { red: 'youtube' as const, nombre: 'YouTube', href: props.a.youtube },
  { red: 'soundcloud' as const, nombre: 'SoundCloud', href: props.a.soundcloud },
  { red: 'instagram' as const, nombre: 'Instagram', href: props.a.instagram }
])

const CARTAS = [
  { id: 'principal', titulo: 'Presentación' },
  { id: 'sobre', titulo: 'Sobre él' },
  { id: 'set', titulo: 'Video set' },
  { id: 'redes', titulo: 'Redes' },
  { id: 'musica', titulo: 'Por qué hace música' }
]
const n = CARTAS.length
// el anillo tiene 10 lugares con las 5 tarjetas repetidas: así las vecinas quedan a 36° (se ve su frente)
// y las de atrás, de espaldas, muestran el reverso. Solo la del frente se puede usar.
const LUGARES = [...CARTAS, ...CARTAS]
const m = LUGARES.length
const PASO = 360 / m

// paso: cuántas tarjetas ha girado el anillo (sin módulo, para que el giro siempre sea continuo)
const paso = ref(0)
const arrastre = ref<number | null>(null)   // grados extra mientras se arrastra
const angulo = computed(() => paso.value * PASO + (arrastre.value ?? 0))
const lugar = computed(() => ((Math.round(angulo.value / PASO) % m) + m) % m)
const activo = computed(() => lugar.value % n)

function mover(d: number) { paso.value += d }
function alTocar(i: number) {
  if (movido) return
  if (i === lugar.value) return
  paso.value += ((i - lugar.value + m + m / 2) % m) - m / 2   // por el camino corto
}
// las tarjetas se oscurecen cuanto más se alejan del frente
function sombra(i: number) {
  const rel = ((i * PASO - angulo.value) % 360 + 360) % 360
  return String(((1 - Math.cos(rel * Math.PI / 180)) / 2 * 0.7).toFixed(3))
}

// arrastre con el dedo o el mouse: la captura del puntero solo empieza al moverse, así los botones siguen funcionando
let x0 = 0, ancho = 1, movido = false, capturado = false
function alPresionar(e: PointerEvent) {
  if (e.button !== 0) return
  x0 = e.clientX; movido = false; capturado = false
  ancho = (e.currentTarget as HTMLElement).querySelector('.r-carta')?.getBoundingClientRect().width || 300
  arrastre.value = 0
}
function alArrastrar(e: PointerEvent) {
  if (arrastre.value === null) return
  const dx = e.clientX - x0
  if (!movido && Math.abs(dx) > 6) {
    movido = true
    if (!capturado) { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); capturado = true }
  }
  if (movido) arrastre.value = (-dx / ancho) * PASO
}
function alSoltar() {
  if (arrastre.value === null) return
  if (movido) paso.value = Math.round(angulo.value / PASO)
  arrastre.value = null
  setTimeout(() => { movido = false })   // el clic que cierra un arrastre no cuenta
}

function alTecla(e: KeyboardEvent) {
  if (e.target !== e.currentTarget) return
  if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1) }
  else if (e.key === 'ArrowRight') { e.preventDefault(); mover(1) }
}

// brillo que sigue al cursor en la tarjeta del frente
const brillo = ref<Record<string, string>>({})
function brillar(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  brillo.value = { '--gx': `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`, '--gy': `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`, '--go': '1' }
}

defineExpose({ mover })
</script>
