<template>
  <div>
    <OceanoMar ref="mar" />
    <MantasSombras />
    <div class="velo" aria-hidden="true"></div>
    <NieveMarina descenso />

    <a class="marca" href="/" aria-label="REEF, inicio">
      <img src="/assets/reef-web-corner.png" alt="REEF Records">
    </a>

    <SiteNav causas="#causa" inicio :visible="navVisible" />

    <header id="inicio" ref="heroe" class="heroe">
      <div class="bloque">
        <h1 class="titulo">
          <img class="logotipo" src="/assets/reef-logo.png" alt="REEF Records">
        </h1>
      </div>
      <button id="accion" ref="accion" class="accion" type="button" @click="alEntrar">Entra al arrecife</button>
    </header>

    <main>
      <!-- Zona de descenso: el mar se oscurece y aparece la nieve marina -->
      <div class="descenso" aria-hidden="true"></div>

      <!-- ═════════ SECCIÓN 2 · LA CAUSA ═════════ -->
      <section id="causa" ref="causa" class="causa" aria-labelledby="causa-t">
        <div class="causa-texto">
          <h2 id="causa-t" ref="causaT" class="revelar" tabindex="-1">No somos un producto, somos una <em>causa</em> que se comunica con música</h2>
        </div>

        <p class="causa-lema revelar d1">Música electrónica, moda circular y ciencia por el océano</p>

        <CorrienteObjetos :objetos="OBJETOS" etiqueta="Secciones de REEF" />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Inicio: hero anclado, descenso y la causa */
import { esReducido } from '~/utils/gl'
import type { ObjetoCorriente } from '~/components/CorrienteObjetos.vue'

// Merch y Causas aún no tienen página: el destino queda en ruta
const OBJETOS: ObjetoCorriente[] = [
  { clase: 'objeto-merch', href: '#', ruta: '/merch', img: '/assets/objetos/merch-camiseta.webp', ancho: 1180, alto: 1331, nombre: 'Merch' },
  { clase: 'objeto-musica', href: '/musica', ruta: '/musica', img: '/assets/objetos/musica-vinilo.webp', ancho: 1253, alto: 1253, nombre: 'Música' },
  { clase: 'objeto-causas', href: '#', ruta: '/causas', img: '/assets/objetos/causas-mantarraya.webp', ancho: 1253, alto: 1253, nombre: 'Causas' }
]

const mar = ref<{ onda: (x: number, y: number) => void } | null>(null)
const heroe = ref<HTMLElement | null>(null)
const accion = ref<HTMLElement | null>(null)
const causa = ref<HTMLElement | null>(null)
const causaT = ref<HTMLElement | null>(null)
const reef = useReef()

const { navVisible } = useDescenso({ heroe, causa, causaT, accion })

// "Entra al arrecife": onda en el agua y, un instante después, el descenso (antes en oceano.js)
function alEntrar(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  mar.value?.onda(r.left + r.width / 2, r.top + r.height / 2)
  setTimeout(() => reef.entrar(), esReducido() ? 0 : 350)
}

useHead({
  title: 'REEF Records',
  // Solo en el servidor: el primer pintado ya sale anclado; en el cliente lo lleva useDescenso
  htmlAttrs: { class: import.meta.server ? 'anclado' : undefined },
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
</style>
