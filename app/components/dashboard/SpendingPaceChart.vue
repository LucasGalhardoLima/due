<script setup lang="ts">
import { Activity } from 'lucide-vue-next'

interface DataPoint {
  date: string
  day: number
  actual: number
  ideal: number
  daily: number
}

const props = defineProps<{
  month: number
  year: number
}>()

const { dataVersion } = useDataVersion()

const { data } = useFetch<{
  totalBudget: number
  totalSpent: number
  dataPoints: DataPoint[]
}>('/api/budget/spending-pace', {
  query: computed(() => ({
    month: props.month,
    year: props.year,
  })),
  watch: [() => props.month, () => props.year, dataVersion],
})

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

// SVG chart dimensions
const width = 320
const height = 140
const padding = { top: 10, right: 10, bottom: 20, left: 10 }

const chartWidth = width - padding.left - padding.right
const chartHeight = height - padding.top - padding.bottom

// Today's index (0-based day of month)
const todayIndex = computed(() => {
  const now = new Date()
  if (now.getMonth() + 1 === props.month && now.getFullYear() === props.year) {
    return now.getDate() - 1
  }
  return data.value?.dataPoints ? data.value.dataPoints.length - 1 : 0
})

const maxVal = computed(() => {
  if (!data.value?.dataPoints?.length) return 100
  const allValues = data.value.dataPoints.flatMap(d => [d.actual, d.ideal])
  return Math.max(...allValues, 1) * 1.1
})

function scaleX(index: number, total: number) {
  return padding.left + (index / Math.max(total - 1, 1)) * chartWidth
}

function scaleY(value: number) {
  return padding.top + chartHeight - (value / maxVal.value) * chartHeight
}

// Build SVG path from data points
function buildPath(points: DataPoint[], key: 'actual' | 'ideal', upToIndex?: number) {
  const limit = upToIndex !== undefined ? upToIndex + 1 : points.length
  const slice = points.slice(0, limit)
  if (slice.length === 0) return ''

  return slice
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i, points.length)} ${scaleY(p[key])}`)
    .join(' ')
}

const isOverBudget = computed(() => {
  if (!data.value) return false
  return data.value.totalSpent > data.value.totalBudget && data.value.totalBudget > 0
})

const paceStatus = computed(() => {
  if (!data.value?.dataPoints?.length || data.value.totalBudget === 0) return 'neutral'
  const current = data.value.dataPoints[todayIndex.value]
  if (!current) return 'neutral'
  if (current.actual > current.ideal * 1.1) return 'over'
  if (current.actual < current.ideal * 0.9) return 'under'
  return 'on-track'
})
</script>

<template>
  <div class="glass-surface p-5">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-xl" :class="{
          'bg-danger/10': paceStatus === 'over',
          'bg-success/10': paceStatus === 'under',
          'bg-primary/10': paceStatus === 'on-track' || paceStatus === 'neutral',
        }">
          <Activity class="w-4 h-4" :class="{
            'text-danger': paceStatus === 'over',
            'text-success': paceStatus === 'under',
            'text-primary-accent': paceStatus === 'on-track' || paceStatus === 'neutral',
          }" />
        </div>
        <p class="text-micro text-muted-foreground font-medium">Ritmo de Gastos</p>
      </div>
      <NuxtLink to="/orcamento" class="text-micro text-primary-accent hover:underline font-medium">
        Detalhes
      </NuxtLink>
    </div>

    <template v-if="data && data.dataPoints.length > 0">
      <!-- Mini summary -->
      <div class="flex items-center gap-3 mb-3">
        <p class="text-lg font-black tabular-nums" :class="isOverBudget ? 'text-danger' : ''">
          {{ formatCurrency(data.totalSpent) }}
        </p>
        <span v-if="data.totalBudget > 0" class="text-micro text-muted-foreground">
          / {{ formatCurrency(data.totalBudget) }}
        </span>
      </div>

      <!-- SVG Chart -->
      <svg :viewBox="`0 0 ${width} ${height}`" class="w-full max-h-[180px]">
        <!-- Ideal pace line (dashed) -->
        <path
          :d="buildPath(data.dataPoints, 'ideal')"
          fill="none"
          stroke="currentColor"
          class="text-muted-foreground/30"
          stroke-width="1.5"
          stroke-dasharray="4 3"
        />

        <!-- Actual spending line -->
        <path
          :d="buildPath(data.dataPoints, 'actual', todayIndex)"
          fill="none"
          stroke="currentColor"
          :class="paceStatus === 'over' ? 'text-danger' : 'text-primary-accent'"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Current day dot -->
        <circle
          v-if="data.dataPoints[todayIndex]"
          :cx="scaleX(todayIndex, data.dataPoints.length)"
          :cy="scaleY(data.dataPoints[todayIndex].actual)"
          r="3.5"
          fill="currentColor"
          :class="paceStatus === 'over' ? 'text-danger' : 'text-primary-accent'"
        />
      </svg>

      <!-- Legend -->
      <div class="flex items-center gap-4 mt-2">
        <span class="flex items-center gap-1.5 text-micro text-muted-foreground">
          <span class="w-3 h-0.5 rounded-full" :class="paceStatus === 'over' ? 'bg-danger' : 'bg-primary'" />
          Gasto real
        </span>
        <span class="flex items-center gap-1.5 text-micro text-muted-foreground">
          <span class="w-3 h-0.5 rounded-full bg-muted-foreground/30 border-dashed" />
          Ritmo ideal
        </span>
      </div>
    </template>

    <div v-else class="text-small text-muted-foreground text-center py-6">
      Sem dados de gastos neste mês.
    </div>
  </div>
</template>
