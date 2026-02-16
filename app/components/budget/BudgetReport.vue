<script setup lang="ts">
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'

interface ReportData {
  current: {
    month: number
    year: number
    totalIncome: number
    totalSpending: number
    remaining: number
    savingsRate: number
  }
  previous: {
    month: number
    year: number
    totalIncome: number
    totalSpending: number
    remaining: number
    savingsRate: number
  } | null
  trends: {
    incomeChange: number
    spendingChange: number
    savingsRateChange: number
  } | null
  categoryComparison: Array<{
    categoryId: string
    categoryName: string
    currentSpending: number
    previousSpending: number | null
    budgetLimit: number | null
    trend: 'up' | 'down' | 'stable' | 'new'
    changePercent: number | null
  }>
}

defineProps<{
  report: ReportData
}>()

const isExpanded = ref(false)

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'up': return TrendingUp
    case 'down': return TrendingDown
    default: return Minus
  }
}

function getTrendColor(trend: string, inverted = false) {
  // For spending, "up" is bad (red), "down" is good (green)
  if (inverted) {
    return trend === 'up' ? 'text-destructive' : trend === 'down' ? 'text-success' : 'text-muted-foreground'
  }
  return trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
}
</script>

<template>
  <div class="space-y-3">
    <button
      class="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground uppercase tracking-wider"
      @click="isExpanded = !isExpanded"
    >
      <span>Relatório mensal</span>
      <ChevronDown v-if="!isExpanded" class="w-4 h-4" />
      <ChevronUp v-else class="w-4 h-4" />
    </button>

    <template v-if="isExpanded">
      <!-- Trend Summary Cards -->
      <div v-if="report.trends" class="grid grid-cols-3 gap-2">
        <Card class="p-3 text-center space-y-1">
          <p class="text-[10px] text-muted-foreground uppercase">Receita</p>
          <div class="flex items-center justify-center gap-1" :class="getTrendColor(report.trends.incomeChange > 0 ? 'up' : report.trends.incomeChange < 0 ? 'down' : 'stable')">
            <component :is="getTrendIcon(report.trends.incomeChange > 0 ? 'up' : report.trends.incomeChange < 0 ? 'down' : 'stable')" class="w-3 h-3" />
            <span class="text-xs font-semibold">{{ report.trends.incomeChange }}%</span>
          </div>
        </Card>
        <Card class="p-3 text-center space-y-1">
          <p class="text-[10px] text-muted-foreground uppercase">Despesas</p>
          <div class="flex items-center justify-center gap-1" :class="getTrendColor(report.trends.spendingChange > 0 ? 'up' : report.trends.spendingChange < 0 ? 'down' : 'stable', true)">
            <component :is="getTrendIcon(report.trends.spendingChange > 0 ? 'up' : report.trends.spendingChange < 0 ? 'down' : 'stable')" class="w-3 h-3" />
            <span class="text-xs font-semibold">{{ report.trends.spendingChange }}%</span>
          </div>
        </Card>
        <Card class="p-3 text-center space-y-1">
          <p class="text-[10px] text-muted-foreground uppercase">Poupança</p>
          <div class="flex items-center justify-center gap-1" :class="getTrendColor(report.trends.savingsRateChange > 0 ? 'up' : report.trends.savingsRateChange < 0 ? 'down' : 'stable')">
            <component :is="getTrendIcon(report.trends.savingsRateChange > 0 ? 'up' : report.trends.savingsRateChange < 0 ? 'down' : 'stable')" class="w-3 h-3" />
            <span class="text-xs font-semibold">{{ report.trends.savingsRateChange > 0 ? '+' : '' }}{{ report.trends.savingsRateChange }}pp</span>
          </div>
        </Card>
      </div>

      <p v-else class="text-xs text-muted-foreground italic">
        Sem dados do mês anterior para comparação.
      </p>

      <!-- Category Comparison -->
      <Card v-if="report.categoryComparison.length > 0" class="divide-y divide-border/50">
        <div
          v-for="cat in report.categoryComparison"
          :key="cat.categoryId"
          class="flex items-center justify-between px-4 py-3"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-sm truncate">{{ cat.categoryName }}</span>
            <span
              v-if="cat.budgetLimit && cat.currentSpending > cat.budgetLimit"
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive shrink-0"
            >
              Acima
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs font-medium">{{ formatCurrency(cat.currentSpending) }}</span>
            <div v-if="cat.trend !== 'new' && cat.changePercent !== null" class="flex items-center gap-0.5" :class="getTrendColor(cat.trend, true)">
              <component :is="getTrendIcon(cat.trend)" class="w-3 h-3" />
              <span class="text-[10px] font-semibold">{{ cat.changePercent }}%</span>
            </div>
            <span v-else-if="cat.trend === 'new'" class="text-[10px] text-muted-foreground">Novo</span>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
