<template>
  <div class="selector" role="tablist" aria-label="Especie">
    <button
      v-for="(t, i) in ESPECIES_CIENCIA" :id="'tab-' + t.id" :key="t.id" :ref="el => { botones[i] = el as HTMLElement }"
      type="button" role="tab" :data-especie="t.id" :aria-selected="String(especie === t.id)"
      :aria-controls="panel ?? 'ficha-' + t.id" :tabindex="especie === t.id ? 0 : -1"
      @click="especie = t.id" @keydown="alTecla($event, i)"
    >{{ t.texto }}</button>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Ciencia: pestañas Mantarraya Gigante / Tiburón Martillo (antes dentro de ciencia.vue).
   Las flechas izquierda y derecha cambian de pestaña, como en el selector Slider / Grid de Música. */
import { ESPECIES_CIENCIA } from '~/composables/useEspecie'

defineProps<{
  /** id del panel que controlan todas las pestañas; sin él, cada una controla su ficha (ficha-manta…) */
  panel?: string
}>()
const especie = defineModel<string>({ required: true })
const botones: HTMLElement[] = []

function alTecla(e: KeyboardEvent, i: number) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const n = ESPECIES_CIENCIA.length
  const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n
  especie.value = ESPECIES_CIENCIA[j]!.id
  botones[j]?.focus()
}
</script>
