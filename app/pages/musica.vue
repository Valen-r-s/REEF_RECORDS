<template>
  <div>
    <a class="marca" href="/" aria-label="REEF, inicio">
      <img src="/assets/reef-web-corner.png" alt="REEF Records">
    </a>

    <SiteNav actual="/musica" causas="/#causa" />

    <main class="musica">
      <h1 class="oculto">Música</h1>

      <div id="selector" ref="selector" class="selector" role="tablist" aria-label="Vista">
        <button id="tab-slider" type="button" role="tab" aria-selected="true" aria-controls="escena">Slider</button>
        <button id="tab-grid" type="button" role="tab" aria-selected="false" aria-controls="escena" tabindex="-1">Grid</button>
      </div>

      <div id="categorias" ref="categorias" class="categorias" role="tablist" aria-label="Sección" aria-orientation="vertical">
        <button id="cat-artistas" type="button" role="tab" aria-selected="true" aria-controls="escena">Artistas</button>
        <button id="cat-eventos" type="button" role="tab" aria-selected="false" aria-controls="panel-eventos" tabindex="-1">Eventos</button>
      </div>

      <ul id="fuente" ref="fuente" hidden>
        <li><img src="/assets/artistas/cirratum.jpg" alt="CIRRATUM"></li>
        <li><img src="/assets/artistas/f3dr.jpg" alt="F3DR"></li>
        <li><img src="/assets/artistas/warv.jpg" alt="WARV"></li>
        <li><img src="/assets/artistas/kesr.jpg" alt="KESR"></li>
        <li><img src="/assets/artistas/caotical-disordah.jpg" alt="CAOTICAL DISORDAH"></li>
        <li><img src="/assets/artistas/esallen.jpg" alt="ESALLEN"></li>
      </ul>

      <section id="escena" ref="escena" class="escena" role="tabpanel" aria-labelledby="tab-slider" tabindex="0" aria-roledescription="galería" aria-label="Artistas de REEF Records. Arrastra para moverte."></section>

      <section id="panel-eventos" ref="eventos" class="eventos" role="tabpanel" aria-labelledby="cat-eventos" aria-hidden="true">
        <p>Working on it</p>
      </section>

      <div id="barra" ref="barra" class="barra">
        <button id="anterior" ref="anterior" class="flecha" type="button" aria-label="Artista anterior">←</button>
        <div class="rotulo">
          <p id="nombre" ref="nombre" class="nombre" aria-live="polite">CIRRATUM</p>
          <p id="contador" ref="contador" class="meta">01 / 06</p>
        </div>
        <button id="siguiente" ref="siguiente" class="flecha" type="button" aria-label="Artista siguiente">→</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Música: artistas en slider / grid infinito */
const fuente = ref<HTMLElement | null>(null)
const escena = ref<HTMLElement | null>(null)
const selector = ref<HTMLElement | null>(null)
const barra = ref<HTMLElement | null>(null)
const nombre = ref<HTMLElement | null>(null)
const contador = ref<HTMLElement | null>(null)
const anterior = ref<HTMLElement | null>(null)
const siguiente = ref<HTMLElement | null>(null)
const categorias = ref<HTMLElement | null>(null)
const eventos = ref<HTMLElement | null>(null)

useGaleria({ fuente, escena, selector, barra, nombre, contador, anterior, siguiente, categorias, eventos })

useHead({
  title: 'Música · REEF Records',
  htmlAttrs: { class: 'dentro' },
  bodyAttrs: { class: 'pagina-musica' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap' }
  ]
})
</script>

<style>
@import '~/assets/css/hero.css';
@import '~/assets/css/nav.css';
@import '~/assets/css/selector.css';
@import '~/assets/css/musica.css';
</style>
