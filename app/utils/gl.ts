/* REEF Records · Utilidades de three.js compartidas por las capas WebGL.
   Cada capa conserva su GLSL original dentro de un RawShaderMaterial: three.js no le añade nada. */
import {
  BufferAttribute, BufferGeometry, Camera, DoubleSide, Mesh, NoBlending, RawShaderMaterial, Scene, WebGLRenderer
} from 'three'

type Atributos = WebGLContextAttributes

/**
 * Abre el lienzo con los mismos atributos de contexto que la versión vanilla.
 * Si el navegador no da WebGL, devuelve null en silencio y la capa no se pinta (el mismo camino
 * que el `if (!gl) return;` original). three.js desde r163 exige WebGL2.
 */
export function crearRenderer(canvas: HTMLCanvasElement, atributos: Atributos): WebGLRenderer | null {
  const attrs: Atributos = {
    alpha: true, depth: true, stencil: false, antialias: false,
    premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'default',
    ...atributos
  }
  let gl: WebGL2RenderingContext | null = null
  try { gl = canvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null } catch { gl = null }
  if (!gl) return null
  const renderer = new WebGLRenderer({ canvas, context: gl, ...attrs } as any)
  renderer.setPixelRatio(1)          // cada capa fija su resolución interna como en el original
  renderer.sortObjects = false       // un solo objeto por escena
  renderer.setClearColor(0x000000, 0)
  return renderer
}

/** Ajusta el búfer de dibujo a un tamaño exacto en píxeles (canvas.width / height y viewport). */
export function fijarTamano(renderer: WebGLRenderer, ancho: number, alto: number) {
  renderer.setSize(ancho, alto, false)
}

/** Triángulo que cubre la pantalla, con el atributo `p` que usan los vertex shaders originales. */
export function pantallaCompleta(vertexShader: string, fragmentShader: string, uniforms: Record<string, { value: unknown }>) {
  const geometria = new BufferGeometry()
  geometria.setAttribute('p', new BufferAttribute(new Float32Array([-1, -1, 3, -1, -1, 3]), 2))
  geometria.setDrawRange(0, 3)
  const material = new RawShaderMaterial({
    vertexShader, fragmentShader, uniforms,
    blending: NoBlending, depthTest: false, depthWrite: false, side: DoubleSide
  })
  const malla = new Mesh(geometria, material)
  malla.frustumCulled = false
  const escena = new Scene()
  escena.add(malla)
  return { escena, material, geometria }
}

/** Los shaders originales escriben gl_Position directamente: la cámara no interviene. */
export function camaraNula() {
  return new Camera()
}

export const esReducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
