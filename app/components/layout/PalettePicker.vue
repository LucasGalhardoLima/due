<script setup lang="ts">
import { usePalette } from '@/composables/usePalette'

const { palettes, current, setPalette } = usePalette()
</script>

<template>
  <div class="flex items-center gap-1.5" role="radiogroup" aria-label="Paleta de cores">
    <button
      v-for="palette in palettes"
      :key="palette.id"
      :title="palette.label"
      :aria-label="palette.label"
      :aria-checked="current === palette.id"
      role="radio"
      class="relative w-5 h-5 rounded-full transition-all duration-200 ease-out shrink-0"
      :class="[
        current === palette.id
          ? 'ring-2 ring-foreground/70 ring-offset-2 ring-offset-background scale-110'
          : 'hover:scale-110 opacity-70 hover:opacity-100'
      ]"
      :style="{
        background: `linear-gradient(135deg, ${palette.primary} 50%, ${palette.secondary} 50%)`,
      }"
      @click="setPalette(palette.id)"
    />
  </div>
</template>
