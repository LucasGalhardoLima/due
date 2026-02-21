<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import DuAvatar from '@/components/ui/DuAvatar.vue'

interface ScoreComponent {
  name: string
  score: number
  maxScore: number
  tip: string
}

const props = defineProps<{
  score: number
  components: ScoreComponent[]
  trend: 'up' | 'down' | 'stable'
}>()

const scoreColor = computed(() => {
  if (props.score >= 70) return 'text-success'
  if (props.score >= 40) return 'text-warning'
  return 'text-danger'
})

const strokeColor = computed(() => {
  if (props.score >= 70) return 'stroke-success'
  if (props.score >= 40) return 'stroke-warning'
  return 'stroke-danger'
})

const trackColor = computed(() => {
  if (props.score >= 70) return 'stroke-success/15'
  if (props.score >= 40) return 'stroke-warning/15'
  return 'stroke-danger/15'
})

// SVG circular gauge calculations
const radius = 40
const circumference = 2 * Math.PI * radius
const dashOffset = computed(() => circumference - (props.score / 100) * circumference)

const trendIcon = computed(() => {
  if (props.trend === 'up') return TrendingUp
  if (props.trend === 'down') return TrendingDown
  return Minus
})

const trendLabel = computed(() => {
  if (props.trend === 'up') return 'Melhorando'
  if (props.trend === 'down') return 'Piorando'
  return 'Estável'
})

const trendColor = computed(() => {
  if (props.trend === 'up') return 'text-success'
  if (props.trend === 'down') return 'text-danger'
  return 'text-muted-foreground'
})

// Find the lowest-scoring component for the tip
const lowestComponent = computed(() => {
  if (props.components.length === 0) return null
  return [...props.components].sort((a, b) => a.score - b.score)[0]
})

function barWidthPercent(component: ScoreComponent) {
  return Math.round((component.score / component.maxScore) * 100)
}

function barColor(component: ScoreComponent) {
  const pct = component.score / component.maxScore
  if (pct >= 0.7) return 'bg-success'
  if (pct >= 0.4) return 'bg-warning'
  return 'bg-danger'
}
</script>

<template>
  <div class="glass-surface overflow-hidden p-0">
    <div class="p-4 border-b border-border bg-muted !rounded-none !border-x-0 !border-t-0 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <DuAvatar size="xs" variant="primary" />
        <h3 class="text-micro text-muted-foreground font-semibold uppercase tracking-wider">Du Score</h3>
      </div>
      <div :class="['flex items-center gap-1 text-micro font-medium', trendColor]">
        <component :is="trendIcon" class="w-3.5 h-3.5" />
        {{ trendLabel }}
      </div>
    </div>

    <div class="p-4 space-y-4">
      <!-- Circular Gauge -->
      <div class="flex items-center gap-4">
        <div class="relative w-24 h-24 shrink-0">
          <svg class="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48" cy="48" :r="radius"
              fill="none" stroke-width="6" stroke-linecap="round"
              :class="trackColor"
            />
            <circle
              cx="48" cy="48" :r="radius"
              fill="none" stroke-width="6" stroke-linecap="round"
              :class="strokeColor"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              class="transition-all duration-700 ease-out"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span :class="['text-2xl font-black tabular-nums', scoreColor]">{{ score }}</span>
            <span class="text-[9px] text-muted-foreground font-medium uppercase">de 100</span>
          </div>
        </div>

        <!-- Component list -->
        <div class="flex-1 space-y-2 min-w-0">
          <div v-for="comp in components" :key="comp.name" class="space-y-0.5">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-medium text-muted-foreground truncate">{{ comp.name }}</span>
              <span class="text-[11px] font-bold tabular-nums">{{ comp.score }}/{{ comp.maxScore }}</span>
            </div>
            <div class="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                :class="['h-full rounded-full transition-all duration-500', barColor(comp)]"
                :style="{ width: `${barWidthPercent(comp)}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Tip for lowest component -->
      <div v-if="lowestComponent && lowestComponent.score < lowestComponent.maxScore" class="text-[11px] text-muted-foreground bg-muted px-3 py-2 rounded-lg leading-relaxed">
        <span class="font-semibold">Dica:</span> {{ lowestComponent.tip }}
      </div>
    </div>
  </div>
</template>
