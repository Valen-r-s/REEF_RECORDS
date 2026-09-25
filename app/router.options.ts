import type { RouterConfig } from '@nuxt/schema'

// Enlaces entre páginas son cargas completas, como en la versión vanilla.
// Inicio: la navegación del descenso decide el scroll (hero anclado, #causa entra directo).
// Música y Ciencia: se restaura la posición al recargar, como lo hace el navegador.
export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (to.path === '/') return false
    return savedPosition ?? false
  }
}
