<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'
</script>

<template>
  <div class="min-h-screen bg-background font-sans antialiased relative overflow-hidden">
    <!-- Mesh Background - subtle -->
    <div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[150px] dark:bg-primary/3" />
      <div class="absolute top-[20%] -right-[10%] w-[45%] h-[45%] rounded-full bg-blue-500/5 blur-[150px] dark:bg-blue-900/3" />
      <div class="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-emerald-500/5 blur-[150px] dark:bg-emerald-900/3" />
    </div>

    <DemoBanner />

    <div class="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <main class="flex-1 w-full overflow-x-hidden p-4 md:p-6 lg:p-8 lg:pl-72 relative z-0">
        <slot />
      </main>
    </div>

    <!-- PWA Install Prompt -->
    <InstallPrompt />
  </div>
</template>
