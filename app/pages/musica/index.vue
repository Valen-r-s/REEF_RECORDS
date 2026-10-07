<template>
  <div>
    <MarcaReef />

    <SiteNav actual="/musica" />

    <main class="musica">
      <h1 class="oculto">Música</h1>

      <div id="selector" ref="selector" class="selector" role="tablist" aria-label="Vista">
        <button id="tab-slider" type="button" role="tab" aria-selected="true" aria-controls="escena">Slider</button>
        <button id="tab-grid" type="button" role="tab" aria-selected="false" aria-controls="escena" tabindex="-1">Grid</button>
      </div>

      <nav id="categorias" class="categorias" aria-label="Sección de Música">
        <a href="/musica" aria-current="page">Artistas</a>
        <a id="cat-eventos" ref="aEventos" href="/musica/eventos">Eventos</a>
      </nav>

      <ul id="fuente" ref="fuente" hidden>
        <li><img src="/assets/artistas/cirratum.jpg" alt="CIRRATUM" data-slug="cirratum"></li>
        <li><img src="/assets/artistas/f3dr.jpg" alt="F3DR" data-slug="f3dr"></li>
        <li><img src="/assets/artistas/warv.jpg" alt="WARV" data-slug="warv"></li>
        <li><img src="/assets/artistas/kesr.jpg" alt="KESR" data-slug="kesr"></li>
        <li><img src="/assets/artistas/caotical-disordah.jpg" alt="CAOTICAL DISORDAH" data-slug="caotical-disordah"></li>
        <li><img src="/assets/artistas/esallen.jpg" alt="ESALLEN" data-slug="esallen"></li>
      </ul>

      <section id="escena" ref="escena" class="escena" role="tabpanel" aria-labelledby="tab-slider" tabindex="0" aria-roledescription="galería" aria-label="Artistas de REEF Records. Arrastra para moverte; toca la foto del centro o pulsa Enter para ver al artista."></section>

      <div id="barra" ref="barra" class="barra">
        <button id="anterior" ref="anterior" class="flecha" type="button" aria-label="Artista anterior">←</button>
        <div class="rotulo">
          <a id="nombre" ref="nombre" class="nombre" href="/musica/cirratum" aria-live="polite">CIRRATUM</a>
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
const aEventos = ref<HTMLElement | null>(null)

useGaleria({ fuente, escena, selector, barra, nombre, contador, anterior, siguiente, aEventos })

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
