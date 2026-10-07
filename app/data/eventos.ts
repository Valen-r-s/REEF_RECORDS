/* REEF Records · Próximos eventos (/musica/eventos).
   De ejemplo: lugares, fechas y horas son inventados para mostrar el diseño; hay que reemplazarlos por los reales. */

export interface Evento {
  id: string
  numero: string
  nombre: string
  serie: string
  dia: string
  /** día del mes y mes abreviado, para el bloque de la fecha */
  fecha: [string, string]
  hora: string
  lugar: string
  barrio: string
  /** slugs de ARTISTAS, en el orden del cartel */
  artistas: string[]
  /** sticker decorativo pegado sobre el boleto (public/assets/objetos), con su tamaño en px */
  sticker: { src: string, ancho: number, alto: number }
  /** color del papel del boleto, de la escala del azul REEF */
  papel: 'azul' | 'claro' | 'medio'
}

export const EVENTOS: Evento[] = [
  {
    id: 'marea-alta', numero: '01', nombre: 'Marea Alta', serie: 'REEF Sessions 006',
    dia: 'Viernes', fecha: ['23', 'Oct'], hora: '9:00 PM — 3:00 AM',
    lugar: 'Terraza Coral', barrio: 'Chapinero, Bogotá',
    artistas: ['cirratum', 'warv', 'kesr'],
    sticker: { src: '/assets/objetos/causas-mantarraya.webp', ancho: 1254, alto: 1254 },
    papel: 'azul'
  },
  {
    id: 'noche-martillo', numero: '02', nombre: 'Noche Martillo', serie: 'Hard groove · Speed house',
    dia: 'Sábado', fecha: ['14', 'Nov'], hora: '10:00 PM — 4:00 AM',
    lugar: 'Bodega Abisal', barrio: 'Teusaquillo, Bogotá',
    artistas: ['f3dr', 'caotical-disordah'],
    sticker: { src: '/assets/objetos/ciencia-especies.webp', ancho: 1305, alto: 1206 },
    papel: 'claro'
  },
  {
    id: 'arrecife-open-air', numero: '03', nombre: 'Arrecife Open Air', serie: 'Cierre de temporada',
    dia: 'Sábado', fecha: ['05', 'Dic'], hora: '3:00 PM — 1:00 AM',
    lugar: 'Finca La Reserva', barrio: 'La Calera',
    artistas: ['esallen', 'cirratum', 'f3dr'],
    sticker: { src: '/assets/objetos/musica-vinilo.webp', ancho: 1254, alto: 1254 },
    papel: 'medio'
  }
]
