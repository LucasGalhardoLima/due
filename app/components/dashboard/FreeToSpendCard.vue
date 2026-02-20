<script setup lang="ts">
import { Wallet, TrendingDown, TrendingUp } from 'lucide-vue-next'

const props = defineProps<{
  totalIncome: number
  totalSpending: number
  remaining: number
  savingsRate: number
}>()

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

const colorState = computed(() => {
  if (props.remaining < 0) return 'danger'
  if (props.savingsRate < 10) return 'warning'
  return 'safe'
})

const gradientClass = computed(() => {
  switch (colorState.value) {
    case 'danger':
      return 'bg-danger-muted border-danger/20'
    case 'warning':
      return 'bg-warning-muted border-warning/20'
    default:
      return 'bg-[linear-gradient(145deg,hsl(var(--primary)/0.65),hsl(var(--mint-600)/0.24))] dark:bg-[linear-gradient(145deg,hsl(var(--primary)/0.42),hsl(var(--mint-700)/0.34))] border-primary/45'
  }
})

const trendIcon = computed(() => props.remaining >= 0 ? TrendingUp : TrendingDown)
</script>

<template>
  <div
    class="relative overflow-hidden rounded-3xl p-6 border shadow-elevation-2 transition-all hover:scale-[1.005] group"
    :class="gradientClass"
  >
    <!-- Decorative blur -->
    <div class="absolute -right-12 -bottom-12 w-40 h-40 bg-background/40 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

    <div class="relative z-10">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-2xl bg-card/80 border border-border/65 shadow-elevation-1">
            <Wallet class="w-5 h-5 text-primary-foreground dark:text-primary" :class="{ 'text-danger': colorState === 'danger', 'text-warning': colorState === 'warning' }" />
          </div>
          <div>
            <p class="text-micro text-muted-foreground font-medium">Livre para Gastar</p>
            <p class="text-xs text-muted-foreground/70">Este mês</p>
          </div>
        </div>
        <div
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-micro font-bold"
          :class="{
            'bg-danger/10 border border-danger/20 text-danger': colorState === 'danger',
            'bg-warning/10 border border-warning/20 text-warning': colorState === 'warning',
            'bg-success/10 border border-success/20 text-success': colorState === 'safe',
          }"
        >
          <component :is="trendIcon" class="w-3 h-3" />
          <span>{{ savingsRate }}%</span>
        </div>
      </div>

      <p class="text-3xl md:text-4xl font-black tabular-nums tracking-tight" :class="{ 'text-danger': colorState === 'danger' }">
        {{ formatCurrency(remaining) }}
      </p>

      <div class="flex items-center gap-4 mt-3 text-small text-muted-foreground">
        <span class="flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-success/60" />
          Receita: {{ formatCurrency(totalIncome) }}
        </span>
        <span class="flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-danger/60" />
          Gasto: {{ formatCurrency(totalSpending) }}
        </span>
      </div>
    </div>
  </div>
</template>
