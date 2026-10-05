# REEF Records · sitio web

"No somos un producto, somos una causa que se comunica con música."

Cinco secciones: **Inicio** (entrada, descenso y la causa), **Música** (artistas), **Causas** (los proyectos sin ánimo de lucro), **Ciencia** y **Merch**. Ciencia tiene una portada con dos burbujas que llevan al **Mapa** (dónde encontrar a cada especie) y a **Especies** (la especie en píxeles, su ficha y su estado en la Lista Roja de la UICN).

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
- **three.js**: todas las capas WebGL (mar, nieve marina, especie en píxeles). Se usa directo, sin librerías encima.
- **GSAP ScrollTrigger + Lenis**: el scroll suave y el descenso de la página de inicio.
- **d3** (`d3-geo`, `d3-zoom`, `d3-selection`, `d3-transition`, `d3-ease`) **+ topojson-client**: el atlas de Ciencia en SVG (proyección, zoom, arrastre y acercamientos animados).
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
    ciencia/index.vue         /ciencia            portada: burbujas Mapa y Especies
    ciencia/mapa.vue          /ciencia/mapa       atlas: dónde encontrar a cada especie
    ciencia/especies.vue      /ciencia/especies   la especie en píxeles, ficha, UICN y datos curiosos
    merch.vue                 /merch    edición 01: portada por corte, colección con filtros, pedidos por WhatsApp
    causas.vue                /causas   proyectos: colegios, residuos de fruta, botellas a impresión 3D; cifras y cómo apoyar
  components/               una capa visual por componente
    OceanoMar.vue             mar en vista cenital (three.js), en Inicio y Ciencia
    MantasSombras.vue         las dos mantas como sombras (canvas 2D con desenfoque)
    NieveMarina.vue           nieve marina (three.js); en Inicio aparece al descender (prop descenso)
    CorrienteObjetos.vue      burbujas a la deriva unidas por la línea punteada (Inicio y portada de Ciencia)
    AtlasEspecies.vue         atlas de Ciencia (d3 en SVG): zoom, sitios, individuos, rutas, registros GBIF
    SelectorEspecie.vue       pestañas Mantarraya Gigante / Tiburón Martillo
    EspecieBitmap.vue         la especie en píxeles con tramado (three.js)
    SiteNav.vue               barra de navegación y menú móvil
    MarcaReef.vue             logo REEF RECORDS de la esquina, blanco o negro según la página
    MerchPortada.vue          camiseta tras un vidrio esmerilado (filtro SVG), solo el estampado nítido
    MerchTarjeta.vue          una camiseta: tallas (radios) y enlace de pedido a WhatsApp
    TopografiaMar.vue         estampado topográfico en movimiento de la portada de Causas (three.js, GLSL 3)
  composables/
    useReef.ts                estado del scroll que comparten las capas
    useDescenso.ts            Lenis + ScrollTrigger: hero anclado y descenso de Inicio
    useGaleria.ts             motor de la galería de artistas
    useEspecie.ts             especie elegida en Ciencia, guardada en la URL (?especie=martillo)
    useRevelar.ts             aparición de los .revelar fuera de Inicio
  data/gbif-especies.json   avistamientos de GBIF por especie (lo genera npm run gbif)
  data/atlas.ts             sitios, rutas ilustrativas, hábitat y estado UICN de cada especie en el atlas
  data/merch.ts             productos, fotos de la portada y el mensaje de pedido
  data/causas.ts            proyectos, cifras con su fuente y fotos (con el autor de las de referencia)
  data/contacto.ts          número de WhatsApp corporativo: pedidos, donaciones y alianzas
  utils/gl.ts               ayudas de three.js que usan todas las capas
  plugins/hash-llegada.client.ts   conserva la llegada directa a /#causa
  router.options.ts         posición del scroll al cargar cada página
  assets/css/               las hojas de estilo de la versión original
public/assets/              logo, fotos de artistas y demás archivos que se sirven tal cual
public/assets/merch/        fotos de las camisetas ya recortadas (4:5, 400 y 800 px)
public/assets/causas/       fotos de Causas en WebP, 800 y 1600 px: de referencia (Unsplash) y de eventos (evento-*)
public/datos/gbif-fuentes.json   los datasets de GBIF usados, para citarlos (lo genera npm run gbif)
scripts/gbif-especies.mjs   descarga y filtra los avistamientos de GBIF
nuxt.config.ts              rutas que se generan, título, idioma
```

## Cómo funciona

**Páginas.** Cada archivo de `app/pages` es una ruta. Al construir, Nuxt genera las rutas que aparecen en `nitro.prerender.routes` de `nuxt.config.ts`. Los enlaces entre páginas son `<a href>` normales: cada página carga completa, igual que en la versión original.

**Capas visuales.** Cada canvas es un componente. Las capas WebGL abren su contexto con `crearRenderer()` y dibujan un triángulo que cubre la pantalla con `pantallaCompleta()`, las dos en `app/utils/gl.ts`. El GLSL original va intacto dentro de un `RawShaderMaterial`, así que three.js no le agrega nada. Cada capa arranca en `onMounted` y se limpia en `onBeforeUnmount`. Si el navegador no tiene WebGL2, la capa no se pinta y la página sigue funcionando.

**Estado compartido.** `useReef()` devuelve un objeto simple que las capas leen en cada cuadro: `prof` (0 en la superficie, 1 en el fondo), `aparece` (opacidad de la nieve marina en Inicio) y `scroll`. Reemplaza a `window.REEF`. Como este objeto existe en todas las páginas, la nieve solo lo sigue cuando la página se lo pide con `<NieveMarina descenso />`; en Ciencia está siempre visible, igual que en la versión original.

**Descenso.** En `useDescenso.ts`, Lenis mueve el scroll, ScrollTrigger lee la posición y el ticker de GSAP da el tiempo. El hero queda anclado hasta "Entra al arrecife"; después aparece la barra y ya no se vuelve a subir al hero. Las cuentas del descenso son las originales de `scroll.js`.

**Estilos.** Las hojas de `app/assets/css` son las de la versión original. Cada página importa las suyas en su bloque `<style>`. Esos bloques no son `scoped`: en desarrollo Nuxt puede cargar las hojas de varias páginas a la vez, así que cada regla debe quedar acotada a su página (por ejemplo `.ciencia > .selector`, nunca `html` o `.volver` sueltos). Una regla suelta de Música (`html { overflow: hidden }`) llegó a bloquear el scroll de Ciencia.

**Colores.** Solo los del manual de marca: azul REEF `#657bb6` con sus tintas al 80, 60, 40 y 20 % (`--reef`, `--reef-80`…`--reef-20`), blanco y negro (`--negro`, `--noche`), definidos en `hero.css`. Cada página toma un tema según su fondo:

| Página | Fondo | Shader | Tema |
|---|---|---|---|
| Inicio, Ciencia | el mar que baja al abismo (`--abismo`) | mar, nieve marina, mantas, especie en píxeles | océano: blanco y azules REEF sobre el azul del mar |
| Música | negro | no | negativo: blanco y azul REEF sobre negro |
| Causas | negro, con el estampado topográfico en la portada | topografía (en la escala del azul REEF) | negativo en color |
| Merch | blanco | no (vidrio con filtro SVG) | positivo: negro sobre blanco, el azul REEF como color |

El acento de texto sobre fondos oscuros es `--acento` (azul REEF al 60 %); los velos y sombras de texto usan `--sombra-rgb`, que las páginas negras cambian por negro. El agua del shader del mar conserva sus azules; las categorías de la Lista Roja usan los colores oficiales de la UICN (`--cat-*`) porque son datos.

**Rótulos.** Todo texto de interfaz en mayúsculas (navbar, pestañas, Artistas/Eventos, volver, enlaces de acción, nombres de burbujas, lemas) usa `--rotulo`, `--rotulo-peso` y `--rotulo-espacio`, definidos en `hero.css` con el tamaño de la navbar. Pies de figura y metadatos usan `--rotulo-chico`. No poner tamaños sueltos en esos elementos: así todas las páginas quedan parejas.

**Header.** Flotante y compacto: `padding: calc(env(safe-area-inset-top, 0px) + 16px) clamp(16px, 3.2vw, 44px) 16px` alrededor de los enlaces. Su altura total es `--alto-header` (en `hero.css`), que usan las páginas para dejar el espacio de arriba.

## Datos de GBIF

El mapa de Ciencia muestra avistamientos reales tomados de [GBIF](https://www.gbif.org), la base mundial abierta de registros de especies. La API de la UICN no se usa: negó el acceso a este sitio por considerarlo comercial.

**Cómo llegan los datos.** `npm run gbif` corre `scripts/gbif-especies.mjs`, que consulta la API pública de GBIF (sin llave) y escribe dos archivos que van en el repositorio:

- `app/data/gbif-especies.json`: por especie, su clave en GBIF, la categoría de la Lista Roja de la UICN (GBIF la publica con licencia CC BY 4.0), el total de registros y los registros agrupados en celdas de 1° (`[latitud, longitud, registros]`, en la posición media de la celda).
- `public/datos/gbif-fuentes.json`: cada dataset usado con su título, licencia, número de registros y enlace, más lo que quedó fuera y por qué.

El build no consulta GBIF y el navegador tampoco: la página carga el JSON ya guardado. Los datos cambian solo cuando alguien vuelve a correr el script y hace commit. Tarda cerca de un minuto.

**Qué registros entran.** Solo registros de presencia (en GBIF la mayoría de registros de estas especies son de ausencia: puntos de muestreo donde el animal no apareció), con coordenadas y sin problemas geográficos marcados por GBIF, y con licencia CC0 o CC BY 4.0 tanto en el registro como en el dataset: los no comerciales (CC BY-NC) quedan fuera. Además el script descarta los registros a más de unos 25 km de la costa tierra adentro, que son errores de georreferencia, y los datasets de la lista `EXCLUIDOS`, cada uno con su razón escrita.

**Cómo los usa el mapa.** `AtlasEspecies.vue` dibuja cada celda de 1° como un punto turquesa ("Registros GBIF" en la leyenda). El radio sigue el logaritmo del número de registros (hay celdas con 1 registro y celdas con más de mil). En el pie de la lista de sitios va la fuente: GBIF.org, el total de registros, las licencias y el enlace a `gbif-fuentes.json`.

**Lo demás del atlas es ilustrativo.** Los sitios de agregación, las rutas entre ellos y los individuos que se mueven por cada zona salen de `app/data/atlas.ts`, no de GBIF ni de datos de rastreo satelital; así lo dice el pie del atlas.

**Al actualizar.** Revisar que la categoría UICN que imprime el script coincida con la ficha de `ciencia/especies.vue` y con `app/data/atlas.ts` (hoy: manta EN, martillo CR). Para agregar una especie: sumarla en `ESPECIES` del script con la misma clave que usa el selector de Ciencia.

## De la versión original a Nuxt

| Original (`main`) | En `nuxt-migration` |
|---|---|
| `index.html` | `app/pages/index.vue` |
| `musica.html` | `app/pages/musica.vue` |
| `ciencia.html` | `app/pages/ciencia/especies.vue` (la portada y el mapa son nuevos en esta rama) |
| `css/*.css` | `app/assets/css/*.css` |
| `assets/*` | `public/assets/*` |
| `js/oceano.js` | `app/components/OceanoMar.vue` |
| `js/mantas.js` | `app/components/MantasSombras.vue` |
| `js/nieve.js` | `app/components/NieveMarina.vue` |
| `js/corriente.js` | `app/components/CorrienteObjetos.vue` |
| `js/mapa.js` | reemplazado por `app/components/AtlasEspecies.vue` (el atlas sobre d3) |
| `js/especie.js` | `app/components/EspecieBitmap.vue` |
| `js/scroll.js` + `js/navegacion.js` | `app/composables/useDescenso.ts` |
| `js/menu.js` | `app/components/SiteNav.vue` |
| `js/musica.js` | `app/composables/useGaleria.ts` |
| `js/ciencia.js` | `app/components/SelectorEspecie.vue` + `app/composables/useEspecie.ts` |
| `js/ciencia-datos.js` | reemplazado por `app/data/gbif-especies.json` (datos reales de GBIF) |

Los cambios de `main` en `js/ciencia-datos.js` o en `js/mapa.js` ya no aplican aquí: en esta rama Ciencia tiene su propia estructura (portada, mapa y especies) y el mapa es el atlas sobre d3 con los datos de GBIF.

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
- El contorno de los continentes del atlas se descarga al abrir el mapa, desde jsdelivr (`world-atlas`, de Natural Earth): `land-50m` al entrar y `land-10m` la primera vez que se acerca más de 4×. `land-10m` trae 3 polígonos degenerados que d3 lee como la esfera entera; `corregirGiro()` los invierte.
- El build avisa que el paquete de three.js pasa de 500 kB. Es un aviso, no un error.
- `hero.css`: al bloque `@media (max-width: 640px)` le faltaba la llave de cierre (aquí ya está cerrada, al final del archivo). La regla de movimiento reducido quedó dentro de ese bloque, así que solo aplica en pantallas de 640 px o menos.
- El atlas es mundial y se puede acercar a cualquier sitio. En Colombia hay 357 registros de martillo (Malpelo es de las zonas con más registros del mundo) pero solo 5 de manta.
- Las reglas de GBIF para citar datos tomados por su API (un DOI de "derived dataset") no están verificadas; por ahora la cita va en el pie del atlas y la lista completa de datasets en `gbif-fuentes.json`.
- Falta el número de WhatsApp corporativo (`WHATSAPP` en `app/data/contacto.ts`); lo usan los pedidos de Merch y los botones de donar y de alianzas de Causas. Mientras esté vacío, WhatsApp abre el mensaje escrito y deja elegir el contacto. En Merch, los precios tampoco están: cada producto acepta `precio` (en pesos) y solo se muestra si existe.
- Merch es la única página clara: no carga el mar ni la nieve.
- Causas: las fotos de los tres proyectos, la del plástico en el mar y la de la manta son de referencia, de Unsplash (licencia gratuita, sin fines de venta directa de la foto). Cada una dice "Imagen de referencia" y su autor, y el pie de la página da los créditos. Al tener fotos propias, se reemplazan en `public/assets/causas/` y en `FOTOS` de `app/data/causas.ts`. Las fotos de eventos (`evento-*`) son de la carpeta Comunidad de REEF; se eligieron planos abiertos, sin retratos de asistentes.
- El logo de la esquina es `MarcaReef.vue`: los trazos de "REEF RECORDS - Blanco/Negro.svg" en línea, blanco por defecto y `tono="negro"` (#414042) en páginas claras. "RECORDS" es texto en Orbitron, por eso no se usa como `<img>` (una imagen SVG no puede cargar la tipografía de la página). `public/assets/reef-web-corner.png` (385 kB) y `reef-web-corner.svg` (vacío) ya no los usa ninguna página.
- Los sitios, notas y rutas del tiburón martillo en `app/data/atlas.ts` son nuevos: conviene revisarlos con el equipo, igual que los de la manta que vinieron de `landing-mobula`.
