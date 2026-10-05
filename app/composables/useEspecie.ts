/* REEF Records · Ciencia: especie elegida en el mapa y en la página de especies.
   Se guarda en la URL (?especie=martillo) para que los enlaces entre las dos páginas la conserven.
   Las páginas se generan con la mantarraya; la especie de la URL se aplica al montar, para que el HTML
   prerenderizado y el del cliente coincidan al hidratar. */
export const ESPECIES_CIENCIA = [
  { id: 'manta', texto: 'Mantarraya Gigante' },
  { id: 'martillo', texto: 'Tiburón Martillo' }
] as const

export function useEspecie() {
  const route = useRoute()
  const router = useRouter()
  const especie = ref<string>('manta')

  onMounted(() => {
    const pedida = route.query.especie
    if (typeof pedida === 'string' && ESPECIES_CIENCIA.some(e => e.id === pedida)) especie.value = pedida
  })

  watch(especie, (id) => {
    if (route.query.especie === id || (id === 'manta' && !route.query.especie)) return
    router.replace({ query: id === 'manta' ? {} : { especie: id } })
  })

  return especie
}
