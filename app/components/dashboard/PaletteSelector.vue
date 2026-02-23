<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { useColorPalette } from '@/composables/useColorPalette'

const { activePaletteId, palettes, applyPalette } = useColorPalette()
</script>

<template>
  <div class="glass-surface p-4">
    <p class="text-micro text-muted-foreground mb-3">Paleta de cores</p>

    <div class="flex flex-wrap gap-3">
      <button
        v-for="palette in palettes"
        :key="palette.id"
        class="group relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all duration-200 min-w-[72px]"
        :class="[
          activePaletteId === palette.id
            ? 'border-primary bg-primary/8 shadow-elevation-2'
            : 'border-border/60 bg-card hover:border-border hover:bg-muted/40',
        ]"
        @click="applyPalette(palette.id)"
      >
        <!-- Color trio -->
        <div class="flex items-center gap-1">
          <span
            class="h-4 w-4 rounded-full border border-white/10 shadow-sm"
            :style="{ backgroundColor: palette.preview.primary }"
          />
          <span
            class="h-4 w-4 rounded-full border border-white/10 shadow-sm"
            :style="{ backgroundColor: palette.preview.secondary }"
          />
          <span
            class="h-4 w-4 rounded-full border border-white/10 shadow-sm"
            :style="{ backgroundColor: palette.preview.accent }"
          />
        </div>

        <!-- Label -->
        <span
          class="text-[10px] font-bold whitespace-nowrap"
          :class="[
            activePaletteId === palette.id
              ? 'text-primary'
              : 'text-muted-foreground group-hover:text-foreground',
          ]"
        >
          {{ palette.name }}
        </span>

        <!-- Active indicator -->
        <span
          v-if="activePaletteId === palette.id"
          class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
        >
          <Check class="h-2.5 w-2.5" />
        </span>
      </button>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
      <div class="flex items-center gap-1">
        <span class="h-2 w-2 rounded-full bg-primary" />
        Primária
      </div>
      <div class="flex items-center gap-1">
        <span class="h-2 w-2 rounded-full bg-secondary-accent" />
        Secundária
      </div>
      <div class="flex items-center gap-1">
        <span class="h-2 w-2 rounded-full bg-accent" />
        Accent
      </div>
    </div>
  </div>
</template>
