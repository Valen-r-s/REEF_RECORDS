<template>
  <article class="m-tarjeta" :aria-labelledby="`${id}-t`">
    <div class="m-foto">
      <img
        :src="`/assets/merch/${p.foto}-800.webp`"
        :srcset="`/assets/merch/${p.foto}-400.webp 400w, /assets/merch/${p.foto}-800.webp 800w`"
        sizes="(max-width: 560px) calc(100vw - 32px), (max-width: 960px) 47vw, min(31vw, 470px)"
        width="800" height="1000" :alt="p.alt" loading="lazy" decoding="async"
      >
      <span class="m-codigo">{{ p.codigo }}</span>
    </div>
    <div class="m-info">
      <div class="m-fila">
        <h3 :id="`${id}-t`">{{ p.nombre }}</h3>
        <span v-if="p.precio" class="m-precio">{{ formatoPrecio(p.precio) }}</span>
      </div>
      <p class="m-detalle">{{ p.detalle }}</p>
      <fieldset class="m-tallas">
        <legend class="m-oculto">Talla</legend>
        <label v-for="t in TALLAS" :key="t">
          <input v-model="talla" type="radio" :name="`${id}-talla`" :value="t">
          <span>{{ t }}</span>
        </label>
      </fieldset>
      <a class="m-pedir" :href="enlace" target="_blank" rel="noopener">
        Pedir talla {{ talla }} por WhatsApp
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 8 8 2M3 2h5v5" stroke="currentColor" stroke-width="1.1" /></svg>
        <span class="m-oculto">(se abre en una pestaña nueva)</span>
      </a>
    </div>
  </article>
</template>

<script setup lang="ts">
/* REEF Records · Merch: una camiseta. La talla elegida va escrita en el mensaje de WhatsApp. */
import { TALLAS, formatoPrecio, mensajePedido, type Producto, type Talla } from '~/data/merch'
import { enlaceWhatsApp } from '~/data/contacto'

const props = defineProps<{ p: Producto }>()
const id = props.p.codigo.toLowerCase()
const talla = ref<Talla>('M')
const enlace = computed(() => enlaceWhatsApp(mensajePedido(props.p, talla.value)))
</script>
