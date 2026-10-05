/* REEF Records · Aparición de los elementos .revelar al entrar en pantalla.
   En Inicio lo hace el descenso (ScrollTrigger, en useDescenso); las demás páginas usan esto. */
export function useRevelar() {
  let vista: IntersectionObserver | null = null

  onMounted(() => {
    const elementos = document.querySelectorAll<HTMLElement>('.revelar')
    vista = new IntersectionObserver((entradas) => {
      for (const en of entradas) {
        if (!en.isIntersecting) continue
        en.target.classList.add('visible')
        vista?.unobserve(en.target)
      }
    }, { threshold: 0.2 })
    elementos.forEach(el => vista!.observe(el))
  })

  onBeforeUnmount(() => vista?.disconnect())
}
