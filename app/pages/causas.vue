<template>
  <div>
    <MarcaReef />
    <SiteNav actual="/causas" />

    <main class="causas">
      <!-- 1 · Portada: el estampado topográfico en movimiento -->
      <section class="c-portada" aria-labelledby="causas-t">
        <TopografiaMar />
        <div class="c-velo" aria-hidden="true"></div>
        <div class="c-grano" aria-hidden="true"></div>

        <div class="c-meta" aria-hidden="true">
          <span>Causas<br>Proyectos sin ánimo de lucro</span>
          <span>REEF Records × Océano</span>
          <span>3 proyectos<br>Educar · Transformar</span>
        </div>

        <h1 id="causas-t" class="c-titulo">La música convoca.<br>La causa transforma.</h1>

        <div class="c-frases">
          <p class="c-frase a"><b>Educar</b> es contarle a un salón entero lo que está pasando bajo el agua.</p>
          <p class="c-frase b"><b>Transformar</b> es devolverle un uso a lo que íbamos a botar.</p>
          <p class="c-frase c"><b>Cuidar</b> es entender que el plástico de hoy es el mar de mañana.</p>
        </div>

        <a class="c-desliza" href="#sobre">Desliza <span aria-hidden="true">↓</span></a>
      </section>

      <!-- 2 · Manifiesto en cruz -->
      <section id="sobre" class="c-manifiesto" aria-labelledby="manifiesto-t">
        <div class="c-fila">
          <span class="c-tag">[Sobre las causas]</span>
          <p class="revelar">Las causas son los proyectos sin ánimo de lucro de REEF Records. Nacen de la misma comunidad que llena los eventos y buscan crecer con donaciones, entidades públicas y empresas aliadas.</p>
          <figure class="c-miniatura fin">
            <img :src="src(FOTOS.manta, 800)" width="800" :height="Math.round(800 * FOTOS.manta.alto / FOTOS.manta.ancho)" :alt="FOTOS.manta.alt" loading="lazy" decoding="async">
          </figure>
        </div>

        <div class="c-cruz">
          <i class="l"></i><i class="r"></i><i class="t"></i><i class="b"></i>
          <div class="c-marco">
            <span></span><span></span><span></span><span></span>
            <h2 id="manifiesto-t">Música<br>que protege<br>el océano</h2>
          </div>
        </div>

        <div class="c-fila abajo">
          <figure class="c-miniatura">
            <img :src="src(FOTOS.multitud, 800)" width="800" height="534" :alt="FOTOS.multitud.alt" loading="lazy" decoding="async">
          </figure>
          <p class="revelar">Tres proyectos y una misma idea: lo que pasa en la fiesta, en el salón de clase y en la cocina también termina en el mar.</p>
          <a class="c-tag fin" href="#apoyar">[Cómo apoyar ↓]</a>
        </div>
      </section>

      <!-- 3 · Proyectos: lista numerada fija y fotos grandes que pasan -->
      <section id="proyectos" class="c-proyectos" aria-labelledby="proyectos-t">
        <div class="c-panel">
          <aside class="c-indice">
            <p class="c-antetitulo">Proyectos</p>
            <h2 id="proyectos-t">Tres formas de devolverle algo al mar</h2>
            <p class="c-intro">Hoy los movemos con la comunidad. Con apoyo pueden llegar a más colegios, más cocinas y más eventos.</p>
            <ol class="c-lista">
              <li v-for="p in PROYECTOS" :key="p.id">
                <a :href="`#${p.id}`" :aria-current="activo === p.id ? 'true' : undefined">
                  <span class="n">{{ p.numero }}.</span>{{ p.corto }}
                </a>
              </li>
            </ol>
          </aside>

          <div class="c-articulos">
            <article v-for="p in PROYECTOS" :id="p.id" :key="p.id" ref="articulos" class="c-proyecto" :aria-labelledby="`${p.id}-t`">
              <figure class="c-foto">
                <img
                  :src="src(p.foto, 1600)" :srcset="srcset(p.foto)" sizes="(max-width: 900px) calc(100vw - 2 * var(--margen-header)), 56vw"
                  :width="p.foto.ancho" :height="p.foto.alto" :alt="p.foto.alt" :style="p.foto.encuadre ? { '--encuadre': p.foto.encuadre } : undefined" loading="lazy" decoding="async"
                >
                <figcaption><Credito :foto="p.foto" /></figcaption>
              </figure>
              <div class="c-texto">
                <p class="c-numero"><span>{{ p.numero }}</span>{{ p.corto }}</p>
                <h3 :id="`${p.id}-t`">{{ p.titulo }}</h3>
                <p>{{ p.texto }}</p>
                <ol class="c-pasos">
                  <li v-for="(paso, i) in p.pasos" :key="i"><span>{{ i + 1 }}</span>{{ paso }}</li>
                </ol>
                <blockquote class="c-conciencia">{{ p.conciencia }}</blockquote>
                <figure class="c-detalle">
                  <img :src="src(p.detalle, 800)" width="800" :height="Math.round(800 * p.detalle.alto / p.detalle.ancho)" :alt="p.detalle.alt" loading="lazy" decoding="async">
                  <figcaption><Credito :foto="p.detalle" /></figcaption>
                </figure>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- 4 · Cifras sobre la foto del plástico en el mar -->
      <section class="c-datos" aria-labelledby="datos-t">
        <img class="c-datos-fondo" :src="src(FOTOS.plastico, 1600)" :srcset="srcset(FOTOS.plastico)" sizes="100vw" :width="FOTOS.plastico.ancho" :height="FOTOS.plastico.alto" :alt="FOTOS.plastico.alt" loading="lazy" decoding="async">
        <div class="c-datos-interior">
          <h2 id="datos-t" class="revelar">El plástico de hoy<br>es el mar de mañana.</h2>
          <dl class="c-cifras">
            <div v-for="(d, i) in DATOS" :key="d.cifra" class="revelar" :class="`d${i}`">
              <dt>{{ d.cifra }}</dt>
              <dd>{{ d.texto }}<small>{{ d.fuente }}</small></dd>
            </div>
          </dl>
          <p class="c-credito-fondo"><Credito :foto="FOTOS.plastico" /></p>
        </div>
      </section>

      <!-- 5 · Cómo apoyar -->
      <section id="apoyar" class="c-apoyar" aria-labelledby="apoyar-t">
        <div class="c-apoyar-texto">
          <p class="c-antetitulo">Cómo apoyar</p>
          <h2 id="apoyar-t" class="revelar">Las causas crecen con quienes se suman</h2>
          <p class="revelar d1">Buscamos donaciones y el apoyo de entidades públicas y empresas privadas para llevar más charlas a más colegios, transformar más residuos y convertir más botellas en objetos. Escríbenos y te contamos en qué va cada proyecto.</p>
          <div class="c-acciones revelar d2">
            <a class="c-boton" :href="DONAR" target="_blank" rel="noopener">Quiero donar <span aria-hidden="true">↗</span><span class="c-oculto"> (WhatsApp, se abre en una pestaña nueva)</span></a>
            <a class="c-boton secundario" :href="ALIADOS" target="_blank" rel="noopener">Apoyar como empresa o entidad <span aria-hidden="true">↗</span><span class="c-oculto"> (WhatsApp, se abre en una pestaña nueva)</span></a>
          </div>
        </div>
        <div class="c-mosaico">
          <figure v-for="f in [FOTOS.terraza, FOTOS.barra, FOTOS.local]" :key="f.archivo">
            <img :src="src(f, 800)" :srcset="srcset(f)" sizes="(max-width: 900px) 50vw, 26vw" :width="f.ancho" :height="f.alto" :alt="f.alt" loading="lazy" decoding="async">
          </figure>
          <p class="c-mosaico-pie">La comunidad REEF · fotos de nuestros eventos</p>
        </div>
      </section>

      <!-- 6 · Cierre: la frase corre de lado a lado -->
      <section class="c-cierre" aria-label="Cierre">
        <p class="c-oculto">No hay música en un océano en silencio.</p>
        <div class="c-cinta" aria-hidden="true">
          <span v-for="i in 4" :key="i">No hay música en un océano en silencio <i>✦</i></span>
        </div>
        <p class="c-creditos">
          Imágenes de referencia de los proyectos, de
          <template v-for="(a, i) in CREDITOS" :key="a.usuario"><a :href="`https://unsplash.com/@${a.usuario}?utm_source=reef_records&utm_medium=referral`" target="_blank" rel="noopener">{{ a.nombre }}</a>{{ i < CREDITOS.length - 2 ? ', ' : i === CREDITOS.length - 2 ? ' y ' : '' }}</template>
          en <a href="https://unsplash.com/?utm_source=reef_records&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>. Las fotos de eventos son de REEF Records.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Causas: proyectos sin ánimo de lucro (educación en colegios, residuos orgánicos y botellas
   convertidas en material de impresión 3D). Fondo topográfico en movimiento y fotos reales. */
import { CREDITOS, DATOS, FOTOS, PROYECTOS, type Foto } from '~/data/causas'
import { enlaceWhatsApp } from '~/data/contacto'

const src = (f: Foto, w: 800 | 1600) => `/assets/causas/${f.archivo}-${w}.webp`
const srcset = (f: Foto) => `${src(f, 800)} 800w, ${src(f, 1600)} 1600w`

const DONAR = enlaceWhatsApp('Hola, REEF. Quiero donar a las causas.')
const ALIADOS = enlaceWhatsApp('Hola, REEF. Escribo de parte de una empresa o entidad y queremos apoyar las causas.')

// Crédito de cada foto: las de los proyectos son de referencia hasta que haya fotos propias
const Credito = defineComponent({
  props: { foto: { type: Object as PropType<Foto>, required: true } },
  setup: p => () => p.foto.autor
    ? h('span', { class: 'c-credito' }, [
        h('b', 'Imagen de referencia'), ' · ',
        h('a', { href: `https://unsplash.com/@${p.foto.autor.usuario}?utm_source=reef_records&utm_medium=referral`, target: '_blank', rel: 'noopener' }, p.foto.autor.nombre),
        ' / Unsplash'
      ])
    : h('span', { class: 'c-credito' }, 'Foto: REEF Records')
})

// Lista numerada: se marca el proyecto que está en el centro de la pantalla
const activo = ref(PROYECTOS[0]!.id)
const articulos = ref<HTMLElement[]>([])
let vista: IntersectionObserver | null = null
onMounted(() => {
  vista = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) activo.value = e.target.id
  }, { rootMargin: '-45% 0px -45% 0px' })
  articulos.value.forEach(a => vista!.observe(a))
})
onBeforeUnmount(() => vista?.disconnect())

useRevelar()

useHead({
  title: 'Causas · REEF Records',
  htmlAttrs: { class: 'dentro' },
  bodyAttrs: { class: 'pagina-causas' },
  meta: [
    { name: 'description', content: 'Causas de REEF Records: educación sobre el océano en colegios, empaques biodegradables con residuos de fruta y botellas de nuestros eventos convertidas en material de impresión 3D.' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Orbitron:wght@400;500;600;700&display=swap' }
  ]
})
</script>

<style>
@import '~/assets/css/hero.css';
@import '~/assets/css/nav.css';
@import '~/assets/css/causas.css';
</style>
