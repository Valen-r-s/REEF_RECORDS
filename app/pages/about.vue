<template>
  <div>
    <MarcaReef />
    <SiteNav actual="/about" />

    <main>
      <!-- 1 · El equipo: cinco tanques de agua con una persona en silueta dentro de cada uno -->
      <section class="ab-hero" aria-labelledby="ab-t">
        <header class="ab-cabeza">
          <h1 id="ab-t">Las personas detrás del arrecife</h1>
          <div class="ab-lado">
            <p class="ab-etiqueta">[ Nosotros ]</p>
            <p class="ab-intro">Un colectivo de Bogotá entre la escena electrónica, la innovación sostenible y la ciencia del océano.</p>
          </div>
        </header>
        <AcuarioEquipo />
      </section>

      <!-- 2 · Qué es REEF y por dónde seguir -->
      <section class="ab-manifiesto" aria-labelledby="ab-m-t">
        <p class="ab-etiqueta revelar">[ Qué es REEF ]</p>
        <h2 id="ab-m-t" class="revelar">La fiesta también puede cuidar el océano</h2>
        <div class="ab-columnas">
          <div class="ab-relato revelar d1">
            <p>Hacemos fiestas y sesiones con artistas de Bogotá para hablar de las especies del océano que están en peligro y generar conciencia sobre lo que les está pasando.</p>
            <p>Por eso cada evento deja algo más que música: las botellas y los residuos orgánicos tienen un segundo uso, y buscamos que lo que se mueve en la pista ayude a proteger y recuperar los ecosistemas marinos.</p>
          </div>
          <ul class="ab-frentes revelar d2">
            <li v-for="f in FRENTES" :key="f.href">
              <a :href="f.href">{{ f.nombre }} <span>{{ f.detalle }}</span><i aria-hidden="true">→</i></a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · About: cinco tanques de agua con siluetas (AcuarioEquipo, WebGL) y qué es el colectivo. */

const FRENTES = [
  { href: '/musica', nombre: 'Música', detalle: 'Artistas, sets y eventos' },
  { href: '/ciencia', nombre: 'Ciencia', detalle: 'Dónde viven y cómo están las especies' },
  { href: '/causas', nombre: 'Causas', detalle: 'Charlas, residuos y botellas' }
]

useRevelar()

useHead({
  title: 'About · REEF Records',
  htmlAttrs: { class: 'dentro' },
  bodyAttrs: { class: 'pagina-about' },
  meta: [{ name: 'description', content: 'Quiénes somos en REEF Records: un colectivo de Bogotá que une la escena electrónica, la innovación sostenible y la ciencia para cuidar el océano.' }],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Orbitron:wght@400;500;600;700;800;900&display=swap' }
  ]
})
</script>

<style>
@import '~/assets/css/hero.css';
@import '~/assets/css/nav.css';
@import '~/assets/css/about.css';
</style>
