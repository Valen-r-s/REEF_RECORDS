// REEF Records · Datos de GBIF para Ciencia. Se corre a mano (npm run gbif), nunca en el build ni en el navegador.
// Escribe app/data/gbif-especies.json (lo que usa el mapa) y public/datos/gbif-fuentes.json (los datasets a citar).
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoContains } from 'd3-geo'
import { feature } from 'topojson-client'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATOS = resolve(RAIZ, 'app/data/gbif-especies.json')
const FUENTES = resolve(RAIZ, 'public/datos/gbif-fuentes.json')

// Las claves son las del selector de Ciencia (data-especie)
const ESPECIES = {
  manta: 'Mobula birostris',
  martillo: 'Sphyrna lewini'
}
// Solo licencias que permiten uso comercial: la UICN negó su API a este sitio por comercial (2026-09-25),
// así que los registros CC BY-NC quedan fuera.
const LICENCIAS = ['CC0_1_0', 'CC_BY_4_0']
// Datasets fuera por calidad, con la razón. Revisar la lista cuando cambien las especies.
const EXCLUIDOS = {
  // base de pesquerías de atún (IRD): para estas especies sus coordenadas caen en Austria, Chequia,
  // Alemania, Islas Feroe y Groenlandia, fuera de todo rango conocido (revisado 2026-09-25)
  '0e3d6f05-a287-4ffd-852d-4e17db22d810': 'ecoscope_observation_database: coordenadas fuera de rango y tierra adentro'
}
// La misma tierra que dibuja el mapa. Un registro a más de ~25 km de la costa hacia adentro es un
// error de georreferencia (dirección de un museo, centroide de un país), no un avistamiento.
const TIERRA_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json'
const MARGEN = 0.25
const API = 'https://api.gbif.org/v1'
const PAGINA = 300
const esperar = ms => new Promise(r => setTimeout(r, ms))

async function pedir(url, intentos = 4) {
  for (let i = 0; ; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': 'reef-records-build (sitio estático)' } })
    if (r.ok) return r.json()
    if (i >= intentos || (r.status < 500 && r.status !== 429)) throw new Error(`${r.status} ${url}`)
    await esperar(1000 * 2 ** i)
  }
}

// occurrenceStatus=PRESENT es obligatorio: la mayoría de registros de estas especies en GBIF son
// ABSENT (puntos de muestreo donde el animal NO apareció). Sin este filtro el mapa pinta ausencias.
function filtros(clave) {
  const p = new URLSearchParams({ taxonKey: clave, hasCoordinate: 'true', hasGeospatialIssue: 'false', occurrenceStatus: 'PRESENT' })
  for (const l of LICENCIAS) p.append('license', l)
  return p
}

async function especie(nombre) {
  const m = await pedir(`${API}/species/match?name=${encodeURIComponent(nombre)}`)
  if (m.matchType !== 'EXACT') throw new Error(`GBIF: coincidencia ${m.matchType} para ${nombre}`)
  const iucn = await pedir(`${API}/species/${m.usageKey}/iucnRedListCategory`)

  const registros = []   // [lat, lon, datasetKey, país]
  for (let offset = 0; ; offset += PAGINA) {
    const p = filtros(m.usageKey)
    p.set('limit', PAGINA); p.set('offset', offset)
    const d = await pedir(`${API}/occurrence/search?${p}`)
    for (const o of d.results) {
      if (typeof o.decimalLatitude !== 'number' || typeof o.decimalLongitude !== 'number') continue
      registros.push([o.decimalLatitude, o.decimalLongitude, o.datasetKey, o.countryCode])
    }
    if (d.endOfRecords || !d.results.length) break
    await esperar(150)
  }
  return { nombre, gbifKey: m.usageKey, iucn, registros }
}

// Celdas de 1°: posición media de los registros de cada celda (así las de costa quedan sobre el mar)
function agrupar(registros) {
  const celdas = new Map()
  for (const [la, lo] of registros) {
    const k = `${Math.floor(la)},${Math.floor(lo)}`
    const c = celdas.get(k) || [0, 0, 0]
    c[0] += la; c[1] += lo; c[2]++
    celdas.set(k, c)
  }
  return [...celdas.values()].map(([a, b, n]) => [+(a / n).toFixed(2), +(b / n).toFixed(2), n])
}

// Títulos y licencias de los datasets, de a pocos a la vez
async function titulos(claves) {
  const salida = new Map()
  const cola = [...claves]
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (cola.length) {
      const k = cola.shift()
      const d = await pedir(`${API}/dataset/${k}`)
      salida.set(k, { titulo: d.title, licencia: d.license })
    }
  }))
  return salida
}

const generado = new Date().toISOString()
const crudo = {}
for (const [id, nombre] of Object.entries(ESPECIES)) crudo[id] = await especie(nombre)

// Un dataset con licencia no comercial queda fuera entero, aunque sus registros digan otra cosa
// (iNaturalist, por ejemplo, declara CC BY-NC para el dataset y la licencia de cada foto por registro).
const info = await titulos(new Set(Object.values(crudo).flatMap(e => e.registros.map(r => r[2]))))
const abierto = k => !/by-nc/i.test(info.get(k)?.licencia || '')

const topo = await pedir(TIERRA_URL)
const tierra = feature(topo, topo.objects.land)
const cacheTierra = new Map()
function tierraAdentro(la, lo) {
  const k = `${la.toFixed(2)},${lo.toFixed(2)}`
  if (!cacheTierra.has(k)) {
    cacheTierra.set(k, [[0, 0], [MARGEN, 0], [-MARGEN, 0], [0, MARGEN], [0, -MARGEN]]
      .every(([a, b]) => geoContains(tierra, [lo + b, la + a])))
  }
  return cacheTierra.get(k)
}
function motivo([la, lo, key]) {
  if (!abierto(key)) return 'licencia'
  if (EXCLUIDOS[key]) return 'dataset'
  if (tierraAdentro(la, lo)) return 'tierra'
  return null
}

const datos = { generado, especies: {} }
const fuentes = {
  generado,
  cita: 'GBIF.org, registros de presencia con coordenadas, licencia CC0 1.0 o CC BY 4.0 por registro y por dataset, sin registros tierra adentro ni de los datasets excluidos. Categoría de la Lista Roja de la UICN vía GBIF (dataset 19491596-35ae-4a91-9a98-85cf505f1bd3, CC BY 4.0).',
  licencias: LICENCIAS,
  excluidos: EXCLUIDOS,
  especies: {}
}
for (const [id, e] of Object.entries(crudo)) {
  const fuera = { licencia: 0, dataset: 0, tierra: 0 }
  const usados = e.registros.filter(r => {
    const m = motivo(r)
    if (m) fuera[m]++
    return !m
  })
  const porDataset = new Map()
  for (const r of usados) porDataset.set(r[2], (porDataset.get(r[2]) || 0) + 1)
  datos.especies[id] = {
    nombre: e.nombre,
    gbifKey: e.gbifKey,
    iucn: { codigo: e.iucn.code, categoria: e.iucn.category, taxonId: e.iucn.iucnTaxonID },
    registros: usados.length,
    registrosColombia: usados.filter(r => r[3] === 'CO').length,
    celdas: agrupar(usados)
  }
  fuentes.especies[id] = {
    nombre: e.nombre,
    gbifKey: e.gbifKey,
    fuera,
    datasets: [...porDataset].sort((a, b) => b[1] - a[1])
      .map(([key, registros]) => ({ key, registros, ...info.get(key), url: `https://www.gbif.org/dataset/${key}` }))
  }
  const d = datos.especies[id]
  console.log(`${id}: ${d.iucn.codigo} · ${d.registros} registros · fuera: ${fuera.licencia} licencia, ${fuera.dataset} dataset, ${fuera.tierra} tierra adentro · ${d.celdas.length} celdas · ${d.registrosColombia} en Colombia · ${porDataset.size} datasets`)
}

await mkdir(dirname(FUENTES), { recursive: true })
await writeFile(DATOS, JSON.stringify(datos) + '\n')
await writeFile(FUENTES, JSON.stringify(fuentes, null, 1) + '\n')
console.log(`→ ${DATOS}\n→ ${FUENTES}`)
