/* REEF Records · Descenso de la página de inicio (antes scroll.js + navegacion.js)
   El hero solo se deja con "Entra al arrecife"; navbar fuera del hero.
   Lenis lleva el scroll, GSAP ScrollTrigger lee la posición y el ticker de GSAP da el tiempo,
   igual que en lab/app/app.vue. Las cuentas del descenso son las originales. */
import type { Ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

interface Piezas {
  heroe: Ref<HTMLElement | null>
  causa: Ref<HTMLElement | null>
  causaT: Ref<HTMLElement | null>
  accion: Ref<HTMLElement | null>
}

export function useDescenso(piezas: Piezas) {
  const reef = useReef()
  const { $hashLlegada } = useNuxtApp()
  // La navbar empieza oculta (inert) hasta entrar. Las clases de <html> se tocan directamente como
  // en navegacion.js: el servidor pinta "anclado" y aquí se quita; unhead no las administra.
  const navVisible = ref(false)
  let limpiar = () => {}

  onMounted(() => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
    const suave = (x: number) => x * x * (3 - 2 * x)
    const html = document.documentElement
    const heroe = piezas.heroe.value!
    const causa = piezas.causa.value!

    Object.assign(reef, { prof: 0, aparece: 0, scroll: 0 })
    const objetivo = { prof: 0, aparece: 0 }
    let dentro = false, animando = false, piso = 0

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    /* ───────── Lenis + GSAP ScrollTrigger ───────── */
    gsap.registerPlugin(ScrollTrigger)
    // eslint-disable-next-line prefer-const
    let lenis: Lenis
    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      // Ya dentro, el scroll nunca vuelve a subir al hero: la rueda no lleva a Lenis por encima del piso
      virtualScroll: (d) => {
        if (dentro && !animando && d.deltaY < 0) {
          const margen = lenis.targetScroll - piso
          if (margen <= 1) return false
          d.deltaY = Math.max(d.deltaY, -margen)
        }
        return true
      }
    })
    lenis.on('scroll', ScrollTrigger.update)
    const alTick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(alTick)
    gsap.ticker.lagSmoothing(0)
    lenis.stop()   // hero anclado: sin rueda

    /* ───────── Estado del scroll compartido entre capas ───────── */
    function leer() {
      const s = window.scrollY / window.innerHeight   // 1 = una pantalla hacia abajo
      objetivo.prof = suave(clamp(s / 1.1))
      objetivo.aparece = suave(clamp((s - 0.2) / 0.5))
      reef.scroll = s
      // el contenido del hero sube y se desvanece al descender
      const h = clamp(s / 0.7)
      heroe.style.opacity = String(1 - h)
      heroe.style.transform = reducido ? 'none' : `translateY(${-h * 70}px)`
      heroe.style.visibility = h >= 1 ? 'hidden' : 'visible'
    }
    const disparador = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: leer, onRefresh: leer })
    leer()

    // suavizado continuo para que nada salte aunque el scroll sea brusco
    const paso = (_time: number, deltaTime: number) => {
      const dt = Math.min(deltaTime / 1000, 0.1)
      const k = reducido ? 1 : 1 - Math.exp(-dt * 4.5)   // independiente de los fps
      reef.prof += (objetivo.prof - reef.prof) * k
      reef.aparece += (objetivo.aparece - reef.aparece) * k
    }
    gsap.ticker.add(paso)

    // aparición de textos: un 20 % del elemento dentro de la pantalla (antes IntersectionObserver, threshold 0.2)
    const revelables = gsap.utils.toArray<HTMLElement>('.revelar')
    const apariciones = revelables.map(el => ScrollTrigger.create({
      trigger: el, start: '20% bottom', once: true,
      onEnter: () => el.classList.add('visible')
    }))

    /* ───────── Navegación ───────── */
    const medirPiso = () => { piso = causa.getBoundingClientRect().top + window.scrollY }
    const suaveEntrada = (p: number) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2

    function ir(y: number, dur: number, fin?: () => void) {
      animando = true
      lenis.scrollTo(y, {
        duration: dur / 1000, easing: suaveEntrada, immediate: dur === 0, force: true, lock: true,
        onComplete: () => { animando = false; fin && fin() }
      })
    }

    function mostrarNav(si: boolean) {
      html.classList.toggle('dentro', si)
      navVisible.value = si
    }

    function entrar() {
      if (dentro || animando) return
      medirPiso()
      ir(piso, reducido ? 0 : 2400, () => {
        dentro = true
        lenis.start()
        html.classList.remove('anclado')
        mostrarNav(true)
        piezas.causaT.value?.focus({ preventScroll: true })
      })
    }

    function volver() {
      if (!dentro || animando) return
      dentro = false
      mostrarNav(false)
      html.classList.add('anclado')
      lenis.stop()
      ir(0, reducido ? 0 : 1800, () => piezas.accion.value?.focus({ preventScroll: true }))
    }

    reef.entrar = entrar
    reef.volver = volver

    // Hero anclado: sin rueda, táctil ni teclado
    html.classList.add('anclado')
    mostrarNav(false)
    const teclas = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar'])
    let toqueY = 0
    const alRodar = (e: WheelEvent) => {
      if (!dentro || animando || (e.deltaY < 0 && window.scrollY <= piso + 1)) e.preventDefault()
    }
    const alTocar = (e: TouchEvent) => { toqueY = e.touches[0]!.clientY }
    const alArrastrar = (e: TouchEvent) => {
      if ((e.target as Element).closest('.nav-lista')) return
      const subiendo = e.touches[0]!.clientY > toqueY
      if (!dentro || animando || (subiendo && window.scrollY <= piso + 1)) e.preventDefault()
    }
    const alTeclear = (e: KeyboardEvent) => {
      if (!teclas.has(e.key) || (e.target as Element).closest('input, textarea, select, button')) return
      if (!dentro || animando) e.preventDefault()
    }
    // Ya dentro, el scroll nunca vuelve a subir al hero
    const alDesplazar = () => {
      if (dentro && !animando && window.scrollY < piso - 1) lenis.scrollTo(piso, { immediate: true, force: true })
    }
    const alRedimensionar = () => {
      medirPiso()
      if (dentro && !animando) lenis.scrollTo(Math.max(window.scrollY, piso), { immediate: true, force: true })
    }
    window.addEventListener('wheel', alRodar, { passive: false })
    window.addEventListener('touchstart', alTocar, { passive: true })
    window.addEventListener('touchmove', alArrastrar, { passive: false })
    window.addEventListener('keydown', alTeclear)
    window.addEventListener('scroll', alDesplazar, { passive: true })
    window.addEventListener('resize', alRedimensionar)

    // Llegada desde otra página con /#causa: entrar directo
    let rafHash = 0
    if ($hashLlegada === '#causa' || location.hash === '#causa') {
      rafHash = requestAnimationFrame(() => {
        medirPiso()
        lenis.scrollTo(piso, { immediate: true, force: true })
        dentro = true
        lenis.start()
        html.classList.remove('anclado')
        mostrarNav(true)
      })
    }

    limpiar = () => {
      cancelAnimationFrame(rafHash)
      window.removeEventListener('wheel', alRodar)
      window.removeEventListener('touchstart', alTocar)
      window.removeEventListener('touchmove', alArrastrar)
      window.removeEventListener('keydown', alTeclear)
      window.removeEventListener('scroll', alDesplazar)
      window.removeEventListener('resize', alRedimensionar)
      apariciones.forEach(a => a.kill())
      disparador.kill()
      gsap.ticker.remove(paso)
      gsap.ticker.remove(alTick)
      lenis.destroy()
    }
  })

  onBeforeUnmount(() => limpiar())

  return { navVisible }
}
