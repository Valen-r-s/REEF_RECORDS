# REEF Records · sitio web

"No somos un producto, somos una causa que se comunica con música."

Tres páginas: **Inicio** (entrada, descenso y la causa), **Música** (artistas) y **Ciencia** (fichas de especies).

## Ramas

| Rama | Qué es |
|---|---|
| `main` | La versión original, en HTML, CSS y JavaScript sin framework. |
| `nuxt-migration` | La misma página, con el mismo diseño y los mismos textos, sobre la pila acordada del proyecto. |

Mientras existan las dos:

- Lo que se haga en `main` se traduce después a `nuxt-migration` (ver [Traducir un cambio de main](#traducir-un-cambio-de-main)).
- Cuando se decida trabajar directamente en `nuxt-migration`, esa rama pasa a ser la principal y `main` queda como historia.

## Pila

- **Nuxt 4**: genera cada página como HTML estático (`nuxi generate`). No hay servidor.
- **three.js**: todas las capas WebGL (mar, tiburón de partículas, nieve marina, mapa, especie en píxeles). Se usa directo, sin librerías encima.
- **GSAP ScrollTrigger + Lenis**: el scroll suave y el descenso de la página de inicio.
- **d3-geo + topojson-client**: la proyección del mapa de distribución.

## Requisitos

- Node.js 24 y npm 11 (probado con Node 24.18.0 y npm 11.16.0).
- Git.

## Correrlo en tu computador

```bash
git clone https://github.com/Valen-r-s/REEF_RECORDS.git
cd REEF_RECORDS
git checkout nuxt-migration
npm ci
npm run dev
```

Abre http://localhost:3000/. Los cambios dentro de `app/` se ven al guardar.

`npm ci` instala exactamente las versiones de `package-lock.json`. Solo hay que repetirlo cuando ese archivo cambie.

## Generar la versión estática

```bash
npm run generate
```

El sitio completo queda en `.output/public`. Para verlo, cualquier servidor estático sirve; por ejemplo, con Python:

```bash
python -m http.server 8080 -d .output/public
```

y abre http://localhost:8080/. Esa carpeta se puede subir tal cual a cualquier hosting estático. Todavía no hay despliegue.

## Estructura

```
app/
  pages/                    una ruta por archivo
    index.vue                 /         entrada, descenso y la causa
    musica.vue                /musica   artistas (slider y grid)
    ciencia.vue               /ciencia  fichas de especies
  components/               una capa visual por componente
    OceanoMar.vue             mar en vista cenital (three.js), en Inicio y Ciencia
    MantasSombras.vue         las dos mantas como sombras (canvas 2D con desenfoque)
    TiburonParticulas.vue     la nieve marina que forma el tiburón zorro (three.js)
    NieveMarina.vue           nieve marina de Ciencia (three.js)
    MapaDistribucion.vue      mapa de hexágonos de Ciencia (three.js)
    EspecieBitmap.vue         la especie en píxeles con tramado (three.js)
    SiteNav.vue               barra de navegación y menú móvil
  composables/
    useReef.ts                estado del scroll que comparten las capas
    useDescenso.ts            Lenis + ScrollTrigger: hero anclado y descenso de Inicio
    useGaleria.ts             motor de la galería de artistas
  data/ciencia-datos.ts     zonas de distribución de cada especie
  utils/gl.ts               ayudas de three.js que usan todas las capas
  plugins/hash-llegada.client.ts   conserva la llegada directa a /#causa
  router.options.ts         posición del scroll al cargar cada página
  assets/css/               las hojas de estilo de la versión original
public/assets/              logo, fotos de artistas y demás archivos que se sirven tal cual
nuxt.config.ts              rutas que se generan, título, idioma
```

## Cómo funciona

**Páginas.** Cada archivo de `app/pages` es una ruta. Al construir, Nuxt genera las rutas que aparecen en `nitro.prerender.routes` de `nuxt.config.ts`. Los enlaces entre páginas son `<a href>` normales: cada página carga completa, igual que en la versión original.

**Capas visuales.** Cada canvas es un componente. Las capas WebGL abren su contexto con `crearRenderer()` y dibujan un triángulo que cubre la pantalla con `pantallaCompleta()`, las dos en `app/utils/gl.ts`. El GLSL original va intacto dentro de un `RawShaderMaterial`, así que three.js no le agrega nada. Cada capa arranca en `onMounted` y se limpia en `onBeforeUnmount`. Si el navegador no tiene WebGL2, la capa no se pinta y la página sigue funcionando.

**Estado compartido.** `useReef()` devuelve un objeto simple que las capas leen en cada cuadro: `prof` (0 en la superficie, 1 en el fondo), `forma` (0 nieve dispersa, 1 tiburón formado), `aparece` y `scroll`. Reemplaza a `window.REEF`.

**Descenso.** En `useDescenso.ts`, Lenis mueve el scroll, ScrollTrigger lee la posición y el ticker de GSAP da el tiempo. El hero queda anclado hasta "Entra al arrecife"; después aparece la barra y ya no se vuelve a subir al hero. Las cuentas del descenso son las originales de `scroll.js`.

**Estilos.** Las hojas de `app/assets/css` son las de la versión original. Cada página importa las suyas en su bloque `<style>`.

## De la versión original a Nuxt

| Original (`main`) | En `nuxt-migration` |
|---|---|
| `index.html` | `app/pages/index.vue` |
| `musica.html` | `app/pages/musica.vue` |
| `ciencia.html` | `app/pages/ciencia.vue` |
| `css/*.css` | `app/assets/css/*.css` |
| `assets/*` | `public/assets/*` |
| `js/oceano.js` | `app/components/OceanoMar.vue` |
| `js/mantas.js` | `app/components/MantasSombras.vue` |
| `js/tiburon.js` | `app/components/TiburonParticulas.vue` |
| `js/nieve.js` | `app/components/NieveMarina.vue` |
| `js/mapa.js` | `app/components/MapaDistribucion.vue` |
| `js/especie.js` | `app/components/EspecieBitmap.vue` |
| `js/scroll.js` + `js/navegacion.js` | `app/composables/useDescenso.ts` |
| `js/menu.js` | `app/components/SiteNav.vue` |
| `js/musica.js` | `app/composables/useGaleria.ts` |
| `js/ciencia.js` | dentro de `app/pages/ciencia.vue` |
| `js/ciencia-datos.js` | `app/data/ciencia-datos.ts` |

## Traducir un cambio de main

1. **HTML**: el marcado va en el `<template>` de la página. Las rutas de archivos pasan de `assets/x.png` a `/assets/x.png`.
2. **CSS**: el mismo archivo en `app/assets/css/`. Una hoja nueva se importa en el `<style>` de la página que la usa.
3. **Un efecto nuevo en JS**: un componente en `app/components/`, con la lógica en `onMounted` y la limpieza (listeners, `requestAnimationFrame`) en `onBeforeUnmount`. Los componentes se usan en las páginas sin importarlos.
4. **WebGL**: `canvas.getContext('webgl')` pasa a `crearRenderer(canvas, atributos)` y el dibujo a `pantallaCompleta(vs, fs, uniforms)`. El shader se copia tal cual, sigue siendo GLSL de WebGL1.
5. **Variables globales**: lo que antes era `window.ALGO` se exporta desde un módulo y se importa donde se use.
6. **Página nueva**: el archivo en `app/pages/` y su ruta en `nitro.prerender.routes`. Si la ruta no está en esa lista, no se genera.
7. **Revisar**: `npm run generate` termina sin errores y las rutas abren sin errores en la consola del navegador.

## Pendientes conocidos

- Requiere WebGL2, porque three.js lo exige. Un navegador que solo tenga WebGL1 ve la página sin las capas animadas.
- El contorno de los continentes del mapa se descarga al abrir Ciencia, desde jsdelivr (`world-atlas`).
- El build avisa que el paquete de three.js pasa de 500 kB. Es un aviso, no un error.
- Mapa de Ciencia: cuando termina de cargar el contorno, la pestaña Mantarraya muestra el mapa del martillo hasta que se cambia de especie. Viene de `js/mapa.js`: `agrupar()` reconstruye las texturas y no las vuelve a enlazar. Se dejó igual para que las dos versiones coincidan; se arregla con una llamada a `enlazar()` al final de `agrupar()`.
- `hero.css`: al bloque `@media (max-width: 640px)` le faltaba la llave de cierre (aquí ya está cerrada, al final del archivo). La regla de movimiento reducido quedó dentro de ese bloque, así que solo aplica en pantallas de 640 px o menos.
- Las zonas de `app/data/ciencia-datos.ts` son ilustrativas. Los datos reales de GBIF llegan después.
