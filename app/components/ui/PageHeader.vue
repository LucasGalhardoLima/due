<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  title: string
  subtitle?: string
  icon?: Component // Lucide component
  backTo?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 h-[72px]">
    <div class="flex items-center gap-4">
      <div v-if="icon" class="hidden md:flex bg-primary/18 dark:bg-primary/20 p-3 rounded-2xl border border-primary/35 text-primary-foreground dark:text-primary shadow-elevation-1">
        <component :is="icon" class="w-6 h-6" />
      </div>
      <div>
        <h1 class="text-h1">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-body text-muted-foreground mt-1.5">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <NuxtLink
      v-if="backTo"
      :to="backTo"
      class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
    >
      <div class="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m15 18-6-6 6-6"/></svg>
      </div>
      Voltar
    </NuxtLink>

    <div v-else>
        <slot name="actions" />
    </div>
  </div>
</template>
