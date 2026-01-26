<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue'
</script>

<template>
  <div class="min-h-screen bg-background font-sans antialiased flex flex-col lg:flex-row relative overflow-hidden">
    <!-- Mesh Background -->
    <div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/5" />
      <div class="absolute top-[20%] -right-[10%] w-[45%] h-[45%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-900/5" />
      <div class="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-900/5" />
    </div>

    <Sidebar />
    <main class="flex-1 w-full overflow-x-hidden p-4 md:p-6 lg:p-8 relative z-0">
      <slot />
    </main>
  </div>
</template>
