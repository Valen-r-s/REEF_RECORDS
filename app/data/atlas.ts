/* REEF Records · Ciencia: datos del atlas por especie
   Sitios con presencia documentada (agregaciones), rutas ilustrativas entre ellos y el texto de cada especie.
   rango = [radio en longitud °, radio en latitud °, inclinación °] del área ilustrativa donde se mueven los
   individuos del mapa. Los movimientos son ilustrativos, no datos de rastreo satelital.
   La categoría UICN debe coincidir con la que imprime `npm run gbif` (hoy: manta EN, martillo CR). */

export interface Sitio {
  id: string
  nombre: string
  pais: string
  lon: number
  lat: number
  rango: [number, number, number]
  nota: string
}

export interface EspecieAtlas {
  titulo: string
  binomio: string
  autor: string
  /** Texto de la barra de ubicación cuando no hay un sitio elegido */
  ubicacion: string
  habitat: string
  uicn: { codigo: 'EN' | 'CR', texto: string, url: string }
  sitios: Sitio[]
  rutas: [string, string][]
}

export const ATLAS: Record<string, EspecieAtlas> = {
  manta: {
    titulo: 'Dónde encontrar a la manta gigante',
    binomio: 'Mobula birostris',
    autor: '(Walbaum, 1792)',
    ubicacion: 'Océanos tropicales y templados',
    habitat: 'Aguas tropicales, subtropicales y templadas de todos los océanos, casi siempre en mar abierto y cerca de montes submarinos.',
    uicn: { codigo: 'EN', texto: 'En peligro', url: 'https://www.iucnredlist.org/species/198921/214397182' },
    sitios: [
      { id: 'revilla', nombre: 'Archipiélago de Revillagigedo', pais: 'México', lon: -111.0, lat: 18.8, rango: [3.84, 2.08, -15],
        nota: 'Parque Nacional. Las mantas visitan los montes submarinos de San Benedicto, Socorro y Roca Partida.' },
      { id: 'malpelo', nombre: 'Isla Malpelo', pais: 'Colombia', lon: -81.61, lat: 4.0, rango: [2.4, 2.4, 0],
        nota: 'Santuario de Fauna y Flora en mar abierto, Patrimonio Mundial de la UNESCO.' },
      { id: 'galapagos', nombre: 'Islas Galápagos', pais: 'Ecuador', lon: -90.5, lat: -0.6, rango: [3.52, 2.56, 10],
        nota: 'Reserva Marina. Registros en aguas abiertas alrededor del archipiélago.' },
      { id: 'plata', nombre: 'Isla de la Plata', pais: 'Ecuador', lon: -81.07, lat: -1.27, rango: [2.08, 4.16, 18],
        nota: 'Parque Nacional Machalilla. Alberga la mayor población conocida de manta gigante.' },
      { id: 'tofo', nombre: 'Praia do Tofo', pais: 'Mozambique', lon: 35.55, lat: -23.85, rango: [1.76, 3.84, -25],
        nota: 'Costa de Inhambane, uno de los sitios con más estudios de mantas en África.' },
      { id: 'similan', nombre: 'Islas Similan', pais: 'Tailandia', lon: 97.64, lat: 8.65, rango: [2.08, 3.52, 10],
        nota: 'Mar de Andamán. Avistamientos en pináculos como Koh Bon y Koh Tachai.' },
      { id: 'raja', nombre: 'Raja Ampat', pais: 'Indonesia', lon: 130.5, lat: -0.6, rango: [3.52, 2.08, 0],
        nota: 'Triángulo de Coral, una de las zonas con mayor biodiversidad marina del planeta.' }
    ],
    rutas: [['malpelo', 'plata'], ['galapagos', 'plata'], ['revilla', 'galapagos']]
  },
  martillo: {
    titulo: 'Dónde encontrar al tiburón martillo',
    binomio: 'Sphyrna lewini',
    autor: '(Griffith & Smith, 1834)',
    ubicacion: 'Costas tropicales y templado-cálidas',
    habitat: 'Aguas costeras y oceánicas tropicales y templado-cálidas de todos los océanos. Los adultos se reúnen alrededor de islas y montes submarinos; las crías crecen en bahías y manglares que funcionan como criaderos.',
    uicn: { codigo: 'CR', texto: 'En peligro crítico', url: 'https://www.iucnredlist.org/species/39385/2918526' },
    sitios: [
      { id: 'malpelo', nombre: 'Isla Malpelo', pais: 'Colombia', lon: -81.61, lat: 4.0, rango: [2.2, 2.2, 0],
        nota: 'Santuario de Fauna y Flora, Patrimonio Mundial de la UNESCO. Uno de los pocos lugares con cardúmenes de cientos de martillos.' },
      { id: 'coco', nombre: 'Isla del Coco', pais: 'Costa Rica', lon: -87.06, lat: 5.53, rango: [2.4, 2.0, 10],
        nota: 'Parque Nacional y Patrimonio Mundial. Los martillos se reúnen en estaciones de limpieza como Bajo Alcyone.' },
      { id: 'darwin', nombre: 'Islas Darwin y Wolf', pais: 'Ecuador', lon: -91.9, lat: 1.53, rango: [2.6, 2.0, -10],
        nota: 'Norte de la Reserva Marina de Galápagos, con una de las mayores concentraciones de tiburones registradas en el mundo.' },
      { id: 'golfodulce', nombre: 'Golfo Dulce', pais: 'Costa Rica', lon: -83.25, lat: 8.55, rango: [1.2, 1.6, -30],
        nota: 'Criadero: las crías nacen y crecen en sus aguas someras, protegidas por manglares.' },
      { id: 'kaneohe', nombre: 'Bahía de Kāneʻohe', pais: 'Hawái, EE. UU.', lon: -157.8, lat: 21.46, rango: [1.2, 1.0, 0],
        nota: 'Bahía de Oʻahu que funciona como criadero: las hembras paren ahí entre la primavera y el verano.' },
      { id: 'dedalo', nombre: 'Arrecife Dédalo', pais: 'Egipto', lon: 35.87, lat: 24.93, rango: [1.6, 2.2, -30],
        nota: 'Arrecife aislado en mar abierto del Mar Rojo, conocido por los martillos que se acercan a sus paredes.' },
      { id: 'protea', nombre: 'Protea Banks', pais: 'Sudáfrica', lon: 30.48, lat: -30.83, rango: [1.6, 2.4, -35],
        nota: 'Arrecife frente a KwaZulu-Natal donde se reúnen grupos de martillos durante el verano austral.' }
    ],
    rutas: [['malpelo', 'coco'], ['coco', 'darwin'], ['golfodulce', 'coco']]
  }
}
