/* REEF Records · Causas: proyectos sin ánimo de lucro.
   Las fotos de los proyectos son de referencia (Unsplash) hasta que haya fotos propias: cada una lleva su
   crédito y la etiqueta "Imagen de referencia". Las de eventos son de REEF (carpeta Comunidad). */

export interface Foto {
  /** /assets/causas/<archivo>-800.webp y -1600.webp */
  archivo: string
  ancho: number
  alto: number
  alt: string
  /** object-position al recortarla, si el centro no es lo importante */
  encuadre?: string
  /** autor en Unsplash; sin autor, la foto es de REEF */
  autor?: { nombre: string, usuario: string }
}

export interface Proyecto {
  id: string
  numero: string
  /** nombre corto, para la lista numerada */
  corto: string
  titulo: string
  texto: string
  pasos: [string, string, string]
  /** la frase que deja pensando */
  conciencia: string
  foto: Foto
  detalle: Foto
}

const unsplash = (nombre: string, usuario: string) => ({ nombre, usuario })

export const FOTOS = {
  charla: { archivo: 'charla', ancho: 1600, alto: 1067, alt: 'Una facilitadora con micrófono conversa con un grupo de estudiantes de primaria en un salón', autor: unsplash('Amonwat Dumkrut', 'amonwatdumkrut') },
  cascaras: { archivo: 'cascaras', ancho: 1600, alto: 2400, encuadre: '50% 55%', alt: 'Una mano sostiene una bolsa llena de cáscaras de naranja contra el cielo', autor: unsplash('Salah Ait Mokhtar', 'motosha') },
  empaques: { archivo: 'empaques', ancho: 1600, alto: 1067, alt: 'Manos que sostienen una caja y dos recipientes de empaque compostable', autor: unsplash('Agenlaku Indonesia', 'agenlaku') },
  impresoras: { archivo: 'impresoras', ancho: 1600, alto: 1065, alt: 'Una fila de impresoras 3D imprimiendo piezas de plástico azul', autor: unsplash('Minku Kang', 'minkus') },
  plastico: { archivo: 'plastico', ancho: 1600, alto: 1200, alt: 'Peces pequeños nadan entre residuos plásticos que flotan en el mar', autor: unsplash('Naja Bertolt Jensen', 'naja_bertolt_jensen') },
  mantas: { archivo: 'mantas', ancho: 1600, alto: 1067, alt: 'Varias mantarrayas gigantes nadan junto a buzos en aguas azules', autor: unsplash('Sebastian Pena Lambarri', 'sebaspenalambarri') },
  manta: { archivo: 'manta', ancho: 1600, alto: 2089, alt: 'Una mantarraya gigante vista desde abajo, en agua azul', autor: unsplash('naushad mohamed', 'divenau') },
  pista: { archivo: 'evento-pista', ancho: 1600, alto: 1067, alt: 'La pista llena en un evento de REEF Records, bajo bolas de espejos' },
  terraza: { archivo: 'evento-terraza', ancho: 1600, alto: 1067, alt: 'Una terraza llena de gente al atardecer en un evento de REEF Records' },
  multitud: { archivo: 'evento-multitud', ancho: 1600, alto: 1067, alt: 'El público de un evento de REEF Records visto desde atrás' },
  barra: { archivo: 'evento-barra', ancho: 1600, alto: 2400, alt: 'El público frente a la barra en un evento de REEF Records' },
  local: { archivo: 'evento-local', ancho: 1600, alto: 2400, alt: 'El local de un evento de REEF Records lleno de gente' }
} satisfies Record<string, Foto>

export const PROYECTOS: Proyecto[] = [
  {
    id: 'colegios',
    numero: '01',
    corto: 'Educación en colegios',
    titulo: 'Llevamos el océano al salón de clase',
    texto: 'Vamos a colegios a dar charlas y actividades interactivas sobre lo que está pasando en los océanos y sobre las especies en vía de extinción, como la mantarraya gigante y el tiburón martillo.',
    pasos: ['Charla: qué está pasando en los océanos', 'Las especies en vía de extinción, de cerca', 'Actividades interactivas con los estudiantes'],
    conciencia: 'Lo que no se conoce no se cuida.',
    foto: FOTOS.charla,
    detalle: FOTOS.mantas
  },
  {
    id: 'residuos',
    numero: '02',
    corto: 'Residuos orgánicos',
    titulo: 'De cáscara de fruta a empaque',
    texto: 'Tomamos residuos orgánicos de fruta y, con glicerina, los transformamos en paquetes biodegradables: un empaque que vuelve a la tierra en lugar de llegar al mar.',
    pasos: ['Recogemos las cáscaras y restos de fruta', 'Los transformamos con glicerina', 'Se convierten en paquetes biodegradables'],
    conciencia: 'Un residuo es un material que todavía no encontró su forma.',
    foto: FOTOS.cascaras,
    detalle: FOTOS.empaques
  },
  {
    id: 'botellas',
    numero: '03',
    corto: 'Botellas a impresión 3D',
    titulo: 'Las botellas de la fiesta vuelven como objetos',
    texto: 'Recogemos las botellas de los eventos del colectivo y las transformamos en material para impresión 3D. Lo que imprimimos lo regalamos en actividades y lo vendemos en eventos y en esta página.',
    pasos: ['Recogemos las botellas en cada evento', 'Las transformamos en filamento para impresión 3D', 'Imprimimos piezas para regalar y vender'],
    conciencia: 'La basura no desaparece: cambia de lugar. Casi siempre, al mar.',
    foto: FOTOS.pista,
    detalle: FOTOS.impresoras
  }
]

/** Cifras con su fuente, para que la frase pese */
export const DATOS = [
  { cifra: '37 %', texto: 'de las especies de tiburones y rayas está amenazado de extinción', fuente: 'UICN, 2021' },
  { cifra: '11 M t', texto: 'de plástico llegan al océano cada año', fuente: 'Pew Charitable Trusts, 2020' },
  { cifra: '9 %', texto: 'de los residuos plásticos del mundo se recicla', fuente: 'OCDE, 2022' },
  { cifra: '1/3', texto: 'de los alimentos que se producen se pierde o se desperdicia', fuente: 'FAO' }
]

export const CREDITOS = Object.values(FOTOS)
  .filter((f): f is Foto & { autor: { nombre: string, usuario: string } } => 'autor' in f && !!f.autor)
  .map(f => f.autor)
  .filter((a, i, todos) => todos.findIndex(b => b.usuario === a.usuario) === i)
