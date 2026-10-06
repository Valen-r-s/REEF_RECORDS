<template>
  <div class="onda" @pointermove="alMover" @pointerleave="hasta = -1">
    <svg :viewBox="`0 0 ${N * 3} 60`" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g v-for="(h, i) in barras" :key="i" :class="{ on: i <= hasta }">
        <rect :x="i * 3" :y="(40 - h * 38).toFixed(2)" width="2" :height="(h * 38).toFixed(2)" />
        <rect class="reflejo" :x="i * 3" y="41.5" width="2" :height="(h * 17).toFixed(2)" />
      </g>
    </svg>
    <span class="onda-tiempo inicio">{{ hasta < 0 ? '0:00' : tiempo((hasta + 1) / N) }}</span>
    <span class="onda-tiempo fin">{{ duracion }}</span>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Forma de onda a la manera de SoundCloud: barras con su reflejo. La forma sale del nombre
   del artista (siempre la misma para cada uno); al pasar el cursor se ilumina hasta ese punto del set. */
const props = defineProps<{ semilla: string, duracion: string }>()
const N = 72

// generador pseudoaleatorio con semilla (mulberry32)
function azar(texto: string) {
  let a = [...texto].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 1779033703)
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const barras = computed(() => {
  const r = azar(props.semilla)
  let suave = 0.5
  return Array.from({ length: N }, (_, i) => {
    suave = suave * 0.55 + r() * 0.45
    const envolvente = 0.55 + 0.45 * Math.sin(Math.PI * (i + 4) / (N + 8))   // más fuerte en el medio del set
    // redondeada: Math.sin no da el mismo último decimal en el servidor y en el navegador
    return Math.round(Math.max(0.12, Math.min(1, suave * envolvente * 1.35)) * 100) / 100
  })
})

const hasta = ref(-1)
function alMover(e: PointerEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  hasta.value = Math.floor(((e.clientX - r.left) / r.width) * N)
}

const segundos = computed(() => props.duracion.split(':').reduce((s, p) => s * 60 + Number(p), 0))
function tiempo(k: number) {
  const s = Math.round(segundos.value * k)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}
</script>
