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

Última sincronización: `nuxt-migration` refleja `main` hasta el commit `5877a17` ("Index services").

## Pila

- **Nuxt 4**: genera cada página como HTML estático (`nuxi generate`). No hay servidor.
- **three.js**: todas las capas WebGL (mar, nieve marina, mapa, especie en píxeles). Se usa directo, sin librerías encima.
- **GSAP ScrollTrigger + Lenis**: el scroll suave y el descenso de la página de inicio.
- **d3-geo + topojson-client**: la proyección del mapa de distribución.
- **GBIF** (api.gbif.org, sin llave): los avistamientos reales del mapa de Ciencia. Se descargan con un script aparte, nunca desde el navegador (ver [Datos de GBIF](#datos-de-gbif)).

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
    NieveMarina.vue           nieve marina (three.js); en Inicio aparece al descender (prop descenso)
    CorrienteObjetos.vue      Merch, Música y Causas flotando, unidos por la línea punteada
    MapaDistribucion.vue      mapa de hexágonos de Ciencia (three.js)
    EspecieBitmap.vue         la especie en píxeles con tramado (three.js)
    SiteNav.vue               barra de navegación y menú móvil
  composables/
    useReef.ts                estado del scroll que comparten las capas
    useDescenso.ts            Lenis + ScrollTrigger: hero anclado y descenso de Inicio
    useGaleria.ts             motor de la galería de artistas
  data/gbif-especies.json   avistamientos de GBIF por especie (lo genera npm run gbif)
  utils/gl.ts               ayudas de three.js que usan todas las capas
  plugins/hash-llegada.client.ts   conserva la llegada directa a /#causa
  router.options.ts         posición del scroll al cargar cada página
  assets/css/               las hojas de estilo de la versión original
public/assets/              logo, fotos de artistas y demás archivos que se sirven tal cual
public/datos/gbif-fuentes.json   los datasets de GBIF usados, para citarlos (lo genera npm run gbif)
scripts/gbif-especies.mjs   descarga y filtra los avistamientos de GBIF
nuxt.config.ts              rutas que se generan, título, idioma
```

## Cómo funciona

**Páginas.** Cada archivo de `app/pages` es una ruta. Al construir, Nuxt genera las rutas que aparecen en `nitro.prerender.routes` de `nuxt.config.ts`. Los enlaces entre páginas son `<a href>` normales: cada página carga completa, igual que en la versión original.

**Capas visuales.** Cada canvas es un componente. Las capas WebGL abren su contexto con `crearRenderer()` y dibujan un triángulo que cubre la pantalla con `pantallaCompleta()`, las dos en `app/utils/gl.ts`. El GLSL original va intacto dentro de un `RawShaderMaterial`, así que three.js no le agrega nada. Cada capa arranca en `onMounted` y se limpia en `onBeforeUnmount`. Si el navegador no tiene WebGL2, la capa no se pinta y la página sigue funcionando.

**Estado compartido.** `useReef()` devuelve un objeto simple que las capas leen en cada cuadro: `prof` (0 en la superficie, 1 en el fondo), `aparece` (opacidad de la nieve marina en Inicio) y `scroll`. Reemplaza a `window.REEF`. Como este objeto existe en todas las páginas, la nieve solo lo sigue cuando la página se lo pide con `<NieveMarina descenso />`; en Ciencia está siempre visible, igual que en la versión original.

**Descenso.** En `useDescenso.ts`, Lenis mueve el scroll, ScrollTrigger lee la posición y el ticker de GSAP da el tiempo. El hero queda anclado hasta "Entra al arrecife"; después aparece la barra y ya no se vuelve a subir al hero. Las cuentas del descenso son las originales de `scroll.js`.

**Estilos.** Las hojas de `app/assets/css` son las de la versión original. Cada página importa las suyas en su bloque `<style>`.

## Datos de GBIF

El mapa de Ciencia muestra avistamientos reales tomados de [GBIF](https://www.gbif.org), la base mundial abierta de registros de especies. La API de la UICN no se usa: negó el acceso a este sitio por considerarlo comercial.

**Cómo llegan los datos.** `npm run gbif` corre `scripts/gbif-especies.mjs`, que consulta la API pública de GBIF (sin llave) y escribe dos archivos que van en el repositorio:

- `app/data/gbif-especies.json`: por especie, su clave en GBIF, la categoría de la Lista Roja de la UICN (GBIF la publica con licencia CC BY 4.0), el total de registros y los registros agrupados en celdas de 1° (`[latitud, longitud, registros]`, en la posición media de la celda).
- `public/datos/gbif-fuentes.json`: cada dataset usado con su título, licencia, número de registros y enlace, más lo que quedó fuera y por qué.

El build no consulta GBIF y el navegador tampoco: la página carga el JSON ya guardado. Los datos cambian solo cuando alguien vuelve a correr el script y hace commit. Tarda cerca de un minuto.

**Qué registros entran.** Solo registros de presencia (en GBIF la mayoría de registros de estas especies son de ausencia: puntos de muestreo donde el animal no apareció), con coordenadas y sin problemas geográficos marcados por GBIF, y con licencia CC0 o CC BY 4.0 tanto en el registro como en el dataset: los no comerciales (CC BY-NC) quedan fuera. Además el script descarta los registros a más de unos 25 km de la costa tierra adentro, que son errores de georreferencia, y los datasets de la lista `EXCLUIDOS`, cada uno con su razón escrita.

**Cómo los usa el mapa.** `MapaDistribucion.vue` suma los registros de cada hexágono. El tamaño del círculo sigue una escala logarítmica (hay celdas con 1 registro y celdas con más de mil); la lectura del cursor muestra el número exacto. Debajo del mapa va la fuente: GBIF.org, el total de registros, las licencias y el enlace a `gbif-fuentes.json`.

**Al actualizar.** Revisar que la categoría UICN que imprime el script coincida con la ficha de `ciencia.vue` (hoy: manta EN, martillo CR). Para agregar una especie: sumarla en `ESPECIES` del script con la misma clave que usa el selector de Ciencia.

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
| `js/nieve.js` | `app/components/NieveMarina.vue` |
| `js/corriente.js` | `app/components/CorrienteObjetos.vue` |
| `js/mapa.js` | `app/components/MapaDistribucion.vue` |
| `js/especie.js` | `app/components/EspecieBitmap.vue` |
| `js/scroll.js` + `js/navegacion.js` | `app/composables/useDescenso.ts` |
| `js/menu.js` | `app/components/SiteNav.vue` |
| `js/musica.js` | `app/composables/useGaleria.ts` |
| `js/ciencia.js` | dentro de `app/pages/ciencia.vue` |
| `js/ciencia-datos.js` | reemplazado por `app/data/gbif-especies.json` (datos reales de GBIF) |

Los cambios de `main` en `js/ciencia-datos.js` o en la forma en que `js/mapa.js` reparte sus zonas ilustrativas ya no aplican aquí: en esta rama el mapa usa los datos de GBIF.

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
- `hero.css`: al bloque `@media (max-width: 640px)` le faltaba la llave de cierre (aquí ya está cerrada, al final del archivo). La regla de movimiento reducido quedó dentro de ese bloque, así que solo aplica en pantallas de 640 px o menos.
- En `main`, `js/mapa.js` sigue con un fallo que aquí ya está corregido: al terminar de cargar el contorno, la pestaña Mantarraya muestra el mapa del martillo hasta que se cambia de especie (`agrupar()` no vuelve a enlazar las texturas; aquí llama a `enlazar()`).
- El mapa es mundial. En Colombia hay 357 registros de martillo (Malpelo es de las zonas con más registros del mundo) pero solo 5 de manta, así que un mapa recortado a Colombia quedaría casi vacío para la manta. Está por decidir el encuadre.
- Las reglas de GBIF para citar datos tomados por su API (un DOI de "derived dataset") no están verificadas; por ahora la cita va debajo del mapa y la lista completa de datasets en `gbif-fuentes.json`.
