<template>
  <div>
    <OceanoMar />
    <div class="velo" aria-hidden="true"></div>
    <NieveMarina />

    <MarcaReef />

    <SiteNav actual="/ciencia" />

    <main class="pagina-atlas-main">
      <!-- el selector y la vuelta a Ciencia van en la columna lateral: el mapa ocupa toda la altura -->
      <AtlasEspecies :especie="especie">
        <template #cabeza>
          <a class="volver" href="/ciencia"><span aria-hidden="true">←</span> Ciencia</a>
          <SelectorEspecie v-model="especie" panel="atlas" />
        </template>
      </AtlasEspecies>
    </main>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Ciencia / Mapa: dónde encontrar a cada especie.
   El selector cambia solo la información del atlas (sitios, rutas, registros, textos y estado UICN). */

// Páginas interiores: el mar queda fijo en el abismo, como en la sección de la causa
useReef().prof = 1

const especie = useEspecie()

useHead({
  title: 'Mapa · Ciencia · REEF Records',
  htmlAttrs: { class: 'dentro' },
  bodyAttrs: { class: 'pagina-ciencia pagina-atlas' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Orbitron:wght@400;500;600;700&display=swap' }
  ]
})
</script>

<style>
@import '~/assets/css/hero.css';
@import '~/assets/css/causa.css';
@import '~/assets/css/nav.css';
@import '~/assets/css/selector.css';
@import '~/assets/css/atlas.css';
</style>
