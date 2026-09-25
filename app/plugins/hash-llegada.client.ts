/* REEF Records · Hash de llegada
   Al hidratar una página prerenderizada, el router de Nuxt quita el #hash de la URL y lo devuelve
   después de montar. El descenso necesita saber al montar si se llegó con /#causa (navegacion.js lo
   leía de location.hash al cargar), así que se guarda aquí, antes de que el router lo toque. */
export default defineNuxtPlugin(() => ({
  provide: { hashLlegada: window.location.hash }
}))
