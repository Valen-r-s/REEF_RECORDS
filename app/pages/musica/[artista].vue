<template>
  <div>
    <MarcaReef />
    <SiteNav actual="/musica" />

    <!-- fondo: el retrato del artista muy desenfocado, como la carátula detrás de un reproductor -->
    <div class="a-fondo" aria-hidden="true"><img :src="a.retrato" alt=""></div>

    <main class="a-pagina">
      <a class="volver" href="/musica"><span aria-hidden="true">←</span> Música</a>

      <ArtistaAnillo ref="anillo" :a="a" />

      <!-- barra tipo reproductor: el artista, los controles del anillo y sus redes -->
      <footer class="a-barra">
        <div class="a-quien">
          <img :src="a.retrato" alt="" width="44" height="44">
          <div>
            <h1>{{ a.nombre }}</h1>
            <p>{{ a.ciudad }} · {{ a.generos.slice(0, 3).join(' · ') }}</p>
          </div>
        </div>
        <div class="a-controles">
          <button class="a-flecha" type="button" aria-label="Tarjeta anterior" @click="anillo?.mover(-1)">←</button>
          <button class="a-flecha" type="button" aria-label="Tarjeta siguiente" @click="anillo?.mover(1)">→</button>
        </div>
        <ul class="a-redes" aria-label="Redes">
          <li v-for="r in REDES" :key="r.red">
            <a v-if="r.href" :href="r.href" target="_blank" rel="noopener" :aria-label="`${r.nombre} (se abre en una pestaña nueva)`" :title="r.nombre"><IconoRed :red="r.red" /></a>
            <span v-else class="a-sin-enlace" :title="`${r.nombre}: pronto`" role="img" :aria-label="`${r.nombre}: pronto`"><IconoRed :red="r.red" /></span>
          </li>
        </ul>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Música / artista: 5 tarjetas en un anillo 3D (ArtistaAnillo) y una barra tipo
   reproductor con las redes. */
import { ARTISTAS } from '~/data/artistas'

const ruta = useRoute()
const a = ARTISTAS.find(x => x.slug === ruta.params.artista)!
if (!a) throw createError({ statusCode: 404, statusMessage: 'Artista no encontrado', fatal: true })

const anillo = ref<{ mover: (d: number) => void } | null>(null)
const REDES = [
  { red: 'youtube' as const, nombre: 'YouTube', href: a.youtube },
  { red: 'soundcloud' as const, nombre: 'SoundCloud', href: a.soundcloud },
  { red: 'instagram' as const, nombre: 'Instagram', href: a.instagram }
]

useHead({
  title: `${a.nombre} · Música · REEF Records`,
  htmlAttrs: { class: 'dentro' },
  bodyAttrs: { class: 'pagina-artista' },
  meta: [{ name: 'description', content: `${a.nombre}, DJ de REEF Records en ${a.ciudad}: video set, lo que toca, redes y por qué hace música.` }],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Orbitron:wght@400;500;600;700&display=swap' }
  ]
})
</script>

<style>
@import '~/assets/css/hero.css';
@import '~/assets/css/nav.css';
@import '~/assets/css/selector.css';
@import '~/assets/css/artista.css';
</style>
