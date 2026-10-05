<template>
  <section id="atlas" class="atlas" aria-labelledby="atlas-t">
    <div ref="escenario" class="escenario">
      <svg ref="lienzo" class="atlas-mapa" role="img" :aria-label="`Mapa del mundo con los sitios donde se encuentra ${esp.binomio}`">
        <defs>
          <!-- la tierra se pinta en punteado, como el relieve de la referencia -->
          <pattern id="atlas-punteo" ref="punteo" width="3.4" height="3.4" patternUnits="userSpaceOnUse">
            <circle cx="1.7" cy="1.7" r="0.75" />
          </pattern>
          <radialGradient id="atlas-brillo">
            <stop offset="0" stop-color="#a3b0d3" stop-opacity=".5" />
            <stop offset=".55" stop-color="#657bb6" stop-opacity=".28" />
            <stop offset="1" stop-color="#657bb6" stop-opacity="0" />
          </radialGradient>
        </defs>
        <g ref="mundo" class="mundo"></g>
        <g ref="capa" class="capa"></g>
      </svg>

      <div v-if="aviso" class="hud cargando">{{ aviso }}</div>

      <div class="hud leyenda" aria-hidden="true">
        <div><i class="l-agregacion"></i>Agregación</div>
        <div><i class="l-individuo"></i>Individuos</div>
        <div><i class="l-ruta"></i>Ruta ilustrativa</div>
        <div><i class="l-registro"></i>Registros GBIF</div>
      </div>

      <div class="hud estado-hud" :style="{ '--cat': `var(--cat-${esp.uicn.codigo.toLowerCase()})` }" aria-live="polite">
        <svg class="ico" viewBox="0 0 44 38" aria-hidden="true"><path d="M22 2 42 36H2Z" fill="currentColor" /><path d="M22 13v12" stroke="#06182e" stroke-width="3" /><circle cx="22" cy="30" r="1.8" fill="#06182e" /></svg>
        <div class="w">
          <b>Estado</b>
          <a :href="esp.uicn.url" target="_blank" rel="noopener" :aria-label="`${esp.uicn.texto} (${esp.uicn.codigo}) en la Lista Roja de la UICN, se abre en una pestaña nueva`">
            {{ esp.uicn.texto }} · UICN <span class="cat-mini">{{ esp.uicn.codigo }}</span>
          </a>
        </div>
        <h2 :lang="seleccionado ? undefined : 'la'">{{ estadoNombre }}</h2>
        <div class="c">{{ estadoCoords }}</div>
        <div class="interruptor"><b>Migración</b>
          <button type="button" :aria-pressed="String(migrar)" @click="migrar = true">on</button>
          <button type="button" :aria-pressed="String(!migrar)" @click="migrar = false">off</button>
        </div>
      </div>

      <div v-show="!acercado" class="hud pista">Rueda o pellizco para acercar · arrastra para mover</div>
      <div class="hud credito">
        Registros: <a :href="`https://www.gbif.org/species/${registros.gbifKey}`" target="_blank" rel="noopener">GBIF.org</a>
        · Contornos: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>
      </div>
    </div>

    <aside class="lado">
      <div class="lado-cabeza"><slot name="cabeza" /></div>
      <h1 id="atlas-t">{{ esp.titulo }}<em><i lang="la">{{ esp.binomio }}</i> {{ esp.autor }}</em></h1>
      <ul class="sitios">
        <li v-for="(s, i) in esp.sitios" :key="esp.binomio + s.id">
          <button type="button" :aria-pressed="String(seleccionado === s.id)" @click="acciones.enfocar(s.id)">
            <span class="pin" aria-hidden="true"></span>
            <b>{{ s.nombre }}</b>
            <span class="k">{{ String(i + 1).padStart(2, '0') }} · {{ s.pais }} · {{ coords(s) }}</span>
            <p>{{ s.nota }}</p>
          </button>
        </li>
      </ul>
      <div class="pie">
        <div><b>Hábitat</b> {{ esp.habitat }}</div>
        <div>
          Los movimientos del mapa son ilustrativos: muestran desplazamientos locales y estacionales, no datos de rastreo satelital.
          Los puntos pequeños sí son reales: {{ registros.registros.toLocaleString('es-CO') }} avistamientos registrados en GBIF.org
          (CC0 y CC BY 4.0, <a href="/datos/gbif-fuentes.json" target="_blank" rel="noopener">datasets citados</a>).
          Contornos de <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>.
        </div>
        <a class="ir-especie" :href="especie === 'manta' ? '/ciencia/especies' : `/ciencia/especies?especie=${especie}`">Conoce la especie <span aria-hidden="true">→</span></a>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
/* REEF Records · Ciencia: atlas de la especie (antes el ciencia.html de landing-mobula, sobre d3)
   Mapa del mundo con zoom (rueda, pellizco, arrastre), los sitios de agregación de la especie, individuos
   que recorren su zona, rutas ilustrativas entre sitios y los avistamientos reales de GBIF.
   Al cambiar de especie solo cambia la información: sitios, rutas, registros, textos y estado UICN. */
import { select } from 'd3-selection'
import { zoom as crearZoom, zoomIdentity } from 'd3-zoom'
import 'd3-transition'
import { easeCubicInOut } from 'd3-ease'
import { geoArea, geoGraticule10, geoInterpolate, geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import GBIF from '~/data/gbif-especies.json'
import { ATLAS, type Sitio } from '~/data/atlas'
import { esReducido } from '~/utils/gl'

type Registros = { gbifKey: number, registros: number, celdas: [number, number, number][] }
const REGISTROS = GBIF.especies as unknown as Record<string, Registros>

const props = defineProps<{ especie: string }>()
const esp = computed(() => ATLAS[props.especie]!)
const registros = computed(() => REGISTROS[props.especie]!)

const fmt = (v: number, p: string, n: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? p : n}`
const coords = (s: Sitio) => `${fmt(s.lat, 'N', 'S')}  ${fmt(s.lon, 'E', 'O')}`
const CIRCUNGLOBAL = 'Distribución circunglobal'

const escenario = ref<HTMLElement | null>(null)
const lienzo = ref<SVGSVGElement | null>(null)
const mundo = ref<SVGGElement | null>(null)
const capa = ref<SVGGElement | null>(null)
const punteo = ref<SVGPatternElement | null>(null)

const aviso = ref('Cargando mapa…')
const estadoNombre = ref(esp.value.binomio)
const estadoCoords = ref(CIRCUNGLOBAL)
const seleccionado = ref<string | null>(null)
const migrar = ref(true)
const acercado = ref(false)
// las funciones de d3 existen solo después de montar
const acciones = { enfocar: (_id: string) => {}, verTodo: () => {} }
let limpiar = () => {}

const TIERRA = (res: '50m' | '10m') => `https://cdn.jsdelivr.net/npm/world-atlas@2/land-${res}.json`

onMounted(() => {
  const reducido = esReducido()
  migrar.value = !reducido
  const caja = escenario.value!
  const svg = select(lienzo.value!)
  const gMundo = select(mundo.value!)
  const gCapa = select(capa.value!)

  const proy = geoNaturalEarth1()
  const ruta = geoPath(proy)
  let W = 0, H = 0
  let T = zoomIdentity
  let tierra: any = null
  let detalle = false

  /* ───────── Mundo: esfera, retícula, tierra y registros (se escalan con el zoom) ───────── */
  const gBase = gMundo.append('g')
  const gRegistros = gMundo.append('g').attr('class', 'registros')

  function dibujarMundo() {
    W = caja.clientWidth; H = caja.clientHeight
    svg.attr('viewBox', `0 0 ${W} ${H}`)
    proy.fitExtent([[24, 64], [W - 24, H - 24]], { type: 'Sphere' } as any)
    gBase.selectAll('*').remove()
    gBase.append('path').attr('class', 'esfera').attr('d', ruta({ type: 'Sphere' } as any))
    gBase.append('path').attr('class', 'reticula').attr('d', ruta(geoGraticule10()))
    if (tierra) {
      const d = ruta(tierra)
      gBase.append('path').attr('class', 'tierra').attr('d', d)
      gBase.append('path').attr('class', 'tierra-punteo').attr('d', d)
    }
    dibujarRegistros()
    zoom.translateExtent([[-W * 0.1, -H * 0.1], [W * 1.1, H * 1.1]])
  }

  // Avistamientos de GBIF en celdas de 1°: el radio sigue el logaritmo del número de registros
  function dibujarRegistros() {
    const celdas = REGISTROS[props.especie]!.celdas
    gRegistros.selectAll('circle').data(celdas).join('circle')
      .each(function (this: SVGCircleElement, c: [number, number, number]) {
        const p = proy([c[1], c[0]])
        if (!p) return
        this.setAttribute('cx', String(p[0])); this.setAttribute('cy', String(p[1]))
        this.dataset.r = String(0.9 + 0.75 * Math.log10(c[2] + 1))
      })
    escalarRegistros()
  }
  // radio constante en pantalla aunque el grupo se escale con el zoom
  function escalarRegistros() {
    gRegistros.selectAll<SVGCircleElement, unknown>('circle').each(function () {
      this.setAttribute('r', String(Number(this.dataset.r) / T.k))
    })
  }

  // Algunos anillos vienen con el sentido de giro que d3 lee al revés: ocupan más de un hemisferio y
  // pintarían todo el mar (en land-10m hay 3 polígonos degenerados de 4 puntos que d3 lee como la esfera
  // entera). Se invierten, como hacía fix() en el ciencia.html de landing-mobula.
  function corregirGiro(coleccion: any) {
    const invertir = (poli: number[][][]) => poli.map(anillo => anillo.slice().reverse())
    const grande = (poli: number[][][]) => geoArea({ type: 'Polygon', coordinates: poli } as any) > 2 * Math.PI
    for (const f of coleccion.features ?? [coleccion]) {
      const g = f.geometry
      if (g.type === 'Polygon' && grande(g.coordinates)) g.coordinates = invertir(g.coordinates)
      else if (g.type === 'MultiPolygon') g.coordinates = g.coordinates.map((p: number[][][]) => grande(p) ? invertir(p) : p)
    }
    return coleccion
  }

  async function cargarTierra(res: '50m' | '10m') {
    const topo = await fetch(TIERRA(res)).then(r => r.json())
    tierra = corregirGiro(feature(topo, topo.objects.land))
    gBase.selectAll('path.tierra, path.tierra-punteo').attr('d', ruta(tierra))
    if (!gBase.select('path.tierra').size()) dibujarMundo()
  }

  /* ───────── Zoom ───────── */
  const zoom = crearZoom().scaleExtent([1, 40]).on('zoom', (e: any) => {
    T = e.transform
    gMundo.attr('transform', T.toString())
    // el punteo de la tierra mantiene su tamaño en pantalla
    punteo.value!.setAttribute('patternTransform', `scale(${1 / T.k})`)
    escalarRegistros()
    acercado.value = T.k >= 1.3
    // de cerca, contornos con más detalle (una sola vez)
    if (T.k >= 4 && !detalle) {
      detalle = true
      cargarTierra('10m').catch(() => { detalle = false })
    }
  })
  svg.call(zoom as any).on('dblclick.zoom', null)
  const pantalla = (lon: number, lat: number): [number, number] => T.apply(proy([lon, lat])!) as [number, number]

  /* ───────── Capa: rutas, individuos, sitios y anillo (se reproyecta en cada cuadro) ───────── */
  const gRutas = gCapa.append('g').attr('class', 'rutas')
  const gPeces = gCapa.append('g').attr('class', 'peces')
  const gMarco = gCapa.append('g').attr('class', 'marco').style('display', 'none')
  const gMarcas = gCapa.append('g')
  const gAnillo = gCapa.append('g').attr('class', 'anillo').style('display', 'none')

  // marco fino alrededor de la zona del sitio enfocado, con su rótulo, como los recuadros de la referencia
  const marcoRect = gMarco.append('rect').attr('class', 'marco-caja')
  const marcoTag = gMarco.append('g')
  const marcoTagFondo = marcoTag.append('rect').attr('class', 'tag-fondo').attr('height', 14).attr('y', -11)
  const marcoTagTexto = marcoTag.append('text').attr('x', 5)

  // anillo del sitio enfocado
  gAnillo.append('circle').attr('class', 'brillo').attr('r', 58)
  gAnillo.append('circle').attr('class', 'pulso').attr('r', 58)
  gAnillo.append('circle').attr('class', 'borde').attr('r', 62)
  const aCoords = gAnillo.append('text').attr('class', 'coords').attr('text-anchor', 'middle').attr('y', -30)
  const aRotulo = gAnillo.append('g').attr('transform', 'translate(-196,-2)')
  aRotulo.append('path').attr('d', 'M0 0 9 -15 18 0Z').attr('class', 'tri')
  aRotulo.append('text').attr('class', 'agregacion').attr('x', 26).text('Agregación')
  const aNombre = gAnillo.append('text').attr('class', 'nombre').attr('x', -170).attr('y', 16)
  gAnillo.append('circle').attr('class', 'mira').attr('r', 9)
  gAnillo.append('circle').attr('class', 'centro').attr('r', 3)

  type Pez = { s: Sitio, ph: number, sp: number, w: number, j: number, hist: [number, number][] }
  type Viajero = { ip: (t: number) => [number, number], ph: number, sp: number, hist: [number, number][] }
  let sitios: Sitio[] = []
  let porId: Record<string, Sitio> = {}
  let rutas: [string, string][] = []
  let peces: Pez[] = []
  let viajeros: Viajero[] = []
  let marcas: any = null
  let etiquetas = new Map<string, string>()

  function ponerEspecie(id: string, animar: boolean) {
    const e = ATLAS[id]!
    sitios = e.sitios
    porId = Object.fromEntries(sitios.map(s => [s.id, s]))
    rutas = e.rutas

    gMarcas.selectAll('g.sitio').remove()
    marcas = gMarcas.selectAll('g.sitio').data(sitios).join('g').attr('class', 'sitio')
      .on('click', (_ev: MouseEvent, d: Sitio) => enfocar(d.id))
    marcas.append('circle').attr('class', 'toque').attr('r', 14)
    marcas.append('circle').attr('class', 'nucleo').attr('r', 5)
    marcas.append('circle').attr('class', 'dentro').attr('r', 1.8)
    const tag = marcas.append('g').attr('class', 'tag').attr('transform', 'translate(10,0)')
    tag.append('rect').attr('class', 'tag-fondo').attr('height', 14).attr('y', -7)
    tag.append('text').attr('x', 5).attr('y', 3)
    etiquetas = new Map()

    // cada individuo recorre la zona de su sitio en un ciclo lento
    peces = []
    sitios.forEach((s) => {
      for (let i = 0; i < 12; i++) peces.push({ s, ph: Math.random() * Math.PI * 2, sp: 0.05 + Math.random() * 0.06, w: 0.55 + Math.random() * 0.45, j: Math.random() * 10, hist: [] })
    })
    viajeros = []
    rutas.forEach(([a, b]) => {
      const ip = geoInterpolate([porId[a]!.lon, porId[a]!.lat], [porId[b]!.lon, porId[b]!.lat]) as Viajero['ip']
      for (let i = 0; i < 4; i++) viajeros.push({ ip, ph: i / 4 + Math.random() * 0.1, sp: 0.012 + Math.random() * 0.006, hist: [] })
    })
    gRutas.selectAll('path').data(rutas).join('path').attr('class', 'ruta')
    gPeces.selectAll('g').remove()

    dibujarRegistros()
    seleccionado.value = null
    estadoNombre.value = e.binomio
    estadoCoords.value = CIRCUNGLOBAL
    if (animar) svg.transition().duration(reducido ? 0 : 1200).ease(easeCubicInOut).call(zoom.transform as any, zoomIdentity)
  }

  function geoDe(f: Pez, t: number): [number, number] {
    const [rx, ry, incl] = f.s.rango
    const a = f.ph + t * f.sp, tr = incl * Math.PI / 180
    const x = Math.cos(a) * rx * f.w + Math.sin(a * 2.3 + f.j) * 0.25
    const y = Math.sin(a) * ry * f.w + Math.cos(a * 1.7 + f.j) * 0.25
    return [f.s.lon + x * Math.cos(tr) - y * Math.sin(tr), f.s.lat + x * Math.sin(tr) + y * Math.cos(tr)]
  }
  const linea = (pts: [number, number][]) => 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L')

  // rótulo de cada sitio en un recuadro; el ancho sale del texto (IBM Plex Mono: 0,6 em por carácter)
  function rotular(el: SVGGElement, id: string, texto: string) {
    if (etiquetas.get(id) === texto) return
    etiquetas.set(id, texto)
    const g = select(el)
    g.select('text').text(texto)
    g.select('rect').attr('width', texto ? texto.length * 5.4 + 10 : 0).style('display', texto ? null : 'none')
  }

  /* ───────── Cuadro a cuadro ───────── */
  let visible = true
  const vista = new IntersectionObserver(([en]) => { visible = !!en?.isIntersecting })
  vista.observe(caja)
  let antes = performance.now(), tSim = 0, raf = 0
  function cuadro(ahora: number) {
    raf = requestAnimationFrame(cuadro)
    const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora
    if (!visible) return
    if (migrar.value) tSim += dt

    // rutas como rastro de puntos que fluye
    gRutas.selectAll<SVGPathElement, [string, string]>('path').attr('d', ([a, b]) => {
      const ip = geoInterpolate([porId[a]!.lon, porId[a]!.lat], [porId[b]!.lon, porId[b]!.lat])
      const pts: [number, number][] = []
      for (let u = 0; u <= 1.0001; u += 0.05) pts.push(pantalla(...(ip(u) as [number, number])))
      return linea(pts)
    }).style('stroke-dashoffset', reducido ? null : String(-tSim * 6))

    // estelas en lon/lat que se proyectan en cada cuadro: el zoom nunca las deforma
    const todos: { hist: [number, number][] }[] = []
    peces.forEach((f) => { f.hist.push(geoDe(f, tSim)); if (f.hist.length > 10) f.hist.shift(); todos.push(f) })
    viajeros.forEach((v) => {
      let u = (v.ph + tSim * v.sp) % 2; u = u > 1 ? 2 - u : u; u = u * u * (3 - 2 * u)
      v.hist.push(v.ip(u)); if (v.hist.length > 14) v.hist.shift(); todos.push(v)
    })
    const r = Math.min(3.2, 1.4 + T.k * 0.12)
    gPeces.selectAll<SVGGElement, { hist: [number, number][] }>('g').data(todos).join((en: any) => {
      const g = en.append('g')
      g.append('path').attr('class', 'estela')
      g.append('circle').attr('class', 'pez')
      return g
    }).each(function (d) {
      const pts = d.hist.map(q => pantalla(q[0], q[1]))
      const [x, y] = pts[pts.length - 1]!
      const estela = this.firstChild as SVGPathElement, pez = this.lastChild as SVGCircleElement
      estela.setAttribute('d', pts.length > 1 ? linea(pts) : '')
      estela.setAttribute('stroke-width', String(r * 0.9))
      pez.setAttribute('cx', String(x)); pez.setAttribute('cy', String(y)); pez.setAttribute('r', String(r))
    })

    const sel = seleccionado.value ? porId[seleccionado.value] : null
    const anilloOn = !!sel && T.k >= 3
    marcas.attr('transform', (d: Sitio) => `translate(${pantalla(d.lon, d.lat)})`)
      .classed('on', (d: Sitio) => d.id === sel?.id)
      .each(function (this: SVGGElement, d: Sitio) {
        const texto = anilloOn && d.id === sel!.id ? '' : (T.k >= 2.2 || d.id === sel?.id ? d.nombre.toUpperCase() : '')
        rotular(this.querySelector('.tag') as SVGGElement, d.id, texto)
      })

    if (anilloOn) {
      const [x, y] = pantalla(sel!.lon, sel!.lat)
      gAnillo.style('display', null).attr('transform', `translate(${x},${y})`)
      aCoords.text(coords(sel!))
      aNombre.text(sel!.nombre)
      // el rótulo "Agregación" va a la izquierda del anillo; si no cabe, a la derecha; en pantallas angostas, debajo
      const lado = x - 196 >= 8 ? [-196, -2] : x + 230 <= W ? [76, -2] : [-48, 90]
      aRotulo.attr('transform', `translate(${lado[0]},${lado[1]})`)
      aNombre.attr('x', lado[0] + 26).attr('y', lado[1] + 18)
      // recuadro: la caja del área ilustrativa del sitio, con margen
      const [rx, ry] = sel!.rango
      const esquinas = [pantalla(sel!.lon - rx * 1.25, sel!.lat + ry * 1.25), pantalla(sel!.lon + rx * 1.25, sel!.lat - ry * 1.25)]
      const x0 = Math.min(esquinas[0]![0], esquinas[1]![0]), y0 = Math.min(esquinas[0]![1], esquinas[1]![1])
      const x1 = Math.max(esquinas[0]![0], esquinas[1]![0]), y1 = Math.max(esquinas[0]![1], esquinas[1]![1])
      // solo si la zona es más grande que el anillo; si no, el recuadro estorba
      gMarco.style('display', x1 - x0 > 150 ? null : 'none')
      marcoRect.attr('x', x0).attr('y', y0).attr('width', x1 - x0).attr('height', y1 - y0)
      marcoTag.attr('transform', `translate(${x0},${y0 - 4})`)
      const n = String(sitios.indexOf(sel!) + 1).padStart(2, '0')
      const tagTexto = `ZONA ${n} · ${sel!.pais.toUpperCase()}`
      if (marcoTagTexto.text() !== tagTexto) {
        marcoTagTexto.text(tagTexto)
        marcoTagFondo.attr('width', tagTexto.length * 5.4 + 10)
      }
    } else {
      gAnillo.style('display', 'none')
      gMarco.style('display', 'none')
    }
  }

  function enfocar(id: string) {
    const s = porId[id]
    if (!s) return
    seleccionado.value = id
    estadoNombre.value = s.nombre
    estadoCoords.value = coords(s)
    const [x, y] = proy([s.lon, s.lat])!
    const k = Math.min(18, Math.max(10, W / 90))
    svg.transition().duration(reducido ? 0 : 1600).ease(easeCubicInOut)
      .call(zoom.transform as any, zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-x, -y))
  }
  function verTodo() {
    const e = ATLAS[props.especie]!
    seleccionado.value = null
    estadoNombre.value = e.binomio
    estadoCoords.value = CIRCUNGLOBAL
    svg.transition().duration(reducido ? 0 : 1200).ease(easeCubicInOut).call(zoom.transform as any, zoomIdentity)
  }
  // desde la lista: en móvil la lista va debajo del mapa, así que se sube hasta él para ver el acercamiento
  acciones.enfocar = (id: string) => {
    const r = caja.getBoundingClientRect()
    if (r.top < 0 || r.bottom > window.innerHeight) caja.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'center' })
    enfocar(id)
  }
  acciones.verTodo = verTodo

  const paraEspecie = watch(() => props.especie, id => ponerEspecie(id, true))

  ponerEspecie(props.especie, false)
  dibujarMundo()
  cargarTierra('50m')
    .then(() => { aviso.value = '' })
    .catch(() => { aviso.value = 'No se pudo cargar el mapa. Revisa tu conexión y recarga la página.' })

  const alRedimensionar = () => {
    dibujarMundo()
    svg.call(zoom.transform as any, zoomIdentity)
    seleccionado.value = null
  }
  let espera = 0
  const tamano = new ResizeObserver(() => { clearTimeout(espera); espera = window.setTimeout(alRedimensionar, 120) })
  tamano.observe(caja)
  raf = requestAnimationFrame(cuadro)

  limpiar = () => {
    cancelAnimationFrame(raf)
    clearTimeout(espera)
    tamano.disconnect(); vista.disconnect()
    paraEspecie()
    svg.interrupt().on('.zoom', null)
  }
})

onBeforeUnmount(() => limpiar())
</script>
