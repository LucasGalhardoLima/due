<script setup lang="ts">
import { ref, computed } from 'vue'
import { scaleBand, scaleLinear } from 'd3-scale'
import { TrendingUp } from 'lucide-vue-next'
import { useResizeObserver } from '@vueuse/core'

const { health } = useInstallments()

const container = ref<HTMLElement | null>(null)
const width = ref(600)
const height = 300
const margin = { top: 20, right: 0, bottom: 30, left: 0 }

// Responsive width
useResizeObserver(container, (entries: ResizeObserverEntry[]) => {
  const entry = entries[0]
  if (entry) {
    width.value = entry.contentRect.width
  }
})

const data = computed(() => {
  return health.value?.limitReleaseProjection?.slice(0, 12) || []
})

// Scales
const xScale = computed(() => {
  return scaleBand()
    .domain(data.value.map(d => d.label))
    .range([margin.left, width.value - margin.right])
    .padding(0.3)
})

const yScale = computed(() => {
  const maxValue = Math.max(...data.value.map(d => d.releasedAmount), 100)
  return scaleLinear()
    .domain([0, maxValue * 1.1]) // Add some headroom
    .range([height - margin.bottom, margin.top])
})

const formatCurrency = (val: number) => {
  if (val >= 1000) return `${(val/1000).toFixed(1)}k`
  return val.toFixed(0)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center gap-2 mb-6">
      <div class="p-2 bg-success/10 rounded-lg">
        <TrendingUp class="w-5 h-5 text-success" />
      </div>
      <div>
        <h3 class="font-bold text-lg">Liberação de Limite</h3>
        <p class="text-xs text-muted-foreground">Quanto do seu limite voltará a ficar disponível</p>
      </div>
    </div>

    <div ref="container" class="flex-1 min-h-[250px] relative w-full">
      <svg :viewBox="`0 0 ${width} ${height}`" class="w-full h-full overflow-visible">
        <!-- Bars -->
        <g v-for="d in (data as any[])" :key="d.label">
          <rect
            :x="xScale(d.label)"
            :y="yScale(d.releasedAmount)"
            :width="xScale.bandwidth()"
            :height="height - margin.bottom - yScale(d.releasedAmount)"
            class="fill-success/80 hover:fill-success transition-all duration-300 rounded"
            rx="4"
          />
          
          <!-- Value Label -->
          <text
            v-if="d.releasedAmount > 0"
            :x="xScale(d.label)! + xScale.bandwidth() / 2"
            :y="yScale(d.releasedAmount) - 6"
            text-anchor="middle"
            class="text-[10px] fill-muted-foreground font-medium"
          >
            {{ formatCurrency(d.releasedAmount) }}
          </text>
        </g>

        <!-- X Axis Labels -->
        <g v-for="d in (data as any[])" :key="d.label + 'lbl'">
          <text
            :x="xScale(d.label)! + xScale.bandwidth() / 2"
            :y="height - 5"
            text-anchor="middle"
            class="text-[10px] fill-muted-foreground"
          >
            {{ d.label }}
          </text>
        </g>
      </svg>
      
      <div v-if="data.length === 0" class="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
        Sem dados para projeção.
      </div>
    </div>
  </div>
</template>
