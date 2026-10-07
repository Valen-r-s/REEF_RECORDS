<template>
  <div>
    <MarcaReef />
    <SiteNav actual="/musica" />
    <nav class="categorias" aria-label="Sección de Música">
      <a href="/musica">Artistas</a>
      <a href="/musica/eventos" aria-current="page">Eventos</a>
    </nav>

    <main>
      <!-- portada: la foto de fondo; arriba, un panel negro con EVENTOS calado, por donde se ve la foto -->
      <section class="ev-portada" aria-labelledby="ev-t">
        <img class="ev-foto" src="/assets/eventos/portada.webp" alt="" width="736" height="490" fetchpriority="high">
        <div class="ev-panel">
          <p class="ev-antetitulo">REEF Records · Temporada 2026 · Bogotá</p>
          <h1 id="ev-t" class="ev-oculto">Eventos de REEF Records</h1>
          <!-- Orbitron 900 a 175.8 de cuerpo: la tinta de EVENTOS mide justo 1000 de ancho y 126.4 de alto,
               y con la línea base en 126.4 las letras llenan el viewBox de borde a borde.
               preserveAspectRatio="none" deja que el CSS lo estire en alto como un afiche. El rectángulo negro
               se sale del viewBox hacia arriba y a los lados: es el fondo de todo el panel, así el único hueco
               por donde se ve la foto son las letras. -->
          <svg class="ev-calado" viewBox="0 0 1000 126.4" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
              <mask id="ev-hueco" maskUnits="userSpaceOnUse" x="-1500" y="-3000" width="4000" height="3126.4">
                <rect x="-1500" y="-3000" width="4000" height="3126.4" fill="#fff" />
                <text x="500" y="126.4" text-anchor="middle" fill="#000">EVENTOS</text>
              </mask>
            </defs>
            <rect x="-1500" y="-3000" width="4000" height="3126.4" fill="currentColor" mask="url(#ev-hueco)" />
            <!-- filo azul: las letras se leen aunque detrás quede una parte oscura de la foto -->
            <text class="ev-filo" x="500" y="126.4" text-anchor="middle" vector-effect="non-scaling-stroke">EVENTOS</text>
          </svg>
        </div>
        <!-- cinta pegada sobre el borde del panel, con las fechas -->
        <p class="ev-cinta" aria-hidden="true">
          <!-- dos tiras iguales que corren una tras otra; cada una más ancha que la pantalla para que no se vea el corte -->
          <span v-for="k in 2" :key="k"><template v-for="r in 4" :key="r">Próximas fechas<template v-for="e in EVENTOS" :key="e.id"> ✦ {{ e.fecha[0] }}.{{ e.fecha[1] }}</template> ✦ Bogotá ✦&nbsp;</template></span>
        </p>
        <div class="ev-portada-pie">
          <p>{{ EVENTOS.length }} fechas · {{ temporada }}</p>
          <a class="ev-desliza" href="#cartel">Desliza <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <!-- cartel: los próximos eventos como boletos, con stickers y estrellas encima -->
      <section id="cartel" class="ev-cartel" aria-labelledby="cartel-t">
        <div class="ev-fondo-texto" aria-hidden="true"><span>Próximos</span><span>Próximos</span><span>Próximos</span></div>

        <header class="ev-cabeza revelar">
          <svg class="ev-tiburones" viewBox="0 0 358.69 245.65" aria-hidden="true" focusable="false">
            <path v-for="(d, i) in TIBURONES" :key="i" :d="d" />
          </svg>
          <p class="ev-presenta">REEF Records presenta</p>
          <h2 id="cartel-t">Próximos <em>eventos</em></h2>
          <p class="ev-temporada">Temporada 2026 · Bogotá</p>
        </header>

        <ol class="ev-lista">
          <li
            v-for="(e, i) in EVENTOS" :key="e.id"
            class="ev-boleto revelar" :class="[`papel-${e.papel}`, i % 2 ? 'derecha' : 'izquierda']"
          >
            <article class="ev-ticket" :aria-labelledby="`${e.id}-t`">
              <!-- el papel va aparte: su borde dentado lo recorta, pero fotos y sticker pueden salirse del boleto -->
              <span class="ev-papel" aria-hidden="true"></span>
              <p class="ev-dia"><span>{{ e.dia }}</span></p>
              <div class="ev-fotos" :class="`fotos-${e.artistas.length}`">
                <span v-for="(a, j) in artistasDe(e)" :key="a.slug" class="ev-foto-a" :class="`f${j}`">
                  <img :src="a.retrato" alt="" width="736" height="981" loading="lazy" decoding="async">
                </span>
              </div>
              <div class="ev-info">
                <p class="ev-serie">{{ e.serie }}</p>
                <h3 :id="`${e.id}-t`">{{ e.nombre }}</h3>
                <ul class="ev-artistas" aria-label="Line-up">
                  <li v-for="a in artistasDe(e)" :key="a.slug"><a :href="`/musica/${a.slug}`">{{ a.nombre }}</a></li>
                </ul>
                <div class="ev-cuando">
                  <p class="ev-fecha"><b>{{ e.fecha[0] }}</b><span>{{ e.fecha[1] }}</span><span class="ev-oculto"> · {{ e.dia }}</span></p>
                  <p class="ev-hora">{{ e.hora }}<span>{{ e.lugar }} · {{ e.barrio }}</span></p>
                </div>
              </div>
              <div class="ev-talon">
                <p class="ev-numero" aria-hidden="true">{{ e.numero }}</p>
                <p class="ev-admite">Admite 1</p>
                <span class="ev-barras" aria-hidden="true"></span>
                <a class="ev-reservar" :href="reservar(e)" target="_blank" rel="noopener">
                  Reservar <span aria-hidden="true">↗</span><span class="ev-oculto"> entradas para {{ e.nombre }} por WhatsApp (se abre en una pestaña nueva)</span>
                </a>
              </div>
              <img class="ev-sticker" :src="e.sticker.src" alt="" :width="e.sticker.ancho" :height="e.sticker.alto" loading="lazy" decoding="async">
              <svg v-for="k in 2" :key="k" class="ev-estrella" :class="`e${k}`" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 0c1 8 4 11 12 12-8 1-11 4-12 12-1-8-4-11-12-12 8-1 11-4 12-12z" />
              </svg>
            </article>
          </li>
        </ol>

        <p class="ev-pie revelar">Entradas y lista por WhatsApp · REEF Records · Bogotá</p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Música / Eventos: portada con la foto vista a través de EVENTOS calado en un panel negro,
   y los próximos eventos como un cartel de boletos (fotos en duotono, stickers y estrellas sobrepuestos). */
import { ARTISTAS, type Artista } from '~/data/artistas'
import { EVENTOS, type Evento } from '~/data/eventos'
import { enlaceWhatsApp } from '~/data/contacto'
import { TIBURONES } from '~/data/tiburones'

const artistasDe = (e: Evento) => e.artistas.map(s => ARTISTAS.find(a => a.slug === s)).filter((a): a is Artista => !!a)
const reservar = (e: Evento) => enlaceWhatsApp(`Hola, REEF. Quiero entradas para ${e.nombre} (${e.dia} ${e.fecha.join(' ')}, ${e.lugar}).`)
// "Oct — Dic": del primer al último evento
const temporada = `${EVENTOS[0]!.fecha[1]} — ${EVENTOS.at(-1)!.fecha[1]}`

useRevelar()

useHead({
  title: 'Eventos · Música · REEF Records',
  htmlAttrs: { class: 'dentro' },
  bodyAttrs: { class: 'pagina-eventos' },
  meta: [{ name: 'description', content: 'Próximos eventos de REEF Records en Bogotá: fechas, line-up y reservas por WhatsApp.' }],
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
@import '~/assets/css/selector.css';
@import '~/assets/css/eventos.css';
</style>
