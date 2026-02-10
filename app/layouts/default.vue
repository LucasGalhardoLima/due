<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'
</script>

<template>
  <div class="min-h-screen bg-background font-sans antialiased relative overflow-hidden">
    <!-- Branded ambient background -->
    <div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_10%_12%,hsl(var(--primary)/0.42),transparent_42%),radial-gradient(circle_at_86%_18%,hsl(var(--secondary)/0.14),transparent_36%),radial-gradient(circle_at_58%_88%,hsl(var(--primary)/0.22),transparent_44%)] dark:bg-[radial-gradient(circle_at_10%_12%,hsl(var(--primary)/0.28),transparent_42%),radial-gradient(circle_at_86%_18%,hsl(var(--secondary)/0.20),transparent_36%),radial-gradient(circle_at_58%_88%,hsl(var(--primary)/0.16),transparent_44%)]" />
      <div class="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,hsl(var(--primary)/0.06)_35%,transparent_70%)] dark:bg-[linear-gradient(120deg,transparent_0%,hsl(var(--secondary)/0.08)_35%,transparent_70%)]" />
    </div>

    <DemoBanner />

    <div class="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <main class="flex-1 w-full overflow-x-hidden p-4 md:p-6 lg:p-8 lg:pl-[19.5rem] relative z-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
        <slot />
      </main>
    </div>

    <!-- PWA Install Prompt -->
    <InstallPrompt />
  </div>
</template>
