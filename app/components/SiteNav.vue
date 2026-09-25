<template>
  <nav
    id="navegacion"
    class="navegacion"
    :class="{ abierto }"
    aria-label="Principal"
    :inert="inicio ? !visible : undefined"
    :aria-hidden="inicio ? String(!visible) : undefined"
  >
    <button id="nav-menu" class="nav-menu" type="button" :aria-expanded="String(abierto)" aria-controls="nav-lista" @click="abierto = !abierto">Menú</button>
    <ul id="nav-lista" class="nav-lista">
      <li v-for="e in enlaces" :key="e.ruta">
        <a :href="e.href" :data-ruta="e.ruta" :aria-current="e.ruta === actual ? 'page' : undefined" @click="alEnlace($event, e.href)">{{ e.texto }}</a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
/* REEF Records · Navbar y menú móvil (antes menu.js, y la parte de menú de navegacion.js).
   Los enlaces son cargas completas de página, como en la versión vanilla. */
const props = defineProps<{
  /** '/musica' o '/ciencia' marca aria-current */
  actual?: string
  /** '#causa' en inicio, '/#causa' en las páginas interiores */
  causas: string
  /** Solo en inicio: la navbar está oculta (inert, aria-hidden) hasta entrar al arrecife */
  inicio?: boolean
  visible?: boolean
}>()

const enlaces = computed(() => [
  { href: '#', ruta: '/about', texto: 'About' },
  { href: '/musica', ruta: '/musica', texto: 'Música' },
  { href: props.causas, ruta: '/causas', texto: 'Causas' },
  { href: '#', ruta: '/merch', texto: 'Merch' },
  { href: '/ciencia', ruta: '/ciencia', texto: 'Ciencia' }
])

const abierto = ref(false)
const cerrarMenu = () => { abierto.value = false }

function alEnlace(e: MouseEvent, href: string) {
  if (href === '#') e.preventDefault()   // páginas aún sin crear: destino en data-ruta
  cerrarMenu()
}

watch(() => props.visible, (si) => { if (props.inicio && !si) cerrarMenu() })

const alTecla = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrarMenu() }
onMounted(() => document.addEventListener('keydown', alTecla))
onBeforeUnmount(() => document.removeEventListener('keydown', alTecla))
</script>
