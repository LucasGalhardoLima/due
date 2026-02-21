<script setup lang="ts">
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-vue-next'

const props = defineProps<{
  totalIncome: number
  totalSpending: number
  remaining: number
  previousRemaining?: number | null
}>()

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

const formatDelta = (val: number) => {
  const prefix = val > 0 ? '+' : ''
  return prefix + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const delta = computed(() => {
  if (props.previousRemaining == null) return null
  return props.remaining - props.previousRemaining
})

const deltaPercent = computed(() => {
  if (delta.value == null || props.previousRemaining == null || props.previousRemaining === 0) return null
  return Math.round((delta.value / Math.abs(props.previousRemaining)) * 100)
})

const deltaState = computed(() => {
  if (delta.value == null) return 'neutral'
  if (delta.value > 0) return 'positive'
  if (delta.value < 0) return 'negative'
  return 'neutral'
})

const deltaIcon = computed(() => {
  if (deltaState.value === 'positive') return ArrowUpRight
  if (deltaState.value === 'negative') return ArrowDownRight
  return Minus
})

// Bar proportions
const total = computed(() => props.totalIncome || 1)
const incomeWidth = computed(() => '100%')
const spendingWidth = computed(() => `${Math.min((props.totalSpending / total.value) * 100, 100)}%`)
</script>

<template>
  <div class="glass-surface p-5">
    <div class="flex items-center justify-between mb-3">
      <p class="text-micro text-muted-foreground font-medium">Saldo do Mês</p>
      <!-- Delta badge -->
      <div
        v-if="delta != null"
        class="flex items-center gap-1 px-2 py-0.5 rounded-full text-micro font-bold"
        :class="{
          'bg-success/10 text-success': deltaState === 'positive',
          'bg-danger/10 text-danger': deltaState === 'negative',
          'bg-muted text-muted-foreground': deltaState === 'neutral',
        }"
      >
        <component :is="deltaIcon" class="w-3 h-3" />
        <span v-if="deltaPercent != null">{{ deltaPercent > 0 ? '+' : '' }}{{ deltaPercent }}%</span>
      </div>
    </div>

    <p class="text-2xl font-black tabular-nums" :class="remaining < 0 ? 'text-danger' : 'text-foreground'">
      {{ formatCurrency(remaining) }}
    </p>

    <!-- Stacked bar -->
    <div class="mt-4 space-y-2">
      <div class="flex items-center justify-between text-micro text-muted-foreground">
        <span>Receita</span>
        <span class="font-semibold tabular-nums">{{ formatCurrency(totalIncome) }}</span>
      </div>
      <div class="h-2 w-full bg-success/[0.15] dark:bg-success/[0.10] rounded-full overflow-hidden">
        <div class="h-full bg-success rounded-full" :style="{ width: incomeWidth }" />
      </div>

      <div class="flex items-center justify-between text-micro text-muted-foreground">
        <span>Gastos</span>
        <span class="font-semibold tabular-nums">{{ formatCurrency(totalSpending) }}</span>
      </div>
      <div class="h-2 w-full bg-danger/[0.15] dark:bg-danger/[0.10] rounded-full overflow-hidden">
        <div class="h-full bg-danger/70 rounded-full transition-all duration-500" :style="{ width: spendingWidth }" />
      </div>
    </div>

    <div v-if="delta != null" class="mt-3 pt-3 border-t border-border/50">
      <p class="text-micro text-muted-foreground">
        vs mês anterior:
        <span class="font-bold" :class="{ 'text-success': deltaState === 'positive', 'text-danger': deltaState === 'negative' }">
          {{ formatDelta(delta) }}
        </span>
      </p>
    </div>
  </div>
</template>
