<script setup lang="ts">
import Toaster from '@/components/ui/Toaster.vue'
// @ts-ignore
import { Analytics } from '@vercel/analytics/nuxt'
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster />
    <Analytics />
  </div>
</template>

<style>
/* Import via CSS to ensure it loads */
@import 'vue-sonner/style.css';

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s, filter 0.2s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(0.5rem);
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
  .page-enter-from,
  .page-leave-to {
    filter: none;
  }
}
</style>
