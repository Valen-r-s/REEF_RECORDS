<template>
  <canvas ref="lienzo" class="ab-lienzo" aria-hidden="true"></canvas>
  <!-- los tanques: el shader los dibuja justo sobre estos elementos, que solo dan la posición y el tamaño -->
  <div ref="fila" class="ab-tanques" :class="{ 'con-gl': conGl }" aria-hidden="true">
    <span
      v-for="n in TANQUES" :key="n" class="ab-tanque"
      @pointerenter="alEntrar($event, n - 1)" @pointerleave="alSalirTanque($event)" @pointerdown="alTocar($event, n - 1)"
    ></span>
  </div>
  <div class="ab-suelo" aria-hidden="true"></div>
</template>

<script setup lang="ts">
/* REEF Records · About: cinco tanques de agua con una persona en silueta dentro de cada uno (WebGL sobre three.js).
   Todo es procedimental. El agua: contraluz, rayos, cáusticas, partículas, burbujas y la superficie que ondula.
   Las siluetas: personas de pie hechas de elipses y cápsulas unidas con suavidad, con cuerpo de mujer o de hombre,
   pelo largo y liso o corto, chaqueta, vestido o buzo; respiran, pasan el peso de un pie al otro y dejan una estela
   como de foto de larga exposición; la luz de la superficie les cae en la cabeza y los hombros.
   El piso es agua quieta y refleja los tanques.
   El tanque bajo el cursor (o el que se toca) se enciende. Se detiene fuera de pantalla;
   con movimiento reducido se pinta un cuadro quieto. */
import { GLSL3, Vector2, Vector3, Vector4 } from 'three'
import { camaraNula, crearRenderer, esReducido, fijarTamano, pantallaCompleta } from '~/utils/gl'

const TANQUES = 5
const lienzo = ref<HTMLCanvasElement | null>(null)
const fila = ref<HTMLElement | null>(null)
const conGl = ref(false)
const encendido = ref(-1)   // el tanque que se ilumina: bajo el cursor, o el último que se tocó

let soltar: ReturnType<typeof setTimeout> | undefined
const alEntrar = (e: PointerEvent, i: number) => { if (e.pointerType === 'mouse') encendido.value = i }
const alSalirTanque = (e: PointerEvent) => { if (e.pointerType === 'mouse') encendido.value = -1 }
// en pantallas táctiles un toque lo enciende un momento
const alTocar = (e: PointerEvent, i: number) => {
  if (e.pointerType === 'mouse') return
  encendido.value = i
  clearTimeout(soltar)
  soltar = setTimeout(() => { encendido.value = -1 }, 1800)
}

const vs = `in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
const fs = `
precision highp float;
uniform vec2 uRes;
uniform float uT, uDpr, uPiso;
uniform vec4 uTanque[5];   // x0, y0 (abajo), x1, y1 (arriba) en px del lienzo, con y hacia arriba
uniform float uLuz[5];     // brillo de cada tanque: el encendido sube
uniform vec3 uRaton;       // cursor en px del lienzo; z = 1 si es un mouse sobre la sección
out vec4 color;

const vec3 NEGRO = vec3(.012, .015, .024);
const vec3 HONDO = vec3(.07, .095, .17);        // azul REEF en sombra
const vec3 REEF = vec3(.396, .482, .714);       // #657bb6
const vec3 REEF80 = vec3(.518, .584, .773);     // #8495c5
const vec3 REEF60 = vec3(.639, .69, .827);      // #a3b0d3
const vec3 REEF20 = vec3(.878, .898, .941);     // #e0e5f0
const vec3 SOMBRA = vec3(.008, .011, .022);

// cada persona: cuerpo (0 mujer · 1 hombre), pelo (0 corto · 1 largo y liso · 2 capucha),
// ropa (0 ajustada · 1 chaqueta · 2 vestido corto · 3 buzo) y postura, en radianes desde la vertical.
// 0 brazos a los lados · 1 brazos cruzados · 2 manos en los bolsillos · 3 mano en la cintura · 4 mano en el vidrio
const int CUERPO[5]      = int[5](0, 1, 1, 0, 1);
const int PELO[5]        = int[5](1, 0, 0, 1, 2);
const int ROPA[5]        = int[5](0, 1, 1, 2, 3);
const float BRAZO_I[5]   = float[5](.1, .2, .2, .1, .1);
const float CODO_I[5]    = float[5](.05, -2.1, -.5, .06, .08);
const float BRAZO_D[5]   = float[5](.11, .2, .2, .55, 1.);
const float CODO_D[5]    = float[5](.05, -2.1, -.5, -1.9, .95);
const float PIERNA_I[5]  = float[5](-.012, .03, .02, .04, .05);
const float RODILLA_I[5] = float[5](.02, -.02, 0., -.03, -.02);
const float PIERNA_D[5]  = float[5](-.012, .04, .07, -.03, .04);
const float RODILLA_D[5] = float[5](.02, -.03, -.09, .05, 0.);
const float INCLINA[5]   = float[5](0., .015, -.02, .025, -.03);   // el peso cargado hacia un lado
const float ALTURA[5]    = float[5](.96, 1.02, 1.05, .97, 1.);
const float CABEZA_G[5]  = float[5](0., .03, -.05, .08, -.06);
// borde de arriba en perspectiva: los tanques de los lados están más cerca y bajan hacia el centro
const float PENDIENTE[5] = float[5](-.06, -.03, 0., .03, .06);

float cuad(float x){ return x * x; }
float h11(float n){ return fract(sin(n * 91.345) * 47453.5453); }
vec2 h22(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
float ruido(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h22(i).x, h22(i + vec2(1., 0.)).x, f.x), mix(h22(i + vec2(0., 1.)).x, h22(i + vec2(1., 1.)).x, f.x), f.y);
}
mat2 giro(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
// red de celdas: distancia al segundo punto menos al primero. Sus bordes son las líneas de luz de las cáusticas
float red(vec2 p, float t){
  vec2 g = floor(p), f = fract(p);
  float d1 = 9., d2 = 9.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y));
    vec2 r = h22(g + o);
    r = .5 + .42 * sin(t * .7 + 6.2831 * r);
    float d = length(o + r - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return d2 - d1;
}
float causticas(vec2 p, float t){
  vec2 w = vec2(ruido(p * .7 + t * .13), ruido(p * .7 - t * .11 + 5.3)) * 1.1;
  float a = pow(1. - smoothstep(0., .22, red(p + w, t)), 3.);
  float b = pow(1. - smoothstep(0., .18, red(p * 1.6 - w + 3.1, t * 1.25)), 3.);
  // la luz no cae pareja: hay zonas donde la red casi desaparece
  float zona = smoothstep(.25, .75, ruido(p * .28 + vec2(t * .05, -t * .04)));
  return (a * .8 + b * .5) * (.25 + .75 * zona);
}

// distancias (negativas por dentro). Las uniones suaves (smin) funden las piezas en un solo cuerpo
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
float seg(vec2 p, vec2 a, vec2 b, float ra, float rb){      // cápsula que se afina de a hacia b
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
  return length(pa - ba * h) - mix(ra, rb, h);
}
float elipse(vec2 p, vec2 r){ float k0 = length(p / r), k1 = length(p / (r * r)); return k0 * (k0 - 1.) / max(k1, 1e-4); }
// trapecio vertical: media anchura a arriba (en y1) y b abajo (en y0)
float trapecio(vec2 p, float y0, float y1, float a, float b){
  float hw = mix(b, a, clamp((p.y - y0) / (y1 - y0), 0., 1.));
  return max((abs(p.x) - hw) / sqrt(1. + cuad((b - a) / (y1 - y0))), max(y0 - p.y, p.y - y1));
}
vec2 hacia(float a, float lado){ return vec2(lado * sin(a), -cos(a)); }

// silueta de la persona i, de pie: pies en y = 0 y coronilla cerca de y = 0.97 (por su estatura)
float persona(vec2 p, int i, float t){
  float f = float(i) * 1.7;
  float s1 = sin(t * .8 + f), s2 = sin(t * .63 + f * 1.3), s3 = sin(t * .91 + f * .7), s4 = sin(t * .37 + f * 2.1);
  float alto = ALTURA[i];
  p /= alto;
  p.y -= .004 * sin(t * .55 + f);                              // el agua apenas la sostiene
  vec2 caja = abs(p - vec2(0., .48)) - vec2(.56, .62);         // lejos del cuerpo no hace falta calcularlo
  float fuera = max(caja.x, caja.y);
  if (fuera > .04) return fuera * alto;
  p = giro(INCLINA[i] + .012 * s2) * p;                        // pasa el peso de un pie al otro
  p.x *= 1. + .03 * s4;                                        // y gira un poco sobre sí misma
  p += vec2(sin(p.y * 26. + t * 1.6 + f), sin(p.x * 22. - t * 1.25 + f)) * .002;   // el agua dobla el contorno

  bool mujer = CUERPO[i] == 0;
  int ropa = ROPA[i];
  float esp = mujer ? .1 : .125;                               // media espalda
  float resp = 1. + .02 * sin(t * 1.1 + f);                    // respira
  // tronco: pecho, cintura y cadera (más marcadas en el cuerpo de mujer)
  float d;
  if (mujer) {
    d = elipse(p - vec2(0., .7), vec2(.078 * resp, .075));
    d = smin(d, elipse(p - vec2(0., .6), vec2(.056, .07)), .045);
    d = smin(d, elipse(p - vec2(0., .5), vec2(.082, .068)), .04);
  } else {
    d = elipse(p - vec2(0., .69), vec2(.1 * resp, .09));
    d = smin(d, elipse(p - vec2(0., .58), vec2(.084, .08)), .05);
    d = smin(d, elipse(p - vec2(0., .49), vec2(.086, .065)), .05);
  }
  vec2 hI = vec2(-esp, .772), hD = vec2(esp, .772);
  float rh = mujer ? .03 : .04;
  d = smin(d, seg(p, vec2(-.028, .8), hI, mujer ? .026 : .034, rh), .03);   // del cuello al hombro
  d = smin(d, seg(p, vec2(.028, .8), hD, mujer ? .026 : .034, rh), .03);
  d = smin(d, seg(p, vec2(0., .775), vec2(0., .855), mujer ? .024 : .031, mujer ? .022 : .028), .022);

  // cabeza: cráneo y mandíbula
  vec2 cab = vec2(.004 * s2, .905);
  vec2 q = giro(CABEZA_G[i] + .03 * s3) * (p - cab);
  vec2 rc = mujer ? vec2(.048, .056) : vec2(.052, .058);
  float dc = smin(elipse(q - vec2(0., .01), rc), elipse(q - vec2(0., -.028), rc * vec2(.74, .7)), .03);
  int pelo = PELO[i];
  if (pelo == 0) {            // corto, con un poco de volumen arriba y hacia un lado
    dc = smin(dc, elipse(q - vec2(-.004, .026), vec2(.057, .046 + .002 * s1)), .025);
  } else if (pelo == 1) {     // largo y liso hasta media espalda; las puntas se mecen con el agua
    dc = smin(dc, elipse(q - vec2(0., .014), rc + .007), .01);
    float vaiven = .014 * sin(t * .6 + f) * clamp(-q.y / .33, 0., 1.);
    float puntas = -.33 + .007 * sin(q.x * 70. + t * 1.3 + f);
    dc = min(dc, trapecio(q - vec2(vaiven, 0.), puntas, .02, .056, .07));
  } else {                    // capucha: cubre la cabeza y baja hasta los hombros
    dc = smin(dc, elipse(q - vec2(0., .0), vec2(.072, .08)), .02);
    dc = smin(dc, trapecio(q, -.13, -.02, .062, .1), .05);
  }
  d = smin(d, dc, .014);

  // brazos: hombro, codo, muñeca y la mano siguiendo al antebrazo; las mangas los engruesan
  float ra = mujer ? .029 : .04, rb = mujer ? .022 : .032, rm = mujer ? .016 : .024;
  if (ropa == 1 || ropa == 3) { ra *= 1.08; rb *= 1.12; }
  float aI = BRAZO_I[i] + .03 * s1, aD = BRAZO_D[i] + .03 * s2;
  vec2 cI = hI + hacia(aI, -1.) * .165, cD = hD + hacia(aD, 1.) * .165;
  vec2 dI = hacia(aI + CODO_I[i] + .04 * s3, -1.), dD = hacia(aD + CODO_D[i] + .04 * s1, 1.);
  vec2 mI = cI + dI * .15, mD = cD + dD * .15;
  d = smin(d, seg(p, hI, cI, ra, rb), .025);
  d = smin(d, seg(p, cI, mI, rb, rm), .012);
  d = smin(d, seg(p, mI + dI * .006, mI + dI * .055, rm, rm * .62), .012);
  d = smin(d, seg(p, hD, cD, ra, rb), .025);
  d = smin(d, seg(p, cD, mD, rb, rm), .012);
  d = smin(d, seg(p, mD + dD * .006, mD + dD * .055, rm, rm * .62), .012);

  // piernas: juntas y finas con tacón, o rectas de pantalón con zapatos
  float cad = mujer ? .04 : .056;
  vec2 pI = vec2(-cad, .49), pD = vec2(cad, .49);
  float lI = PIERNA_I[i] + .01 * s3, lD = PIERNA_D[i] - .01 * s3;
  vec2 rI = pI + hacia(lI, -1.) * .225, rD = pD + hacia(lD, 1.) * .225;
  vec2 eI = hacia(lI + RODILLA_I[i], -1.), eD = hacia(lD + RODILLA_D[i], 1.);
  vec2 tI = rI + eI * .225, tD = rD + eD * .225;               // tobillos cerca de y = 0.04
  if (mujer) {
    d = smin(d, seg(p, pI, rI, .052, .036), .03);
    d = smin(d, seg(p, rI, tI, .036, .018), .015);
    d = smin(d, seg(p, rI + eI * .04, rI + eI * .12, .037, .031), .025);
    d = smin(d, seg(p, tI, tI + vec2(-.012, -.03), .018, .01), .01);
    d = smin(d, seg(p, pD, rD, .052, .036), .03);
    d = smin(d, seg(p, rD, tD, .036, .018), .015);
    d = smin(d, seg(p, rD + eD * .04, rD + eD * .12, .037, .031), .025);
    d = smin(d, seg(p, tD, tD + vec2(.012, -.03), .018, .01), .01);
  } else {
    d = smin(d, seg(p, pI, rI, .062, .05), .03);
    d = smin(d, seg(p, rI, tI, .05, .046), .015);
    d = smin(d, elipse(p - tI - vec2(-.022, -.014), vec2(.045, .022)), .015);
    d = smin(d, seg(p, pD, rD, .062, .05), .03);
    d = smin(d, seg(p, rD, tD, .05, .046), .015);
    d = smin(d, elipse(p - tD - vec2(.022, -.014), vec2(.045, .022)), .015);
  }

  // ropa
  if (ropa == 1) {            // chaqueta: hombros cuadrados y el ruedo a la altura de la cadera
    d = smin(d, trapecio(p, .43, .745, esp - .008, esp - .01), .045);
  } else if (ropa == 2) {     // vestido corto que se mueve un poco con el agua
    d = smin(d, trapecio(p, .38 + .006 * sin(p.x * 50. + t * 1.5 + f), .6, .06, .105), .02);
  } else if (ropa == 3) {     // buzo ancho
    d = smin(d, trapecio(p, .45, .74, esp - .01, esp - .006), .045);
  }
  return d * alto;
}

// los tanques y la oscuridad entre ellos; en el reflejo del piso se dibujan más simples y borrosos
vec3 tanques(vec2 px, float t, bool reflejo){
  vec3 col = NEGRO;
  float derrame = 0.;
  for (int k = 0; k < 5; k++) {
    vec4 q = uTanque[k];
    vec2 cen = (q.xy + q.zw) * .5, med = (q.zw - q.xy) * .5;
    derrame += uLuz[k] * exp(-length(max(abs(px - cen) - med, 0.)) / (med.y * .55 + 1.));
  }
  col += REEF * derrame * .085;

  int i = -1; vec4 r = vec4(0.);
  for (int k = 0; k < 5; k++) {
    vec4 q = uTanque[k];
    if (px.x >= q.x && px.x < q.z && px.y >= q.y && px.y < q.w) { i = k; r = q; }
  }
  if (i < 0) return col;
  float w = r.z - r.x, h = r.w - r.y;
  vec2 uv = vec2((px.x - r.x) / w, (px.y - r.y) / h);
  float pend = PENDIENTE[i];
  float tope = 1. - abs(pend) * (pend < 0. ? uv.x : 1. - uv.x);
  if (uv.y > tope) return col;
  float fi = float(i), luz = uLuz[i];

  // agua: honda abajo, clara arriba, con contraluz detrás de la persona y rayos que entran por la superficie
  float sup = tope - .07 + sin(uv.x * 9. + t * 1.3 + fi) * .004 + sin(uv.x * 23. - t * 2.1 + fi * 2.) * .002;
  vec3 agua = mix(HONDO, REEF, smoothstep(-.1, .6, uv.y));
  agua *= .68 + .32 * smoothstep(0., .32, min(uv.x, 1. - uv.x));          // volumen: más oscuro contra los lados
  agua += REEF * .3 * exp(-cuad((uv.x - .5) * 2.6) - cuad((uv.y - .48) * 2.2));
  float rayo = pow(.5 + .5 * sin(uv.x * 13. + uv.y * 3.5 + t * .35 + fi * 1.7), 6.) * (.5 + .5 * ruido(vec2(uv.x * 5. + fi, t * .25)));
  agua += REEF20 * rayo * .08 * uv.y;
  float cau = 0.;
  if (!reflejo) {
    cau = causticas(vec2(px.x - r.x, px.y) / (30. * uDpr) + fi * 3.7, t);
    agua += REEF20 * cau * (.035 + .11 * uv.y * uv.y);
    // partículas suspendidas que suben despacio
    vec2 qp = px / (13. * uDpr) + vec2(.4 * sin(t * .2 + fi), t * .35);
    vec2 cel = floor(qp), hh = h22(cel + fi * 17.);
    if (hh.x > .94) agua += REEF20 * (1. - smoothstep(0., .14, length(fract(qp) - .25 - .5 * h22(cel + 3.)))) * .35 * hh.y;
  }
  agua += REEF60 * (1. - smoothstep(0., .09, uv.y)) * (.22 + .25 * cau);   // charco de luz en el fondo del tanque
  agua *= luz;

  // la persona está de pie sobre el fondo del tanque; en tanques angostos toca el vidrio con las manos
  float S = min(h * .7, w * 1.9);
  vec2 o = vec2(r.x + w * .5, r.y + h * .03);
  if (i == 4) o.x += max(0., w * .5 / S - .5) * S;    // se corre hasta apoyar la mano en el vidrio
  vec2 pf = (px - o) / S;
  float d = persona(pf, i, t);
  float borde = (reflejo ? 7. : 2.2) * uDpr / S;
  float sil = 1. - smoothstep(-borde, borde, d);
  agua += REEF80 * .16 * luz * exp(-max(d, 0.) / .045);                 // halo del contraluz
  vec3 c;
  if (reflejo) c = mix(agua, SOMBRA, sil * .9);
  else {
    // de qué lado mira el contorno (gradiente de la distancia): la luz entra por la superficie, arriba
    vec2 n = vec2(0., 1.);
    if (d < .035) {
      float e = .004;
      n = normalize(vec2(persona(pf + vec2(e, 0.), i, t) - d, persona(pf + vec2(0., e), i, t) - d) + 1e-6);
    }
    // franja fina por dentro del contorno: el contraluz apenas envuelve el borde, como en una foto
    float filo = smoothstep(-min(borde * 3.2, .012), -borde * .4, d) * sil;   // tope en unidades de la figura: fino aunque sea pequeña
    float arriba = cuad(max(n.y, 0.));
    vec3 cuerpo = SOMBRA + REEF * .08 * luz * filo                        // contraluz
                + REEF60 * .26 * luz * filo * arriba                      // luz de la superficie en cabeza y hombros
                + REEF20 * cau * .14 * filo * arriba;                     // cáusticas que pasan por encima
    cuerpo = mix(cuerpo, agua, .08);                                      // el agua que queda delante
    c = mix(agua, cuerpo, sil);
    // estela: la misma persona un instante antes, como en una foto de larga exposición
    float dg = persona(pf, i, t - .6);
    float estela = (1. - smoothstep(-borde * 5., borde * 5., dg)) * (1. - sil);
    c = mix(c, mix(agua, SOMBRA, .55), estela * .32);
  }

  if (!reflejo) {
    for (int k = 0; k < 6; k++) {                                        // burbujas sueltas
      float fk = float(k), s = h11(fk * 7.13 + fi * 3.1);
      float y = fract(t * (.035 + .05 * s) + s * 9.);
      vec2 b = vec2(r.x + w * (.18 + .64 * h11(fk * 1.7 + fi)) + sin(t * 1.4 + fk * 2.) * w * .03, r.y + h * (.03 + y * (sup - .05)));
      float rb = (1.4 + 2.8 * h11(fk * 4.1 + fi * 1.3)) * uDpr;
      float db = length(px - b);
      float aro = (1. - smoothstep(rb - 1.2 * uDpr, rb, db)) - .6 * (1. - smoothstep(rb - 2.4 * uDpr, rb - 1.2 * uDpr, db));
      c += REEF20 * aro * .55 * (1. - smoothstep(.85, 1., y));
    }
    vec2 boca = o + S * vec2(0., .89 * ALTURA[i]);
    for (int k = 0; k < 3; k++) {                                        // respiración: burbujitas que salen de la cabeza
      float fk = float(k), y = fract(t * .16 + fi * .37 + fk * .09);
      vec2 b = vec2(boca.x + (sin(t * 2.2 + fk * 2.4) * 3. + (fk - 1.) * 4.) * uDpr, mix(boca.y, r.y + h * (sup - .02), y));
      float rb = (1.1 + .5 * fk) * uDpr;
      c += REEF20 * (1. - smoothstep(rb - 1. * uDpr, rb, length(px - b))) * .5 * (1. - smoothstep(.8, 1., y)) * smoothstep(0., .04, y);
    }
  }
  // superficie: arriba queda aire, y en la línea del agua una luz que ondula
  if (uv.y > sup) c = mix(HONDO * .6, REEF * .32, (uv.y - sup) / max(tope - sup, .001)) * luz;
  c += REEF20 * exp(-abs(uv.y - sup) * h / (1.6 * uDpr)) * .75 * luz;
  c += REEF60 * (1. - smoothstep(0., .07, sup - uv.y)) * step(uv.y, sup) * .18 * luz;

  // el cursor es una linterna contra el vidrio
  vec2 dr = px - uRaton.xy;
  c += REEF60 * uRaton.z * exp(-dot(dr, dr) / cuad(w * .42)) * .2 * (1. - sil * .85);

  // vidrio: dos reflejos verticales y el marco metálico
  c += REEF20 * (exp(-cuad((uv.x - .09) / .02)) * .07 + exp(-cuad((uv.x - .14) / .006)) * .05) * (.4 + .6 * uv.y);
  float marco = min(min(px.x - r.x, r.z - px.x), min(px.y - r.y, (tope - uv.y) * h));
  c = mix(c, REEF20 * (.55 + .35 * luz), (1. - smoothstep(.8 * uDpr, 2.4 * uDpr, marco)) * .8);
  return c;
}

void main(){
  vec2 px = gl_FragCoord.xy;
  float t = uT;
  vec3 col;
  if (px.y >= uPiso) col = tanques(px, t, false);
  else {
    // el piso es agua quieta: refleja los tanques con ondas que corren
    float dd = uPiso - px.y;
    float k = 1. + dd / (40. * uDpr);
    vec2 rp = vec2(px.x + (sin(dd * .07 / uDpr - t * 1.1) * 1.3 + sin(dd * .19 / uDpr + px.x * .011 / uDpr + t * .8) * .8) * uDpr * k,
                   uPiso + dd * 1.05);
    col = NEGRO * .7 + tanques(rp, t, true) * .45 * exp(-dd / (uRes.y * .22));
    float onda = pow(.5 + .5 * sin(dd * .5 / uDpr + 6. * ruido(vec2(px.x * .004 / uDpr, dd * .02 / uDpr + t * .3))), 16.);
    col += REEF60 * onda * .05 * exp(-dd / (uRes.y * .3));
  }
  col += (h22(px + fract(t) * 91.).x - .5) * .018;     // grano fino
  color = vec4(col, 1.);
}`

const QUIETO = 14   // segundos: el cuadro que se pinta con movimiento reducido
let limpiar = () => {}
let alEncender = () => {}
watch(encendido, () => alEncender())

onMounted(() => {
  const cv = lienzo.value!
  const tanques = fila.value!
  const renderer = crearRenderer(cv, { alpha: false, premultipliedAlpha: false })
  if (!renderer) return   // sin WebGL2 los tanques se pintan con CSS
  conGl.value = true

  const luz = Array.from({ length: TANQUES }, () => .82)
  const U = {
    uRes: { value: new Vector2() }, uT: { value: 0 }, uDpr: { value: 1 }, uPiso: { value: 0 },
    uTanque: { value: Array.from({ length: TANQUES }, () => new Vector4()) },
    uLuz: { value: luz },
    uRaton: { value: new Vector3(-1e4, -1e4, 0) }
  }
  const { escena, material, geometria } = pantallaCompleta(vs, fs, U)
  material.glslVersion = GLSL3
  const camara = camaraNula()
  const reducido = esReducido()
  let escala = 1
  const metaLuz = (i: number) => i === encendido.value ? 1.08 : .82

  // los tanques están donde estén sus elementos: se miden en cada cuadro (el titular puede cambiar de alto al cargar la letra)
  const medir = () => {
    const rc = cv.getBoundingClientRect()
    if (!rc.width) return
    const k = cv.width / rc.width
    const items = tanques.children
    for (let i = 0; i < TANQUES; i++) {
      const el = items[i] as HTMLElement | undefined
      if (!el) { U.uTanque.value[i]!.set(0, 0, 0, 0); continue }
      const r = el.getBoundingClientRect()
      U.uTanque.value[i]!.set((r.left - rc.left) * k, (rc.bottom - r.bottom) * k, (r.right - rc.left) * k, (rc.bottom - r.top) * k)
    }
    U.uPiso.value = (rc.bottom - tanques.getBoundingClientRect().bottom) * k
  }
  const dibujar = (seg: number) => {
    medir()
    U.uRes.value.set(cv.width, cv.height)
    U.uT.value = seg
    U.uDpr.value = escala
    renderer.render(escena, camara)
  }
  const ajustar = () => {
    const w = cv.clientWidth, h = cv.clientHeight
    // el agua es suave: un px de búfer por px de pantalla basta, y en pantallas muy grandes se baja
    escala = Math.min(window.devicePixelRatio || 1, 1, Math.sqrt(1.8e6 / Math.max(1, w * h)))
    fijarTamano(renderer, Math.round(w * escala), Math.round(h * escala))
    if (reducido) dibujar(QUIETO)
  }
  const observaTamano = new ResizeObserver(ajustar)
  observaTamano.observe(cv)
  ajustar()

  const raton = { x: -1e4, y: -1e4, z: 0 }
  const alMover = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const rc = cv.getBoundingClientRect(), k = cv.width / (rc.width || 1)
    raton.x = (e.clientX - rc.left) * k
    raton.y = (rc.bottom - e.clientY) * k
    raton.z = e.clientY >= rc.top && e.clientY <= rc.bottom ? 1 : 0
  }
  const alSalir = () => { raton.z = 0 }
  window.addEventListener('pointermove', alMover, { passive: true })
  document.documentElement.addEventListener('pointerleave', alSalir)

  alEncender = () => {
    if (!reducido) return
    for (let i = 0; i < TANQUES; i++) luz[i] = metaLuz(i)
    dibujar(QUIETO)
  }

  let visible = true, raf = 0
  const observaVista = new IntersectionObserver(([en]) => { visible = en!.isIntersecting })
  observaVista.observe(cv)
  const bucle = (ms: number) => {
    raf = requestAnimationFrame(bucle)
    if (!visible) return
    for (let i = 0; i < TANQUES; i++) luz[i] = luz[i]! + (metaLuz(i) - luz[i]!) * .07
    const R = U.uRaton.value
    if (R.x < -1e3) R.set(raton.x, raton.y, 0)
    R.x += (raton.x - R.x) * .12
    R.y += (raton.y - R.y) * .12
    R.z += (raton.z - R.z) * .08
    dibujar(ms / 1000)
  }
  if (reducido) alEncender()
  else raf = requestAnimationFrame(bucle)

  limpiar = () => {
    cancelAnimationFrame(raf)
    clearTimeout(soltar)
    observaTamano.disconnect(); observaVista.disconnect()
    window.removeEventListener('pointermove', alMover)
    document.documentElement.removeEventListener('pointerleave', alSalir)
    geometria.dispose(); material.dispose(); renderer.dispose()
  }
})
onBeforeUnmount(() => limpiar())
</script>
