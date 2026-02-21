<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'
import GlobalQuickAddFab from '@/components/layout/GlobalQuickAddFab.vue'
</script>

<template>
  <div class="app-shell min-h-screen bg-background font-sans antialiased relative overflow-hidden">
    <DemoBanner />

    <div class="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <main class="flex-1 w-full overflow-x-hidden p-4 md:p-6 lg:p-8 lg:pl-[19.5rem] pb-20 lg:pb-8 relative z-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
        <slot />
      </main>
    </div>

    <BottomNav />
    <GlobalQuickAddFab />

    <!-- PWA Install Prompt -->
    <InstallPrompt />
  </div>
</template>
