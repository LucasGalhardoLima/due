<script setup lang="ts">
import { usePalette } from '@/composables/usePalette'
import { Check } from 'lucide-vue-next'

const { palettes, current, setPalette } = usePalette()
</script>

<template>
  <div class="glass-surface overflow-hidden">
    <!-- Header -->
    <div class="px-5 pt-4 pb-2">
      <span class="text-micro text-muted-foreground">PALETA DE CORES</span>
    </div>

    <!-- Palette Row -->
    <div class="px-5 pb-3 overflow-x-auto">
      <div class="flex gap-3">
        <button
          v-for="palette in palettes"
          :key="palette.id"
          :aria-label="palette.label"
          :aria-checked="current === palette.id"
          role="radio"
          class="flex flex-col items-center gap-2 rounded-2xl px-3 py-3 transition-all duration-200 ease-out shrink-0 min-w-[72px]"
          :class="[
            current === palette.id
              ? 'bg-muted border border-foreground/20'
              : 'border border-transparent hover:bg-muted/40'
          ]"
          @click="setPalette(palette.id)"
        >
          <!-- 3-dot swatch -->
          <div class="relative flex items-center gap-1">
            <span
              class="block w-4 h-4 rounded-full"
              :style="{ backgroundColor: palette.primary }"
            />
            <span
              class="block w-4 h-4 rounded-full"
              :style="{ backgroundColor: palette.secondary }"
            />
            <span
              class="block w-4 h-4 rounded-full"
              :style="{ backgroundColor: palette.accent }"
            />
            <!-- Checkmark overlay -->
            <span
              v-if="current === palette.id"
              class="absolute -top-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-foreground text-background"
            >
              <Check class="w-2.5 h-2.5" />
            </span>
          </div>

          <!-- Name -->
          <span class="text-[9px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            {{ palette.label }}
          </span>
        </button>
      </div>
    </div>

    <!-- Footer Legend -->
    <div class="px-5 pb-4 flex items-center gap-4">
      <span class="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        <span class="block w-2 h-2 rounded-full bg-primary" />
        Primária
      </span>
      <span class="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        <span class="block w-2 h-2 rounded-full bg-secondary" />
        Secundária
      </span>
      <span class="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        <span class="block w-2 h-2 rounded-full bg-accent" />
        Accent
      </span>
    </div>
  </div>
</template>
