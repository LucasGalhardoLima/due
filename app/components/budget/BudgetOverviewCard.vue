<script setup lang="ts">
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'

const props = defineProps<{
  totalIncome: number
  totalSpending: number
  remaining: number
  savingsRate: number
}>()

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const statusVariant = computed(() => {
  if (props.remaining > 0) return 'success'
  if (props.remaining < 0) return 'danger'
  return 'default'
})

const utilizationPercent = computed(() => {
  if (props.totalIncome <= 0) return 0
  return Math.min(Math.round((props.totalSpending / props.totalIncome) * 100), 100)
})
</script>

<template>
  <Card :variant="statusVariant" class="p-5 space-y-4">
    <!-- Main Balance -->
    <div class="flex items-start justify-between">
      <div>
        <p class="text-xs text-muted-foreground font-medium uppercase tracking-wider">Saldo disponível</p>
        <p class="text-2xl font-bold mt-1" :class="remaining >= 0 ? 'text-success' : 'text-destructive'">
          {{ formatCurrency(remaining) }}
        </p>
      </div>
      <div class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
        :class="savingsRate >= 0
          ? 'bg-success/10 text-success'
          : 'bg-destructive/10 text-destructive'"
      >
        <TrendingUp v-if="savingsRate > 0" class="w-3 h-3" />
        <TrendingDown v-else-if="savingsRate < 0" class="w-3 h-3" />
        <Minus v-else class="w-3 h-3" />
        {{ savingsRate }}%
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="space-y-1.5">
      <div class="flex justify-between text-xs text-muted-foreground">
        <span>Utilização</span>
        <span>{{ utilizationPercent }}%</span>
      </div>
      <div class="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          :class="utilizationPercent > 100
            ? 'bg-destructive'
            : utilizationPercent >= 80
              ? 'bg-warning'
              : 'bg-primary'"
          :style="{ width: `${Math.min(utilizationPercent, 100)}%` }"
        />
      </div>
    </div>

    <!-- Income vs Spending -->
    <div class="grid grid-cols-2 gap-3 pt-1">
      <div class="space-y-0.5">
        <p class="text-[11px] text-muted-foreground">Receita</p>
        <p class="text-sm font-semibold text-success">{{ formatCurrency(totalIncome) }}</p>
      </div>
      <div class="space-y-0.5 text-right">
        <p class="text-[11px] text-muted-foreground">Despesas</p>
        <p class="text-sm font-semibold text-destructive">{{ formatCurrency(totalSpending) }}</p>
      </div>
    </div>
  </Card>
</template>
