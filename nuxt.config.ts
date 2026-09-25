// REEF Records: exportación estática (nuxi generate) de las tres páginas.
// Pila decidida el 2026-09-16: Nuxt + three.js directo + GSAP ScrollTrigger + Lenis.
export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2026-09-25',
  devtools: { enabled: false },
  telemetry: false,
  app: {
    baseURL: '/',
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'REEF Records',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
      ]
    }
  },
  // Las hojas de estilo de cada página van enlazadas (como en la versión vanilla), no copiadas en el
  // HTML: con inlineStyles el cliente volvía a descargar la misma hoja al cargar la página.
  features: { inlineStyles: false },
  nitro: { prerender: { crawlLinks: false, routes: ['/', '/musica', '/ciencia'] } },
  vite: { build: { target: 'es2022' } }
})
