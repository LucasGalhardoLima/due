<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { CreditCard, TrendingUp, TrendingDown, Minus, Unlock, ShoppingBag, Utensils, Car, Home } from 'lucide-vue-next'

const props = defineProps<{
  total: number
  limit: number
  budget?: number
  usagePercentage: number
  topCategory?: { name: string; amount: number; color?: string }
  endingSoon?: { totalFreeing: number; count: number }
  previousTotal?: number | null
}>()

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

// Color state based on usage percentage
const colorState = computed(() => {
  const pct = props.usagePercentage
  if (pct >= 90) return 'danger'
  if (pct >= 70) return 'warning'
  return 'safe'
})

const invoiceGradient = computed(() => {
  switch (colorState.value) {
    case 'danger':
      return 'bg-danger/[0.12] dark:bg-danger/[0.08] border-danger/20'
    case 'warning':
      return 'bg-warning/[0.12] dark:bg-warning/[0.08] border-warning/20'
    default:
      return 'bg-card border-border shadow-sm'
  }
})

// Month-over-month trend (inline in fatura card)
const trend = computed(() => {
  if (props.previousTotal == null || props.previousTotal === 0) return null
  const delta = props.total - props.previousTotal
  const pct = (delta / props.previousTotal) * 100
  return {
    delta,
    pct,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat' as 'up' | 'down' | 'flat',
  }
})

const trendColor = computed(() => {
  if (!trend.value) return 'text-muted-foreground'
  return trend.value.direction === 'up' ? 'text-danger' : trend.value.direction === 'down' ? 'text-success' : 'text-muted-foreground'
})

const freeingText = computed(() => {
  if (!props.endingSoon || props.endingSoon.count === 0) return 'Nenhum'
  return `${props.endingSoon.count} parcelamento${props.endingSoon.count > 1 ? 's' : ''}`
})

// Category icon mapping
const categoryIcons: Record<string, Component> = {
  'Alimentação': Utensils,
  'Transporte': Car,
  'Casa': Home,
  'Outros': ShoppingBag
}

const categoryIcon = computed(() => {
  return categoryIcons[props.topCategory?.name || ''] || ShoppingBag
})

const shouldPulse = computed(() => colorState.value === 'danger')
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
    <!-- Card 1: Fatura (with trend + progress bar) -->
    <div
      class="relative overflow-hidden rounded-3xl p-6 border transition-all hover:scale-[1.01] group min-h-[176px]"
      :class="[invoiceGradient, { 'motion-safe:animate-pulse ring-1 ring-danger/50': shouldPulse }]"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="p-2 rounded-2xl bg-muted">
            <CreditCard class="w-5 h-5 text-primary" :class="{ 'text-danger': colorState === 'danger', 'text-warning': colorState === 'warning' }" />
          </div>
          <div v-if="colorState === 'danger'" class="px-2 py-0.5 bg-danger/10 border border-danger/20 rounded-full text-micro text-danger">
            Alerta
          </div>
        </div>
        <div>
          <p class="text-micro text-muted-foreground">Fatura Atual</p>
          <p class="text-stat text-foreground mt-1.5">{{ formatCurrency(total) }}</p>

          <!-- Inline trend badge -->
          <div v-if="trend" class="flex items-center gap-1.5 mt-2">
            <component
              :is="trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus"
              class="w-3.5 h-3.5"
              :class="trendColor"
            />
            <span class="text-small font-medium tabular-nums" :class="trendColor">
              {{ trend.pct > 0 ? '+' : '' }}{{ trend.pct.toFixed(0) }}% vs anterior
            </span>
          </div>

          <!-- Progress bar -->
          <div class="mt-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-small text-muted-foreground tabular-nums">{{ usagePercentage.toFixed(0) }}% do limite</span>
            </div>
            <div class="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000 shadow-sm"
                :class="colorState === 'danger' ? 'bg-danger' : colorState === 'warning' ? 'bg-warning' : 'bg-primary'"
                :style="{ width: `${Math.min(usagePercentage, 100)}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: Libera em Breve -->
    <div
      class="relative overflow-hidden rounded-3xl p-6 border transition-all hover:scale-[1.01] group min-h-[176px]"
      :class="endingSoon && endingSoon.count > 0 ? 'bg-success/[0.06] dark:bg-success/[0.04] border-success/20' : 'bg-card border-border shadow-sm'"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="p-2 rounded-2xl bg-muted">
            <Unlock class="w-5 h-5 text-success" />
          </div>
          <div v-if="endingSoon && endingSoon.count > 0" class="px-2 py-0.5 bg-success/10 border border-success/20 rounded-full text-micro text-success">
            Em breve
          </div>
        </div>
        <div>
          <p class="text-micro text-muted-foreground">Libera em Breve</p>
          <p class="text-stat text-foreground mt-1.5">{{ endingSoon ? formatCurrency(endingSoon.totalFreeing) : 'R$ 0' }}</p>
          <p class="text-small text-muted-foreground mt-1.5">{{ freeingText }} encerram</p>
        </div>
      </div>
    </div>

    <!-- Card 3: Top Category -->
    <div
      class="relative overflow-hidden rounded-3xl p-6 border border-border bg-card shadow-sm transition-all hover:scale-[1.01] group min-h-[176px]"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="p-2 rounded-2xl bg-muted">
            <component :is="categoryIcon" class="w-5 h-5 text-primary" />
          </div>
        </div>
        <div>
          <p class="text-micro text-muted-foreground">Maior Gasto</p>
          <p class="text-xl md:text-2xl lg:text-3xl font-black text-foreground mt-1.5 truncate">{{ topCategory?.name || '---' }}</p>
          <p class="text-small font-black text-muted-foreground mt-1.5 tabular-nums">
            {{ topCategory ? formatCurrency(topCategory.amount) : 'Sem gastos' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
