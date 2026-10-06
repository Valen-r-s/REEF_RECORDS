<template>
  <svg class="icono-red" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <template v-if="red === 'youtube'">
      <rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor" />
      <path d="M10 9.2v5.6l4.8-2.8z" fill="var(--icono-fondo, #0b0b0b)" />
    </template>
    <template v-else-if="red === 'soundcloud'">
      <path d="M10 9.5a5 5 0 0 1 9.4 1.8A3 3 0 0 1 19 17H10z" fill="currentColor" />
      <path d="M2.5 13.5v3.5M4.5 11.5v5.5M6.5 10.5v6.5M8.5 10v7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
    </template>
    <template v-else-if="red === 'instagram'">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
    </template>
    <template v-else-if="red === 'whatsapp'">
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M9 8.3c.3-.4.7-.4 1-.1l.9 1.6c.2.4 0 .7-.3 1l-.4.4a6 6 0 0 0 2.6 2.6l.4-.4c.3-.3.6-.5 1-.3l1.6.9c.3.3.3.7-.1 1-.8.9-1.9 1.2-3 .7a9 9 0 0 1-4.4-4.4c-.5-1.1-.2-2.2.7-3z" fill="currentColor" />
    </template>
  </svg>
</template>

<script setup lang="ts">
/* REEF Records · Íconos de redes, dibujados en currentColor para que sigan la paleta de cada página */
defineProps<{ red: 'youtube' | 'soundcloud' | 'instagram' | 'whatsapp' }>()
</script>
