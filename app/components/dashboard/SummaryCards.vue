<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { CreditCard, TrendingUp, Calendar, ShoppingBag, Utensils, Car, Home } from 'lucide-vue-next'

const props = defineProps<{
  total: number
  limit: number
  budget?: number
  usagePercentage: number
  daysToDue: number | null
  status?: string
  topCategory?: { name: string; amount: number; color?: string }
}>()

const emit = defineEmits(['pay'])

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

// Background classes for each state
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

const limitGradient = computed(() => {
  switch (colorState.value) {
    case 'danger':
      return 'bg-danger/[0.12] dark:bg-danger/[0.08] border-danger/20'
    case 'warning':
      return 'bg-warning/[0.12] dark:bg-warning/[0.08] border-warning/20'
    default:
      return 'bg-card border-border shadow-sm'
  }
})

const dueGradient = computed(() => {
  if (props.status === 'PAID') {
    return 'bg-success/[0.12] dark:bg-success/[0.08] border-success/20'
  }
  switch (dueColorState.value) {
    case 'danger':
      return 'bg-danger/[0.12] dark:bg-danger/[0.08] border-danger/20'
    case 'warning':
      return 'bg-warning/[0.12] dark:bg-warning/[0.08] border-warning/20'
    default:
      return 'bg-card border-border shadow-sm'
  }
})

// Due date color state
const dueColorState = computed(() => {
  if (props.status === 'PAID') return 'safe'
  if (props.daysToDue === null) return 'safe'
  if (props.daysToDue <= 2) return 'danger'
  if (props.daysToDue <= 7) return 'warning'
  return 'safe'
})

const dueText = computed(() => {
  if (props.daysToDue === null) return 'Sem data'
  if (props.daysToDue === 0) return 'Hoje'
  if (props.daysToDue < 0) return `Venceu há ${Math.abs(props.daysToDue)}d`
  return `${props.daysToDue} dias`
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

const shouldPulse = computed(() => colorState.value === 'danger' || dueColorState.value === 'danger')
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
    <!-- Card 1: Invoice Total -->
    <div
      class="relative overflow-hidden rounded-3xl p-6 border transition-all hover:scale-[1.01] group min-h-[176px]"
      :class="[invoiceGradient, { 'motion-safe:animate-pulse ring-1 ring-danger/50': shouldPulse && colorState === 'danger' }]"
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
          <p class="text-micro text-muted-foreground">Fatura Estimada</p>
          <p class="text-stat text-foreground mt-1.5">{{ formatCurrency(total) }}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-small text-muted-foreground tabular-nums">{{ usagePercentage.toFixed(0) }}% do limite</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: Limit Usage -->
    <div
      class="relative overflow-hidden rounded-3xl p-6 border transition-all hover:scale-[1.01] group min-h-[176px]"
      :class="limitGradient"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="p-2 rounded-2xl bg-muted">
            <TrendingUp class="w-5 h-5 text-primary" :class="{ 'text-danger': colorState === 'danger', 'text-warning': colorState === 'warning' }" />
          </div>
        </div>
        <div>
          <p class="text-micro text-muted-foreground">Limite Comprometido</p>
          <div class="flex items-baseline gap-1 mt-1.5">
            <p class="text-stat text-foreground tabular-nums">{{ usagePercentage.toFixed(1) }}</p>
            <span class="text-lg font-bold text-muted-foreground">%</span>
          </div>

          <!-- Progress bar -->
          <div class="mt-3">
             <div class="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary dark:bg-primary rounded-full transition-all duration-1000 shadow-sm"
                  :style="{ width: `${Math.min(usagePercentage, 100)}%` }"
                />
              </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 3: Days to Due -->
    <div
      class="relative overflow-hidden rounded-3xl p-6 border transition-all hover:scale-[1.01] group min-h-[176px]"
      :class="[dueGradient, { 'motion-safe:animate-pulse ring-1 ring-danger/50': shouldPulse && dueColorState === 'danger' }]"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="p-2 rounded-2xl bg-primary/20 border border-primary/35 shadow-elevation-1">
            <Calendar class="w-5 h-5" :class="[status === 'PAID' ? 'text-success' : 'text-primary', { 'text-danger': dueColorState === 'danger', 'text-warning': dueColorState === 'warning' }]" />
          </div>
          <div v-if="dueColorState === 'danger' && status !== 'PAID'" class="px-2 py-0.5 bg-danger/10 border border-danger/20 rounded-full text-micro text-danger">
            Urgente
          </div>
          <div v-else-if="status === 'PAID'" class="px-2 py-0.5 bg-success/10 border border-success/20 rounded-full text-micro text-success">
            Concluido
          </div>
        </div>
        <div class="flex items-end justify-between gap-2">
          <div>
            <p class="text-micro text-muted-foreground">Vencimento</p>
            <p class="text-stat text-foreground mt-1.5">{{ dueText }}</p>
            <p class="text-small text-muted-foreground mt-1.5">
              {{ status === 'PAID' ? 'Fatura Paga' : 'Acompanhe as datas' }}
            </p>
          </div>
          <button
            v-if="status && status !== 'PAID'"
            class="mb-1 px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-2xl text-xs font-black shadow-elevation-3 active:scale-95 transition-all whitespace-nowrap"
            @click="emit('pay')"
          >
            PAGAR
          </button>
        </div>
      </div>
    </div>

    <!-- Card 4: Top Category -->
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
          <p class="text-small font-black text-primary mt-1.5 tabular-nums">
            {{ topCategory ? formatCurrency(topCategory.amount) : 'Sem gastos' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
