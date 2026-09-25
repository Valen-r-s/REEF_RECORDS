/* REEF Records · Estado del scroll compartido entre capas (window.REEF en la versión vanilla).
   prof: 0 en la superficie → 1 en el fondo (sección 2)
   forma: 0 = nieve marina dispersa → 1 = tiburón formado
   aparece: opacidad de la capa del tiburón
   Objeto plano a propósito: las capas lo leen en cada cuadro, sin reactividad de Vue. */
export interface EstadoReef {
  prof: number
  forma: number
  aparece: number
  scroll: number
  entrar: () => void
  volver: () => void
}

const reef: EstadoReef = {
  prof: 0, forma: 0, aparece: 0, scroll: 0,
  entrar: () => {}, volver: () => {}
}

export function useReef(): EstadoReef {
  return reef
}
