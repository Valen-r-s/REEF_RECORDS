/* REEF Records · Música: selector Slider / Grid y galería infinita
   Motor imperativo sobre refs de la plantilla: recicla celdas del DOM a 60 fps, igual que musica.js.
   La plantilla no tiene enlaces reactivos en estos nodos, así que Vue nunca los vuelve a pintar. */
import type { Ref } from 'vue'

interface Piezas {
  fuente: Ref<HTMLElement | null>
  escena: Ref<HTMLElement | null>
  selector: Ref<HTMLElement | null>
  barra: Ref<HTMLElement | null>
  nombre: Ref<HTMLElement | null>
  contador: Ref<HTMLElement | null>
  anterior: Ref<HTMLElement | null>
  siguiente: Ref<HTMLElement | null>
  categorias: Ref<HTMLElement | null>
  eventos: Ref<HTMLElement | null>
}

type Animacion = { desde: Record<string, number>, destino: Record<string, number>, t0: number, dur: number, curva: (k: number) => number, esModo?: boolean }

export function useGaleria(piezas: Piezas) {
  let limpiar = () => {}

  onMounted(() => {
    // Datos
    const fuentes = [...piezas.fuente.value!.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src')!, alt: i.alt }))
    const n = fuentes.length
    const escena = piezas.escena.value!
    const selector = piezas.selector.value!
    const barra = piezas.barra.value!
    const nombreEl = piezas.nombre.value!
    const contadorEl = piezas.contador.value!
    const tabs = [...selector.querySelectorAll<HTMLElement>('[role="tab"]')]
    const reducir = matchMedia('(prefers-reduced-motion: reduce)')

    const mod = (a: number, b: number) => ((a % b) + b) % b
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k
    const suave = (k: number) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
    const salida = (k: number) => 1 - Math.pow(1 - k, 3)
    const pad = (v: number) => String(v).padStart(2, '0')

    const ESCALA_GRID = 0.74   // la foto se hace un poco más pequeña en grid
    const DESFASE = 0.5        // cada fila corrida media foto respecto a la anterior

    // Estado: t = 0 slider, 1 grid. px en columnas, py en filas.
    const st: { [k: string]: number, t: number, px: number, py: number } = { t: 0, px: 0, py: 0 }
    let modo = 'slider'
    let base = 0               // fila que se ve en el slider
    let anim: Animacion | null = null
    let vx = 0, vy = 0
    let vw = 0, vh = 0, yc = 0, Ws = 300, Hs = 375
    let sucio = true
    let activaKey = ''
    const celdas = new Map<string, HTMLElement>()

    function medir() {
      vw = escena.clientWidth; vh = escena.clientHeight
      const arriba = selector.getBoundingClientRect().bottom + 14
      const abajo = barra.getBoundingClientRect().height + 6
      const disp = Math.max(180, vh - arriba - abajo)
      Hs = Math.min(disp, vw * 0.72 * 1.25)
      Ws = Hs * 0.8
      yc = arriba + disp / 2
      escena.style.setProperty('--cw', Ws + 'px')
      escena.style.setProperty('--ch', Hs + 'px')
      sucio = true
    }

    function crear(r: number, c: number) {
      const el = document.createElement('div')
      el.className = 'celda'
      el.dataset.r = String(r); el.dataset.c = String(c)
      const f = fuentes[mod(c, n)]!
      const img = document.createElement('img')
      img.src = f.src; img.alt = ''; img.draggable = false
      el.appendChild(img)
      escena.appendChild(el)
      return el
    }

    function filaActiva() { return st.t > 0.5 ? Math.round(st.py) : base }

    function render() {
      const s = lerp(1, ESCALA_GRID, st.t)
      const W = Ws * s, H = Hs * s
      const ra = filaActiva()
      const ca = Math.round(st.px + ra * DESFASE)
      const vivos = new Set<string>()
      const r0 = Math.floor(st.py - yc / H) - 1
      const r1 = Math.ceil(st.py + (vh - yc) / H) + 1

      for (let r = r0; r <= r1; r++) {
        // Las filas que no son la del slider entran/salen por arriba y por abajo
        const fuera = r === base ? 0 : Math.sign(r - base) * (1 - st.t) * (vh + H)
        const y = yc + (r - st.py) * H + fuera
        if (y + H / 2 < 0 || y - H / 2 > vh) continue
        const centro = st.px + r * DESFASE
        const c0 = Math.floor(centro - vw / 2 / W) - 1
        const c1 = Math.ceil(centro + vw / 2 / W) + 1
        for (let c = c0; c <= c1; c++) {
          const x = vw / 2 + (c - centro) * W
          if (x + W / 2 < 0 || x - W / 2 > vw) continue
          const key = r + ',' + c
          vivos.add(key)
          let el = celdas.get(key)
          if (!el) { el = crear(r, c); celdas.set(key, el) }
          el.style.transform = `translate3d(${x - W / 2}px, ${y - H / 2}px, 0) scale(${s})`
          const dist = Math.hypot(x - vw / 2, y - yc) / Math.max(vw, vh)
          el.style.setProperty('--d', (dist * 0.45).toFixed(3) + 's')
          el.classList.toggle('activa', r === ra && c === ca)
        }
      }
      for (const [key, el] of celdas) {
        if (!vivos.has(key)) { el.remove(); celdas.delete(key) }
      }

      const key = ra + ',' + ca
      if (key !== activaKey) {
        activaKey = key
        const i = mod(ca, n)
        nombreEl.textContent = fuentes[i]!.alt
        contadorEl.textContent = `${pad(i + 1)} / ${pad(n)}`
      }
    }

    function animar(destino: Record<string, number>, dur: number, curva: (k: number) => number, esModo?: boolean) {
      const desde: Record<string, number> = {}
      for (const k in destino) desde[k] = st[k] as number
      anim = { desde, destino, t0: performance.now(), dur: reducir.matches ? 0 : dur, curva, esModo }
      vx = vy = 0
    }

    const ajustar = (px: number) => Math.round(px + base * DESFASE) - base * DESFASE

    let raf = 0
    function frame(ahora: number) {
      if (anim) {
        const k = anim.dur ? Math.min(1, (ahora - anim.t0) / anim.dur) : 1
        const e = anim.curva(k)
        for (const p in anim.destino) st[p] = lerp(anim.desde[p]!, anim.destino[p]!, e)
        if (k >= 1) anim = null
        sucio = true
      } else if (!arr && (Math.abs(vx) > 1e-4 || Math.abs(vy) > 1e-4)) {
        st.px += vx; st.py += vy
        vx *= 0.93; vy *= 0.93
        if (Math.abs(vx) < 1e-4) vx = 0
        if (Math.abs(vy) < 1e-4) vy = 0
        sucio = true
      }
      if (sucio) { render(); sucio = false }
      raf = requestAnimationFrame(frame)
    }

    // Cambio de vista
    function cambiar(nuevo: string) {
      if (nuevo === modo) return
      modo = nuevo
      tabs.forEach(t => {
        const si = t.id === 'tab-' + nuevo
        t.setAttribute('aria-selected', String(si))
        t.tabIndex = si ? 0 : -1
        if (si) escena.setAttribute('aria-labelledby', t.id)
      })
      escena.classList.toggle('modo-grid', nuevo === 'grid')
      if (nuevo === 'grid') {
        animar({ t: 1 }, 1100, suave, true)
      } else {
        base = Math.round(st.py)
        animar({ t: 0, py: base, px: ajustar(st.px) }, 1100, suave, true)
      }
    }
    const quitar: (() => void)[] = []
    const escuchar = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Window | Document, tipo: K | string, fn: (e: any) => void, opciones?: AddEventListenerOptions) => {
      el.addEventListener(tipo, fn, opciones)
      quitar.push(() => el.removeEventListener(tipo, fn, opciones))
    }
    tabs.forEach((t, i) => {
      escuchar(t, 'click', () => cambiar(t.id.replace('tab-', '')))
      escuchar(t, 'keydown', (e: KeyboardEvent) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        const otro = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]!
        cambiar(otro.id.replace('tab-', '')); otro.focus()
      })
    })

    // Navegación
    function centrar(r: number, c: number) {
      if (modo === 'grid') animar({ px: c - r * DESFASE, py: r }, 650, salida)
      else animar({ px: c - base * DESFASE }, 650, salida)
    }
    function mover(dc: number, dr = 0) {
      if (anim && anim.esModo) return
      if (modo === 'slider') animar({ px: ajustar(st.px) + dc }, 650, salida)
      else {
        const r0 = Math.round(st.py)
        const c0 = Math.round(st.px + r0 * DESFASE) + dc
        // al subir o bajar, tomar la foto más cercana en la fila nueva
        const xVisual = c0 - r0 * DESFASE
        const r = r0 + dr
        centrar(r, dr ? Math.round(xVisual + r * DESFASE) : c0)
      }
    }
    escuchar(piezas.anterior.value!, 'click', () => mover(-1))
    escuchar(piezas.siguiente.value!, 'click', () => mover(1))
    escuchar(escena, 'keydown', (e: KeyboardEvent) => {
      const mapa: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
      const m = mapa[e.key]
      if (!m) return
      if (modo === 'slider' && m[1]) return
      e.preventDefault()
      mover(m[0], m[1])
    })

    // Arrastre en todas las direcciones (en slider solo horizontal)
    let arr: null | { x: number, y: number, px0: number, py0: number, lx: number, ly: number, lt: number, movido: boolean } = null
    escuchar(escena, 'pointerdown', (e: PointerEvent) => {
      if (e.button !== 0) return
      if (anim && anim.esModo) return
      anim = null; vx = vy = 0
      arr = { x: e.clientX, y: e.clientY, px0: st.px, py0: st.py, lx: e.clientX, ly: e.clientY, lt: performance.now(), movido: false }
      escena.setPointerCapture(e.pointerId)
      escena.classList.add('arrastrando')
    })
    escuchar(escena, 'pointermove', (e: PointerEvent) => {
      if (!arr) return
      const s = lerp(1, ESCALA_GRID, st.t)
      const W = Ws * s, H = Hs * s
      const dx = e.clientX - arr.x, dy = e.clientY - arr.y
      if (Math.hypot(dx, dy) > 6) arr.movido = true
      st.px = arr.px0 - dx / W
      if (modo === 'grid') st.py = arr.py0 - dy / H
      const ahora = performance.now()
      const dt = Math.max(1, ahora - arr.lt)
      vx = -(e.clientX - arr.lx) / W / dt * 16
      vy = modo === 'grid' ? -(e.clientY - arr.ly) / H / dt * 16 : 0
      arr.lx = e.clientX; arr.ly = e.clientY; arr.lt = ahora
      sucio = true
    })
    function soltar(e: PointerEvent) {
      if (!arr) return
      const a = arr; arr = null
      escena.classList.remove('arrastrando')
      if (performance.now() - a.lt > 90) { vx = vy = 0 }
      if (!a.movido) {
        vx = vy = 0
        const el = document.elementFromPoint(e.clientX, e.clientY)
        const celda = el && el.closest<HTMLElement>('.celda')
        if (celda) centrar(+celda.dataset.r!, +celda.dataset.c!)
        return
      }
      if (modo === 'slider') {
        const destino = ajustar(st.px + vx * 12)
        animar({ px: destino }, 700, salida)
      }
    }
    escuchar(escena, 'pointerup', soltar)
    escuchar(escena, 'pointercancel', soltar)

    // Rueda / trackpad
    let esperaAjuste: ReturnType<typeof setTimeout> | undefined
    escuchar(escena, 'wheel', (e: WheelEvent) => {
      e.preventDefault()
      if (anim && anim.esModo) return
      anim = null; vx = vy = 0
      const s = lerp(1, ESCALA_GRID, st.t)
      const W = Ws * s, H = Hs * s
      if (modo === 'grid') {
        st.px += e.deltaX / W; st.py += e.deltaY / H
      } else {
        st.px += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / W
        clearTimeout(esperaAjuste)
        esperaAjuste = setTimeout(() => animar({ px: ajustar(st.px) }, 500, salida), 140)
      }
      sucio = true
    }, { passive: false })

    // Artistas / Eventos
    const cats = [...piezas.categorias.value!.querySelectorAll<HTMLElement>('[role="tab"]')]
    const eventos = piezas.eventos.value!
    let seccion = 'artistas'
    function seccionar(cual: string) {
      if (cual === seccion) return
      seccion = cual
      const ev = cual === 'eventos'
      cats.forEach(c => {
        const si = c.id === 'cat-' + cual
        c.setAttribute('aria-selected', String(si))
        c.tabIndex = si ? 0 : -1
      })
      arr = null; vx = vy = 0
      escena.classList.toggle('fuera', ev)
      escena.setAttribute('aria-hidden', String(ev))
      escena.tabIndex = ev ? -1 : 0
      eventos.setAttribute('aria-hidden', String(!ev))
      document.documentElement.classList.toggle('en-eventos', ev)
      tabs.forEach(t => { t.tabIndex = ev ? -1 : (t.getAttribute('aria-selected') === 'true' ? 0 : -1) })
    }
    cats.forEach((c, i) => {
      escuchar(c, 'click', () => seccionar(c.id.replace('cat-', '')))
      escuchar(c, 'keydown', (e: KeyboardEvent) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
        e.preventDefault()
        const otro = cats[(i + (e.key === 'ArrowDown' ? 1 : -1) + cats.length) % cats.length]!
        seccionar(otro.id.replace('cat-', '')); otro.focus()
      })
    })

    escuchar(window, 'resize', medir)
    medir()
    raf = requestAnimationFrame(frame)

    limpiar = () => {
      cancelAnimationFrame(raf)
      clearTimeout(esperaAjuste)
      quitar.forEach(q => q())
      document.documentElement.classList.remove('en-eventos')
    }
  })

  onBeforeUnmount(() => limpiar())
}
