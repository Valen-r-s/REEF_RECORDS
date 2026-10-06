/* REEF Records · Artistas: cada uno tiene su página en /musica/<slug> con 5 tarjetas en un anillo 3D.
   Los textos son genéricos por ahora; los géneros son los del colectivo hasta saber los de cada uno.
   Un enlace vacío ('') se muestra deshabilitado ("Pronto"). Sin importaciones de Nuxt: nuxt.config lo lee
   para generar las rutas. */

export interface Artista {
  slug: string
  nombre: string
  ciudad: string
  rol: string
  generos: string[]
  /** foto vertical (la misma de la galería de Música) */
  retrato: string
  /** 3 fotos adicionales para las tarjetas Sobre él, Redes y Por qué hace música; sin ellas se usa el retrato */
  fotos?: string[]
  /** captura horizontal del video set, en /assets/artistas/sets/ */
  set: string
  /** duración del video set, tomada de su miniatura */
  duracion: string
  youtube: string
  soundcloud: string
  instagram: string
  frase: string
  porQueMusica: string
  aQueSeDedica: string
  porQueReef: string
}

const GENEROS = ['Speed house', 'Hard groove', 'Groove', 'Hard trance', 'Neo trance', 'Deep house', 'Tech house']

// Mientras no haya SoundCloud propio, el botón de SoundCloud lleva al mismo video set de YouTube
function artista(slug: string, nombre: string, youtube: string, duracion: string): Artista {
  return {
    slug, nombre, duracion, youtube,
    soundcloud: youtube,
    instagram: '',
    ciudad: 'Bogotá',
    rol: 'DJ · REEF Records',
    generos: GENEROS,
    retrato: `/assets/artistas/${slug}.jpg`,
    set: `/assets/artistas/sets/${slug}.webp`,
    frase: `${nombre} construye sets que empiezan en el groove y terminan en la parte más intensa de la noche.`,
    porQueMusica: 'Hace música porque en la pista todos hablamos el mismo idioma: una sola frecuencia para cientos de personas al mismo tiempo.',
    aQueSeDedica: 'Fuera de la cabina estudia, trabaja y colecciona discos. Cada semana busca música nueva para el próximo set.',
    porQueReef: 'Está en REEF porque la fiesta también puede cuidar el mar: cada evento del colectivo apoya una causa.'
  }
}

export const ARTISTAS: Artista[] = [
  artista('cirratum', 'CIRRATUM', 'https://www.youtube.com/watch?v=oiLV48K_P94', '59:32'),
  artista('f3dr', 'F3DR', 'https://www.youtube.com/watch?v=aXGlpAGXtNg', '1:00:07'),
  artista('warv', 'WARV', 'https://www.youtube.com/watch?v=71eT9Xsvp58', '1:01:08'),
  artista('kesr', 'KESR', 'https://www.youtube.com/watch?v=XSZIqZScx3I', '1:09:54'),
  artista('caotical-disordah', 'CAOTICAL DISORDAH', 'https://www.youtube.com/watch?v=nYMJsId6L8o', '1:01:23'),
  {
    // por ahora usa el mismo video de CIRRATUM
    ...artista('esallen', 'ESALLEN', 'https://www.youtube.com/watch?v=oiLV48K_P94', '59:55'),
    fotos: ['/assets/artistas/esallen3.jpg', '/assets/artistas/esallen2.jpg', '/assets/artistas/esallen4.jpg']
  }
]
