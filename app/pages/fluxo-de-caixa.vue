<script setup lang="ts">
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/ui/PageHeader.vue'
import TierGatedPreview from '@/components/tier/TierGatedPreview.vue'

const { canUse } = useTier()
const hasAccess = computed(() => canUse('cashFlow'))

type Period = 'week' | 'month' | 'quarter' | 'year'

interface CashFlowBucket {
  label: string
  income: number
  spending: number
  net: number
}

const selectedPeriod = ref<Period>('month')

const periodOptions: Array<{ value: Period; label: string }> = [
  { value: 'week', label: 'Semanal' },
  { value: 'month', label: 'Mensal' },
  { value: 'quarter', label: 'Trimestral' },
  { value: 'year', label: 'Anual' },
]

// Compute date range based on selected period
const dateRange = computed(() => {
  const now = new Date()
  let startDate: Date
  let endDate: Date

  switch (selectedPeriod.value) {
    case 'week':
      // Last 12 weeks
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12 * 7)
      endDate = now
      break
    case 'month':
      // Last 12 months
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
      endDate = now
      break
    case 'quarter':
      // Last 8 quarters
      startDate = new Date(now.getFullYear() - 2, 0, 1)
      endDate = now
      break
    case 'year':
      // Last 3 years
      startDate = new Date(now.getFullYear() - 2, 0, 1)
      endDate = now
      break
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
})

const { data, status } = useFetch<CashFlowBucket[]>('/api/reports/cash-flow', {
  query: computed(() => ({
    period: selectedPeriod.value,
    startDate: dateRange.value.startDate,
    endDate: dateRange.value.endDate,
  })),
  watch: [selectedPeriod],
  default: () => [],
})

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function formatCompact(val: number): string {
  if (Math.abs(val) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 1,
      notation: 'compact',
    }).format(val)
  }
  return formatCurrency(val)
}

// Summary totals
const totals = computed(() => {
  const buckets = data.value || []
  const totalIncome = buckets.reduce((s, b) => s + b.income, 0)
  const totalSpending = buckets.reduce((s, b) => s + b.spending, 0)
  const totalNet = totalIncome - totalSpending
  return { totalIncome, totalSpending, totalNet }
})

// Chart dimensions
const chartWidth = 800
const chartHeight = 280
const chartPadding = { top: 30, right: 20, bottom: 50, left: 60 }

const innerWidth = chartWidth - chartPadding.left - chartPadding.right
const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom

// Chart scales and paths
const chartData = computed(() => {
  const buckets = data.value || []
  if (buckets.length === 0) return null

  const allValues = buckets.flatMap(b => [b.income, b.spending, b.net])
  const maxVal = Math.max(...allValues, 0)
  const minVal = Math.min(...allValues, 0)

  // Add 10% padding to y range
  const range = maxVal - minVal || 1
  const yMax = maxVal + range * 0.1
  const yMin = minVal - range * 0.1

  function xPos(i: number): number {
    if (buckets.length === 1) return chartPadding.left + innerWidth / 2
    return chartPadding.left + (i / (buckets.length - 1)) * innerWidth
  }

  function yPos(val: number): number {
    return chartPadding.top + ((yMax - val) / (yMax - yMin)) * innerHeight
  }

  function buildPath(values: number[]): string {
    return values
      .map((val, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(val).toFixed(1)}`)
      .join(' ')
  }

  function buildAreaPath(values: number[]): string {
    const linePart = values
      .map((val, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(val).toFixed(1)}`)
      .join(' ')
    const baseline = yPos(0)
    return `${linePart} L${xPos(values.length - 1).toFixed(1)},${baseline} L${xPos(0).toFixed(1)},${baseline} Z`
  }

  // Y-axis grid lines (5 lines)
  const yGridCount = 5
  const yGridLines = Array.from({ length: yGridCount }, (_, i) => {
    const val = yMin + ((yMax - yMin) * i) / (yGridCount - 1)
    return { y: yPos(val), value: val }
  })

  // Zero line
  const zeroY = yPos(0)
  const showZeroLine = yMin < 0

  return {
    incomePath: buildPath(buckets.map(b => b.income)),
    spendingPath: buildPath(buckets.map(b => b.spending)),
    netPath: buildPath(buckets.map(b => b.net)),
    netAreaPath: buildAreaPath(buckets.map(b => b.net)),
    incomePoints: buckets.map((b, i) => ({ x: xPos(i), y: yPos(b.income), value: b.income })),
    spendingPoints: buckets.map((b, i) => ({ x: xPos(i), y: yPos(b.spending), value: b.spending })),
    netPoints: buckets.map((b, i) => ({ x: xPos(i), y: yPos(b.net), value: b.net })),
    labels: buckets.map((b, i) => ({ x: xPos(i), label: b.label })),
    yGridLines,
    zeroY,
    showZeroLine,
  }
})

const hoveredIndex = ref<number | null>(null)
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 pb-24 lg:pb-8">
    <TierGatedPreview
      v-if="!hasAccess"
      feature="cashFlow"
      title="Fluxo de Caixa"
      description="Visualize a evolução das suas receitas e despesas ao longo do tempo com gráficos interativos."
      required-tier="plus"
    />

    <template v-else>
    <!-- Desktop Header -->
    <PageHeader
      title="Fluxo de Caixa"
      subtitle="Acompanhe a evolução das suas receitas e despesas ao longo do tempo."
      :icon="TrendingUp"
      class="hidden lg:flex"
    />

    <!-- Mobile Header -->
    <div class="lg:hidden space-y-4 mb-7">
      <div>
        <h1 class="text-h1">Fluxo de Caixa</h1>
        <p class="text-sm text-muted-foreground mt-1">Evolução de receitas e despesas.</p>
      </div>
    </div>

    <!-- Period Selector -->
    <div class="flex items-center gap-1.5 bg-muted/40 rounded-2xl p-1.5 mb-6">
      <Button
        v-for="opt in periodOptions"
        :key="opt.value"
        :variant="selectedPeriod === opt.value ? 'default' : 'ghost'"
        size="sm"
        class="flex-1 rounded-xl text-xs"
        @click="selectedPeriod = opt.value"
      >
        {{ opt.label }}
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="status === 'pending' && (!data || data.length === 0)" class="space-y-4">
      <div class="grid grid-cols-3 gap-3">
        <Card v-for="i in 3" :key="i" class="p-4">
          <Skeleton class="h-3 w-16 mb-3 rounded" />
          <Skeleton class="h-6 w-24 rounded" />
        </Card>
      </div>
      <Card class="p-6">
        <Skeleton class="h-[280px] rounded-xl" />
      </Card>
    </div>

    <template v-else-if="data && data.length > 0">
      <!-- Summary Cards -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <Card class="p-4 space-y-1">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <ArrowUpRight class="w-3.5 h-3.5 text-emerald-500" />
            <span>Receitas</span>
          </div>
          <p class="text-sm lg:text-base font-bold text-emerald-600 dark:text-emerald-400">
            {{ formatCurrency(totals.totalIncome) }}
          </p>
        </Card>

        <Card class="p-4 space-y-1">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <ArrowDownRight class="w-3.5 h-3.5 text-rose-500" />
            <span>Despesas</span>
          </div>
          <p class="text-sm lg:text-base font-bold text-rose-600 dark:text-rose-400">
            {{ formatCurrency(totals.totalSpending) }}
          </p>
        </Card>

        <Card class="p-4 space-y-1">
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <TrendingUp class="w-3.5 h-3.5" :class="totals.totalNet >= 0 ? 'text-emerald-500' : 'text-rose-500'" />
            <span>Saldo</span>
          </div>
          <p
            class="text-sm lg:text-base font-bold"
            :class="totals.totalNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
          >
            {{ formatCurrency(totals.totalNet) }}
          </p>
        </Card>
      </div>

      <!-- Chart -->
      <Card class="p-4 lg:p-6">
        <!-- Legend -->
        <div class="flex items-center gap-4 mb-4 text-xs font-medium">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-[3px] rounded-full bg-emerald-500" />
            <span class="text-muted-foreground">Receitas</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-[3px] rounded-full bg-rose-500" />
            <span class="text-muted-foreground">Despesas</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-[3px] rounded-full bg-primary" />
            <span class="text-muted-foreground">Saldo</span>
          </div>
        </div>

        <div class="w-full overflow-x-auto">
          <svg
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            class="w-full h-auto min-w-[500px]"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="hsl(var(--primary))" stop-opacity="0.15" />
                <stop offset="100%" stop-color="hsl(var(--primary))" stop-opacity="0.02" />
              </linearGradient>
            </defs>

            <!-- Y-axis grid lines -->
            <template v-if="chartData">
              <g v-for="(gl, gi) in chartData.yGridLines" :key="gi">
                <line
                  :x1="chartPadding.left"
                  :y1="gl.y"
                  :x2="chartWidth - chartPadding.right"
                  :y2="gl.y"
                  stroke="currentColor"
                  class="text-border"
                  stroke-width="1"
                  stroke-dasharray="4 4"
                  opacity="0.4"
                />
                <text
                  :x="chartPadding.left - 8"
                  :y="gl.y + 4"
                  text-anchor="end"
                  class="fill-muted-foreground"
                  font-size="10"
                >
                  {{ formatCompact(gl.value) }}
                </text>
              </g>

              <!-- Zero line -->
              <line
                v-if="chartData.showZeroLine"
                :x1="chartPadding.left"
                :y1="chartData.zeroY"
                :x2="chartWidth - chartPadding.right"
                :y2="chartData.zeroY"
                stroke="currentColor"
                class="text-muted-foreground"
                stroke-width="1"
                opacity="0.3"
              />

              <!-- Net area fill -->
              <path
                :d="chartData.netAreaPath"
                fill="url(#netGradient)"
              />

              <!-- Income line -->
              <path
                :d="chartData.incomePath"
                fill="none"
                class="stroke-emerald-500"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Spending line -->
              <path
                :d="chartData.spendingPath"
                fill="none"
                class="stroke-rose-500"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Net line -->
              <path
                :d="chartData.netPath"
                fill="none"
                stroke="hsl(var(--primary))"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Data points - Income -->
              <circle
                v-for="(pt, pi) in chartData.incomePoints"
                :key="`inc-${pi}`"
                :cx="pt.x"
                :cy="pt.y"
                :r="hoveredIndex === pi ? 5 : 3"
                class="fill-emerald-500"
                stroke="hsl(var(--card))"
                stroke-width="2"
              />

              <!-- Data points - Spending -->
              <circle
                v-for="(pt, pi) in chartData.spendingPoints"
                :key="`spend-${pi}`"
                :cx="pt.x"
                :cy="pt.y"
                :r="hoveredIndex === pi ? 5 : 3"
                class="fill-rose-500"
                stroke="hsl(var(--card))"
                stroke-width="2"
              />

              <!-- Data points - Net -->
              <circle
                v-for="(pt, pi) in chartData.netPoints"
                :key="`net-${pi}`"
                :cx="pt.x"
                :cy="pt.y"
                :r="hoveredIndex === pi ? 5 : 3"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--card))"
                stroke-width="2"
              />

              <!-- X-axis labels -->
              <text
                v-for="(lbl, li) in chartData.labels"
                :key="`lbl-${li}`"
                :x="lbl.x"
                :y="chartHeight - 10"
                text-anchor="middle"
                class="fill-muted-foreground"
                font-size="10"
                :font-weight="hoveredIndex === li ? 600 : 400"
              >
                {{ lbl.label }}
              </text>

              <!-- Hover zones (invisible rects for interaction) -->
              <rect
                v-for="(_lbl, li) in chartData.labels"
                :key="`hover-${li}`"
                :x="li === 0 ? chartPadding.left : (chartData.labels[li - 1].x + chartData.labels[li].x) / 2"
                :y="chartPadding.top"
                :width="chartData.labels.length === 1 ? innerWidth : (li === 0 || li === chartData.labels.length - 1 ? innerWidth / (2 * (chartData.labels.length - 1)) + innerWidth / (2 * (chartData.labels.length - 1)) : innerWidth / (chartData.labels.length - 1))"
                :height="innerHeight"
                fill="transparent"
                class="cursor-pointer"
                @mouseenter="hoveredIndex = li"
                @mouseleave="hoveredIndex = null"
              />

              <!-- Hover tooltip -->
              <g v-if="hoveredIndex !== null && chartData.netPoints[hoveredIndex]">
                <!-- Vertical guide line -->
                <line
                  :x1="chartData.netPoints[hoveredIndex].x"
                  :y1="chartPadding.top"
                  :x2="chartData.netPoints[hoveredIndex].x"
                  :y2="chartHeight - chartPadding.bottom"
                  stroke="currentColor"
                  class="text-muted-foreground"
                  stroke-width="1"
                  stroke-dasharray="3 3"
                  opacity="0.4"
                />
              </g>
            </template>
          </svg>
        </div>

        <!-- Hover detail (below chart) -->
        <div
          v-if="hoveredIndex !== null && data && data[hoveredIndex]"
          class="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs"
        >
          <span class="font-semibold text-foreground">{{ data[hoveredIndex].label }}</span>
          <div class="flex items-center gap-4">
            <span class="text-emerald-600 dark:text-emerald-400">
              {{ formatCurrency(data[hoveredIndex].income) }}
            </span>
            <span class="text-rose-600 dark:text-rose-400">
              {{ formatCurrency(data[hoveredIndex].spending) }}
            </span>
            <span
              class="font-semibold"
              :class="data[hoveredIndex].net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
            >
              {{ formatCurrency(data[hoveredIndex].net) }}
            </span>
          </div>
        </div>
      </Card>

      <!-- Period detail table -->
      <Card class="mt-4 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border/50">
                <th class="text-left p-3 pl-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Período
                </th>
                <th class="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Receitas
                </th>
                <th class="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Despesas
                </th>
                <th class="text-right p-3 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(bucket, bi) in data"
                :key="bi"
                class="border-b border-border/30 last:border-0 transition-colors hover:bg-muted/30"
                :class="{ 'bg-muted/20': hoveredIndex === bi }"
                @mouseenter="hoveredIndex = bi"
                @mouseleave="hoveredIndex = null"
              >
                <td class="p-3 pl-4 font-medium">{{ bucket.label }}</td>
                <td class="p-3 text-right text-emerald-600 dark:text-emerald-400">
                  {{ formatCurrency(bucket.income) }}
                </td>
                <td class="p-3 text-right text-rose-600 dark:text-rose-400">
                  {{ formatCurrency(bucket.spending) }}
                </td>
                <td
                  class="p-3 pr-4 text-right font-semibold"
                  :class="bucket.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
                >
                  {{ formatCurrency(bucket.net) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </template>

    <!-- Empty state -->
    <Card v-else class="p-8 text-center space-y-4">
      <TrendingUp class="w-12 h-12 mx-auto text-muted-foreground/40" />
      <div>
        <h2 class="text-lg font-semibold">Sem dados de fluxo de caixa</h2>
        <p class="text-sm text-muted-foreground mt-1">
          Adicione receitas e despesas para visualizar o fluxo de caixa ao longo do tempo.
        </p>
      </div>
    </Card>
    </template>
  </div>
</template>
