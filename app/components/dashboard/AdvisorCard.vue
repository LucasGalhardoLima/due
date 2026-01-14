<script setup lang="ts">
import { Bot, AlertTriangle, CheckCircle, Info } from 'lucide-vue-next'

const props = defineProps<{
  analysis: {
    verdict: string
    severity: 'info' | 'warning' | 'critical'
    title: string
    message: string
    action: string
  } | null
  loading?: boolean
}>()

const emit = defineEmits(['close'])

const bgColors = {
  info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
  warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900',
  critical: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
}

const textColors = {
  info: 'text-blue-800 dark:text-blue-300',
  warning: 'text-amber-800 dark:text-amber-300',
  critical: 'text-red-800 dark:text-red-300'
}

const iconColors = {
  info: 'text-blue-600 dark:text-blue-400',
  warning: 'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400'
}
</script>

<template>
  <div v-if="loading" class="animate-pulse rounded-xl border p-6 space-y-3">
    <div class="h-4 w-1/3 bg-muted rounded"></div>
    <div class="h-16 w-full bg-muted rounded"></div>
  </div>

  <div v-else-if="analysis" 
    class="rounded-xl border p-6 relative overflow-hidden transition-all duration-300"
    :class="bgColors[analysis.severity]"
  >
    <!-- Background Decor -->
    <Bot class="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 pointer-events-none" />

    <div class="relative z-10 flex gap-4">
      <div 
        class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white/50 dark:bg-black/20"
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
