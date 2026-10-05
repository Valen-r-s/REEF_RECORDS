<template>
  <div>
    <OceanoMar />
    <div class="velo" aria-hidden="true"></div>
    <NieveMarina />

    <a class="marca" href="/" aria-label="REEF, inicio">
      <img src="/assets/reef-web-corner.png" alt="REEF Records">
    </a>

    <SiteNav actual="/ciencia" causas="/#causa" />

    <main>
      <!-- Misma composición que la sección de la causa: las burbujas cruzan en diagonal -->
      <section class="causa portada-ciencia" aria-labelledby="ciencia-t">
        <div class="causa-texto">
          <h1 id="ciencia-t" class="revelar">Ciencia por el <em>océano</em></h1>
        </div>

        <p class="causa-lema revelar d1">Dónde viven y cómo son la mantarraya gigante y el tiburón martillo</p>

        <CorrienteObjetos :objetos="OBJETOS" etiqueta="Secciones de Ciencia" />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Ciencia: portada con dos burbujas, el mapa (dónde encontrarlos) y las especies */
import type { ObjetoCorriente } from '~/components/CorrienteObjetos.vue'

const OBJETOS: ObjetoCorriente[] = [
  { clase: 'objeto-tierra', href: '/ciencia/mapa', ruta: '/ciencia/mapa', img: '/assets/objetos/ciencia-tierra.webp', ancho: 1254, alto: 1254, nombre: 'Mapa' },
  { clase: 'objeto-especies', href: '/ciencia/especies', ruta: '/ciencia/especies', img: '/assets/objetos/ciencia-especies.webp', ancho: 1305, alto: 1206, nombre: 'Especies' }
]

// Páginas interiores: el mar queda fijo en el abismo, como en la sección de la causa
useReef().prof = 1
useRevelar()

useHead({
  title: 'Ciencia · REEF Records',
  htmlAttrs: { class: 'dentro' },
  bodyAttrs: { class: 'pagina-ciencia' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap' }
  ]
})
</script>

<style>
@import '~/assets/css/hero.css';
@import '~/assets/css/causa.css';
@import '~/assets/css/nav.css';
@import '~/assets/css/ciencia-portada.css';
</style>
