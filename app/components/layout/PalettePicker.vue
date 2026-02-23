<script setup lang="ts">
import { usePalette } from '@/composables/usePalette'

const { palettes, current, setPalette } = usePalette()
</script>

<template>
  <div class="flex items-center gap-2" role="radiogroup" aria-label="Paleta de cores">
    <button
      v-for="palette in palettes"
      :key="palette.id"
      :title="palette.label"
      :aria-label="palette.label"
      :aria-checked="current === palette.id"
      role="radio"
      class="relative flex items-center gap-0.5 rounded-full px-1 py-1 transition-all duration-200 ease-out"
      :class="[
        current === palette.id
          ? 'bg-muted ring-1 ring-foreground/30 ring-offset-1 ring-offset-background'
          : 'hover:bg-muted/50 opacity-70 hover:opacity-100'
      ]"
      @click="setPalette(palette.id)"
    >
      <span
        class="block w-2.5 h-2.5 rounded-full shrink-0"
        :style="{ backgroundColor: palette.primary }"
      />
      <span
        class="block w-2.5 h-2.5 rounded-full shrink-0"
        :style="{ backgroundColor: palette.secondary }"
      />
      <span
        class="block w-2.5 h-2.5 rounded-full shrink-0"
        :style="{ backgroundColor: palette.accent }"
      />
    </button>
  </div>
</template>
