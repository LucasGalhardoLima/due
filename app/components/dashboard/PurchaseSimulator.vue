<script setup lang="ts">
import { Sparkles, ChevronRight } from 'lucide-vue-next'

defineProps<{
  cardId: string
  cardName: string
}>()
</script>

<template>
  <button
    class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-ai-accent/30 bg-[linear-gradient(145deg,hsl(var(--ai-accent)/0.10),hsl(var(--muted)/0.06))] dark:bg-[linear-gradient(145deg,hsl(var(--ai-accent)/0.18),hsl(var(--muted)/0.14))] hover:border-ai-accent/45 transition-all duration-200 active:scale-[0.98] cursor-pointer text-left group"
    @click="navigateTo('/parcelamentos')"
  >
    <div class="h-8 w-8 rounded-xl bg-ai-accent/20 flex items-center justify-center text-ai-accent ring-1 ring-ai-accent/30 shrink-0">
      <Sparkles class="w-4 h-4" />
    </div>
    <span class="flex-1 text-sm font-bold tracking-tight">Simular & Otimizar</span>
    <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wider bg-ai-accent text-ai-accent-foreground">
      NOVO
    </span>
    <ChevronRight class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
  </button>
</template>
