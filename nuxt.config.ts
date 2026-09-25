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
  nitro: { prerender: { crawlLinks: false, routes: ['/', '/musica', '/ciencia'] } },
  vite: { build: { target: 'es2022' } }
})
