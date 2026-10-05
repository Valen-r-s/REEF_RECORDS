/* REEF Records · Merch: edición 01, Mobula birostris.
   No hay bolsa ni pasarela: cada pedido abre un chat de WhatsApp con el producto y la talla ya escritos
   (el número está en data/contacto.ts). */

export type Genero = 'hombre' | 'mujer'

export const TALLAS = ['S', 'M', 'L', 'XL'] as const
export type Talla = typeof TALLAS[number]

export interface Producto {
  codigo: string
  nombre: string
  /** color · corte */
  detalle: string
  genero: Genero
  /** /assets/merch/<foto>-400.webp y -800.webp, recorte 4:5 */
  foto: string
  alt: string
  /** en pesos colombianos; sin precio no se muestra */
  precio?: number
}

export const PRODUCTOS: Producto[] = [
  {
    codigo: 'MB-01', nombre: 'Mobula Tee', detalle: 'Blanco óptico · oversize', genero: 'hombre', foto: 'mb-01',
    alt: 'Camiseta blanca oversize, espalda: dos mantas en semitono, el nombre de la especie en caligrafía y el kanji 海 en contorno'
  },
  {
    codigo: 'MB-02', nombre: 'Mobula Tee', detalle: 'Negro · tinta blanca y azul', genero: 'hombre', foto: 'mb-02',
    alt: 'Camiseta negra oversize, espalda: dos mantas en blanco, un bloque azul pixelado y el kanji 水'
  },
  {
    codigo: 'MB-03', nombre: 'Mobula Baby Tee', detalle: 'Blanco · corte baby tee', genero: 'mujer', foto: 'mb-03',
    alt: 'Baby tee blanca, frente: dos mantas en semitono, el nombre de la especie en caligrafía y el kanji 水'
  }
]

/** Foto de la portada por corte. Cajas en píxeles de la imagen: la camiseta entera y su estampado,
 *  que es lo único que se ve nítido a través del vidrio. */
export interface FotoPortada {
  src: string
  srcset: string
  ancho: number
  alto: number
  camiseta: { x: number, y: number, w: number, h: number }
  estampado: { x: number, y: number, w: number, h: number }
  rotulo: string
  alt: string
}

export const PORTADA: Record<Genero, FotoPortada> = {
  hombre: {
    src: '/assets/merch/blanca-1600.webp',
    srcset: '/assets/merch/blanca-800.webp 800w, /assets/merch/blanca-1600.webp 1600w',
    ancho: 1600, alto: 2000,
    camiseta: { x: 295, y: 487, w: 975, h: 1301 },
    estampado: { x: 500, y: 701, w: 669, h: 789 },
    rotulo: 'Corte hombre · oversize',
    alt: PRODUCTOS[0]!.alt
  },
  mujer: {
    src: '/assets/merch/mujer-1080.webp',
    srcset: '/assets/merch/mujer-540.webp 540w, /assets/merch/mujer-1080.webp 1080w',
    ancho: 1080, alto: 1080,
    camiseta: { x: 110, y: 110, w: 860, h: 877 },
    estampado: { x: 372, y: 314, w: 348, h: 485 },
    rotulo: 'Corte mujer · baby tee',
    alt: PRODUCTOS[2]!.alt
  }
}

export function mensajePedido(p: Producto, talla: Talla) {
  return `Hola, REEF. Quiero pedir la ${p.nombre} (${p.codigo}) · ${p.detalle}, talla ${talla}.`
}

const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
export const formatoPrecio = (n: number) => pesos.format(n)
