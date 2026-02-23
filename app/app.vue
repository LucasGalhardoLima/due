<script setup lang="ts">
import Toaster from '@/components/ui/Toaster.vue'
import UpgradeModal from '@/components/tier/UpgradeModal.vue'
// @ts-expect-error Nuxt injects analytics types at build time.
import { Analytics } from '@vercel/analytics/nuxt'
import { useColorPalette } from '@/composables/useColorPalette'

// Initialize palette globally so it applies on every page (including landing)
useColorPalette()
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster />
    <UpgradeModal />
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
