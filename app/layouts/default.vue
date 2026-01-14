<script setup lang="ts">
import Header from '@/components/layout/Header.vue'
</script>

<template>
  <div class="min-h-screen bg-background font-sans antialiased">
    <Header />
    <main>
      <slot />
    </main>
  </div>
</template>
