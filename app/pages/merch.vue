<template>
  <div>
    <MarcaReef tono="negro" />

    <SiteNav actual="/merch" />

    <main>
      <MerchPortada />

      <!-- la colección sube y tapa la portada, que queda fija detrás -->
      <section id="coleccion" class="m-hoja" aria-labelledby="coleccion-t">
        <div class="m-interior">
          <header class="m-cabeza">
            <div>
              <h2 id="coleccion-t">Colección <i lang="la">Mobula birostris</i></h2>
            </div>
            <ul class="m-ficha">
              <li>Walbaum, 1792</li>
              <li>Envergadura · hasta 7 m</li>
              <li>En peligro · UICN</li>
              <li><a href="/ciencia/especies">Conoce la especie →</a></li>
            </ul>
          </header>

          <div class="m-barra">
            <div class="m-filtros" role="group" aria-label="Filtrar por corte">
              <button
                v-for="f in FILTROS" :key="f.id" type="button"
                :aria-pressed="String(f.id === filtro)" @click="filtro = f.id"
              >{{ f.texto }} · {{ cuenta(f.id) }}</button>
            </div>
            <p class="m-aviso">Pedidos por WhatsApp · te atiende el equipo REEF</p>
          </div>
          <p class="m-oculto" aria-live="polite">{{ visibles.length }} {{ visibles.length === 1 ? 'camiseta' : 'camisetas' }}</p>

          <div class="m-rejilla">
            <MerchTarjeta v-for="p in visibles" :key="p.codigo" :p="p" />
          </div>

          <dl class="m-specs">
            <div><dt>Tela</dt><dd>Algodón peinado de gramaje pesado.</dd></div>
            <div><dt>Impresión</dt><dd>Serigrafía a dos tintas; el semitono de las mantas se imprime con trama gruesa.</dd></div>
            <div><dt>Cuidado</dt><dd>Lavar al revés en agua fría. No planchar sobre el diseño.</dd></div>
          </dl>

          <footer class="m-pie">
            <span><span class="m-kanji" aria-hidden="true">海</span>Mobula birostris — Edición 01</span>
            <a :href="DUDAS" target="_blank" rel="noopener">¿Dudas con la talla? Escríbenos<span class="m-oculto"> por WhatsApp (se abre en una pestaña nueva)</span></a>
          </footer>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Merch: edición 01. Página clara, sin el mar de fondo: papel blanco y tinta abismo,
   con el azul REEF en lo que se elige o se pide. Los pedidos se atienden por WhatsApp. */
import { PRODUCTOS, type Genero } from '~/data/merch'
import { enlaceWhatsApp } from '~/data/contacto'

type Filtro = 'todo' | Genero
const FILTROS: { id: Filtro, texto: string }[] = [
  { id: 'todo', texto: 'Todo' },
  { id: 'hombre', texto: 'Hombre' },
  { id: 'mujer', texto: 'Mujer' }
]
const filtro = ref<Filtro>('todo')
const visibles = computed(() => PRODUCTOS.filter(p => filtro.value === 'todo' || p.genero === filtro.value))
const cuenta = (f: Filtro) => f === 'todo' ? PRODUCTOS.length : PRODUCTOS.filter(p => p.genero === f).length

const DUDAS = enlaceWhatsApp('Hola, REEF. Tengo una pregunta sobre las tallas de la edición Mobula birostris.')

useHead({
  title: 'Merch · REEF Records',
  htmlAttrs: { class: 'dentro' },
  bodyAttrs: { class: 'pagina-merch' },
  meta: [
    { name: 'description', content: 'Edición 01, Mobula birostris: tres camisetas con la manta gigante en semitono. Pedidos por WhatsApp.' },
    { name: 'theme-color', content: '#ffffff' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&family=Orbitron:wght@400;500;600&display=swap' }
  ]
})
</script>

<style>
@import '~/assets/css/hero.css';
@import '~/assets/css/nav.css';
@import '~/assets/css/merch.css';
</style>
