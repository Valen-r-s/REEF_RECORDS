<template>
  <div>
    <OceanoMar />
    <div class="velo" aria-hidden="true"></div>
    <NieveMarina />

    <a class="marca" href="/" aria-label="REEF, inicio">
      <img src="/assets/reef-web-corner.png" alt="REEF Records">
    </a>

    <SiteNav actual="/ciencia" causas="/#causa" />

    <main class="ciencia especies">
      <h1 class="oculto">Ciencia · Especies</h1>

      <SelectorEspecie v-model="especie" />

      <a class="volver" href="/ciencia"><span aria-hidden="true">←</span> Ciencia</a>

      <EspecieBitmap :especie="especie" :vista="FICHAS[especie]!.vista" />

      <!-- ═════════ Mantarraya gigante ═════════ -->
      <article class="ficha" id="ficha-manta" role="tabpanel" aria-labelledby="tab-manta" :hidden="especie !== 'manta'">
        <h2 class="binomio"><i lang="la">Mobula birostris</i> <span class="autor">(Walbaum, 1792)</span></h2>
        <p class="comun">Mantarraya gigante oceánica</p>

        <div class="estado" style="--cat: var(--cat-en)">
          <ol class="escala" aria-label="Categorías de la Lista Roja de la UICN">
            <li><a class="cat" style="--cat: var(--cat-lc)" href="https://www.iucnredlist.org/species/198921/214397182" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="Preocupación menor">LC</a></li>
            <li><a class="cat" style="--cat: var(--cat-nt)" href="https://www.iucnredlist.org/species/198921/214397182" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="Casi amenazada">NT</a></li>
            <li><a class="cat" style="--cat: var(--cat-vu)" href="https://www.iucnredlist.org/species/198921/214397182" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="Vulnerable">VU</a></li>
            <li><a class="cat activa" style="--cat: var(--cat-en)" href="https://www.iucnredlist.org/species/198921/214397182" target="_blank" rel="noopener" title="En peligro · ver en la Lista Roja de la UICN" aria-label="En peligro (EN): ver la evaluación de Mobula birostris en la Lista Roja de la UICN, se abre en una pestaña nueva">EN</a></li>
            <li><a class="cat" style="--cat: var(--cat-cr)" href="https://www.iucnredlist.org/species/198921/214397182" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="En peligro crítico">CR</a></li>
            <li><a class="cat" style="--cat: var(--cat-ew)" href="https://www.iucnredlist.org/species/198921/214397182" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="Extinta en estado silvestre">EW</a></li>
            <li><a class="cat" style="--cat: var(--cat-ex)" href="https://www.iucnredlist.org/species/198921/214397182" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="Extinta">EX</a></li>
          </ol>
          <p class="estado-texto"><b>En peligro</b><span>Lista Roja UICN · evaluada en 2019 · población en descenso</span></p>
        </div>

        <dl class="cifras">
          <div><dt>Envergadura máxima</dt><dd>7 m</dd></div>
          <div><dt>Cría cada 2–3 años</dt><dd>1</dd></div>
          <div><dt>Años de vida</dt><dd>40+</dd></div>
        </dl>

        <h3 class="etiqueta">Datos curiosos</h3>
        <ol class="curiosos">
          <li>Es la raya más grande del planeta. Nada batiendo sus aletas pectorales como si volara bajo el agua.</li>
          <li>Tiene uno de los cerebros más grandes, en proporción a su cuerpo, entre todos los peces. En experimentos frente a un espejo ha mostrado conductas asociadas al autorreconocimiento.</li>
          <li>Las manchas de su vientre son únicas en cada individuo, como una huella dactilar: los científicos las usan para identificarlas en fotografías.</li>
          <li>Se alimenta de zooplancton filtrando el agua; despliega sus aletas cefálicas para guiar el alimento hacia la boca.</li>
          <li>Se reproduce muy despacio: tras cerca de un año de gestación nace una sola cría. Por eso la pesca, dirigida o accidental, la afecta tanto.</li>
        </ol>

        <a class="ir-mapa" href="/ciencia/mapa">Dónde encontrarla en el mapa <span aria-hidden="true">→</span></a>
      </article>

      <!-- ═════════ Tiburón martillo ═════════ -->
      <article class="ficha" id="ficha-martillo" role="tabpanel" aria-labelledby="tab-martillo" :hidden="especie !== 'martillo'">
        <h2 class="binomio"><i lang="la">Sphyrna lewini</i> <span class="autor">(Griffith &amp; Smith, 1834)</span></h2>
        <p class="comun">Tiburón martillo común</p>

        <div class="estado" style="--cat: var(--cat-cr)">
          <ol class="escala" aria-label="Categorías de la Lista Roja de la UICN">
            <li><a class="cat" style="--cat: var(--cat-lc)" href="https://www.iucnredlist.org/species/39385/2918526" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="Preocupación menor">LC</a></li>
            <li><a class="cat" style="--cat: var(--cat-nt)" href="https://www.iucnredlist.org/species/39385/2918526" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="Casi amenazada">NT</a></li>
            <li><a class="cat" style="--cat: var(--cat-vu)" href="https://www.iucnredlist.org/species/39385/2918526" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="Vulnerable">VU</a></li>
            <li><a class="cat" style="--cat: var(--cat-en)" href="https://www.iucnredlist.org/species/39385/2918526" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="En peligro">EN</a></li>
            <li><a class="cat activa" style="--cat: var(--cat-cr)" href="https://www.iucnredlist.org/species/39385/2918526" target="_blank" rel="noopener" title="En peligro crítico · ver en la Lista Roja de la UICN" aria-label="En peligro crítico (CR): ver la evaluación de Sphyrna lewini en la Lista Roja de la UICN, se abre en una pestaña nueva">CR</a></li>
            <li><a class="cat" style="--cat: var(--cat-ew)" href="https://www.iucnredlist.org/species/39385/2918526" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="Extinta en estado silvestre">EW</a></li>
            <li><a class="cat" style="--cat: var(--cat-ex)" href="https://www.iucnredlist.org/species/39385/2918526" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" title="Extinta">EX</a></li>
          </ol>
          <p class="estado-texto"><b>En peligro crítico</b><span>Lista Roja UICN · evaluada en 2018 · población en descenso</span></p>
        </div>

        <dl class="cifras">
          <div><dt>Longitud máxima</dt><dd>4,3 m</dd></div>
          <div><dt>Crías por camada</dt><dd>12–41</dd></div>
          <div><dt>Declive estimado</dt><dd>&gt;80 %</dd></div>
        </dl>

        <h3 class="etiqueta">Datos curiosos</h3>
        <ol class="curiosos">
          <li>Su cabeza en forma de martillo, el cefalofolio, está cubierta de electrorreceptores (ampollas de Lorenzini) con los que detecta los campos eléctricos de sus presas, incluso bajo la arena.</li>
          <li>De día forma cardúmenes de cientos de individuos alrededor de islas y montes submarinos como Malpelo en Colombia, Isla del Coco y Galápagos. De noche se dispersa para cazar sola.</li>
          <li>Sus ojos, en los extremos del martillo, le dan un campo visual muy amplio y visión binocular hacia el frente.</li>
          <li>Las hembras dan a luz en aguas costeras poco profundas, como manglares y estuarios, que funcionan como guarderías: proteger la costa también es proteger al martillo.</li>
          <li>Su población mundial ha caído más de un 80 % en tres generaciones, sobre todo por la pesca y el comercio de sus aletas. Desde 2013 está incluido en el Apéndice II de CITES.</li>
        </ol>

        <a class="ir-mapa" href="/ciencia/mapa?especie=martillo">Dónde encontrarlo en el mapa <span aria-hidden="true">→</span></a>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
/* REEF Records · Ciencia / Especies: la especie en bitmap con su ficha, estado UICN y datos curiosos.
   El selector cambia la ficha visible y el bitmap; la especie queda en la URL (?especie=). */
const FICHAS: Record<string, { vista: string }> = {
  manta: { vista: 'Vista dorsal · hasta 7 m de envergadura' },
  martillo: { vista: 'Vista dorsal · hasta 4,3 m de longitud' }
}

// Páginas interiores: el mar queda fijo en el abismo, como en la sección de la causa
useReef().prof = 1

const especie = useEspecie()

useHead({
  title: 'Especies · Ciencia · REEF Records',
  htmlAttrs: { class: 'dentro' },
  bodyAttrs: { class: 'pagina-ciencia' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;1,400;1,500&family=Orbitron:wght@400;500;600;700;800;900&display=swap' }
  ]
})
</script>

<style>
@import '~/assets/css/hero.css';
@import '~/assets/css/causa.css';
@import '~/assets/css/nav.css';
@import '~/assets/css/selector.css';
@import '~/assets/css/ciencia.css';
</style>
