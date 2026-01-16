<script setup lang="ts">
import { Bot } from 'lucide-vue-next'

defineProps<{
  analysis: {
    verdict: string
    severity: 'info' | 'warning' | 'critical'
    title: string
    message: string
    action: string
  } | null
  loading?: boolean
}>()


const bgColors = {
  info: 'bg-primary/10 border-primary/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  critical: 'bg-destructive/10 border-destructive/20'
}

const textColors = {
  info: 'text-primary',
  warning: 'text-amber-500 dark:text-amber-400',
  critical: 'text-destructive dark:text-red-400'
}

const iconColors = {
  info: 'text-primary',
  warning: 'text-amber-500',
  critical: 'text-destructive'
}
</script>

<template>
  <div v-if="loading" class="animate-pulse rounded-xl border p-6 space-y-3">
    <div class="h-4 w-1/3 bg-muted rounded"/>
    <div class="h-16 w-full bg-muted rounded"/>
  </div>

  <div
v-else-if="analysis" 
    class="rounded-xl border p-6 relative overflow-hidden transition-all duration-300"
    :class="bgColors[analysis.severity]"
  >
    <!-- Background Decor -->
    <Bot class="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 pointer-events-none" />

    <div class="relative z-10 flex gap-4">
      <div 
        class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 border border-border/50"
        :class="iconColors[analysis.severity]"
      >
        <Bot class="w-6 h-6" />
      </div>

      <div class="space-y-1">
        <div class="flex items-center gap-2">
            <h3 class="font-bold text-lg" :class="textColors[analysis.severity]">
            {{ analysis.title }}
            </h3>
            <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/20" :class="textColors[analysis.severity]">
                Advisor
            </span>
        </div>
        
        <p class="text-sm leading-relaxed text-muted-foreground dark:text-muted-foreground/90">
          {{ analysis.message }}
        </p>

        <div class="pt-3 flex items-start gap-2">
            <span class="font-bold text-xs uppercase tracking-wide mt-0.5" :class="textColors[analysis.severity]">Recomendação:</span>
            <span class="text-sm font-medium italic" :class="textColors[analysis.severity]">"{{ analysis.action }}"</span>
        </div>
      </div>
    </div>
  </div>
</template>
