<script setup lang="ts">
import { Settings, Moon, Sun } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import PaletteCard from '@/components/dashboard/PaletteCard.vue'

const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="app-page">
    <PageHeader
      title="Configurações"
      subtitle="Personalize sua experiência"
      :icon="Settings"
    />

    <!-- Aparência -->
    <div class="glass-surface p-6 space-y-6">
      <h2 class="text-h2">Aparência</h2>

      <!-- Dark / Light toggle -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-body font-semibold">Tema</p>
          <p class="text-small text-muted-foreground">Alternar entre modo claro e escuro</p>
        </div>
        <button
          class="flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-muted/60 border border-border/80 hover:bg-muted hover:border-foreground/20 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-elevation-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          @click="toggleTheme"
        >
          <Moon v-if="colorMode.value === 'light'" class="w-4 h-4" />
          <Sun v-else class="w-4 h-4" />
          <span>{{ colorMode.value === 'light' ? 'Escuro' : 'Claro' }}</span>
        </button>
      </div>

      <!-- Palette Picker -->
      <div>
        <p class="text-body font-semibold mb-3">Paleta de Cores</p>
        <PaletteCard />
      </div>
    </div>
  </div>
</template>
