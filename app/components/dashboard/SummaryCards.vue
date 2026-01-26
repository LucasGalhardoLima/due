<script setup lang="ts">
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

// Gradient classes for each state (Light and Dark friendly)
const invoiceGradient = computed(() => {
  switch (colorState.value) {
    case 'danger':
      return 'bg-rose-500/10 backdrop-blur-2xl border-rose-500/20'
    case 'warning':
      return 'bg-amber-500/10 backdrop-blur-2xl border-amber-500/20'
    default:
      return 'bg-emerald-500/10 backdrop-blur-2xl border-emerald-500/20'
  }
})

const limitGradient = computed(() => {
  switch (colorState.value) {
    case 'danger':
      return 'bg-rose-500/10 backdrop-blur-2xl border-rose-500/20'
    case 'warning':
      return 'bg-orange-500/10 backdrop-blur-2xl border-orange-500/20'
    default:
      return 'bg-teal-500/10 backdrop-blur-2xl border-teal-500/20'
  }
})

const dueGradient = computed(() => {
  if (props.status === 'PAID') {
    return 'bg-emerald-500/10 backdrop-blur-2xl border-emerald-500/20'
  }
  switch (dueColorState.value) {
    case 'danger':
      return 'bg-rose-500/10 backdrop-blur-2xl border-rose-500/20'
    case 'warning':
      return 'bg-amber-500/10 backdrop-blur-2xl border-amber-500/20'
    default:
      return 'bg-blue-500/10 backdrop-blur-2xl border-blue-500/20'
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
const categoryIcons: Record<string, any> = {
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
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
    <!-- Card 1: Invoice Total -->
    <div
      class="relative overflow-hidden rounded-2xl p-5 md:p-6 border shadow-elevation-4 transition-all hover:scale-[1.02] group backdrop-blur-xl"
      :class="[invoiceGradient, { 'animate-pulse ring-1 ring-rose-500/50': shouldPulse && colorState === 'danger' }]"
    >
      <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/40 dark:bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

      <div class="relative z-10 space-y-4">
        <div class="flex items-center justify-between">
          <div class="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-elevation-1">
            <CreditCard class="w-5 h-5 text-emerald-600 dark:text-emerald-400" :class="{ 'text-rose-600 dark:text-rose-400': colorState === 'danger', 'text-amber-600 dark:text-amber-400': colorState === 'warning' }" />
          </div>
          <div v-if="colorState === 'danger'" class="px-2 py-0.5 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 dark:border-rose-500/30 rounded-full text-micro text-rose-600 dark:text-rose-400">
            Alerta
          </div>
        </div>
        <div>
          <p class="text-micro text-muted-foreground dark:text-white/50">Fatura Estimada</p>
          <p class="text-stat text-foreground dark:text-white mt-1.5">{{ formatCurrency(total) }}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-small text-muted-foreground dark:text-white/40">{{ usagePercentage.toFixed(0) }}% do limite</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: Limit Usage -->
    <div
      class="relative overflow-hidden rounded-2xl p-5 md:p-6 border shadow-elevation-4 transition-all hover:scale-[1.02] group backdrop-blur-xl"
      :class="limitGradient"
    >
      <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/40 dark:bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

      <div class="relative z-10 space-y-4">
        <div class="flex items-center justify-between">
          <div class="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-elevation-1">
            <TrendingUp class="w-5 h-5 text-teal-600 dark:text-teal-400" :class="{ 'text-rose-600 dark:text-rose-400': colorState === 'danger', 'text-amber-600 dark:text-amber-400': colorState === 'warning' }" />
          </div>
        </div>
        <div>
          <p class="text-micro text-muted-foreground dark:text-white/50">Limite Comprometido</p>
          <div class="flex items-baseline gap-1 mt-1.5">
            <p class="text-stat text-foreground dark:text-white">{{ usagePercentage.toFixed(1) }}</p>
            <span class="text-lg font-bold text-muted-foreground dark:text-white/40">%</span>
          </div>

          <!-- Progress bar -->
          <div class="mt-3">
             <div class="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                <div
                  class="h-full bg-teal-600 dark:bg-emerald-400 rounded-full transition-all duration-1000 shadow-sm dark:shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                  :style="{ width: `${Math.min(usagePercentage, 100)}%` }"
                />
              </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 3: Days to Due -->
    <div
      class="relative overflow-hidden rounded-2xl p-5 md:p-6 border shadow-elevation-4 transition-all hover:scale-[1.02] group backdrop-blur-xl"
      :class="[dueGradient, { 'animate-pulse ring-1 ring-rose-500/50': shouldPulse && dueColorState === 'danger' }]"
    >
      <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/40 dark:bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

      <div class="relative z-10 space-y-4">
        <div class="flex items-center justify-between">
          <div class="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-elevation-1">
            <Calendar class="w-5 h-5" :class="[status === 'PAID' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400', { 'text-rose-600 dark:text-rose-400': dueColorState === 'danger', 'text-amber-600 dark:text-amber-400': dueColorState === 'warning' }]" />
          </div>
          <div v-if="dueColorState === 'danger' && status !== 'PAID'" class="px-2 py-0.5 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 dark:border-rose-500/30 rounded-full text-micro text-rose-600 dark:text-rose-400">
            Urgente
          </div>
          <div v-else-if="status === 'PAID'" class="px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 rounded-full text-micro text-emerald-600 dark:text-emerald-400">
            Concluido
          </div>
        </div>
        <div class="flex items-end justify-between gap-2">
          <div>
            <p class="text-micro text-muted-foreground dark:text-white/50">Vencimento</p>
            <p class="text-stat text-foreground dark:text-white mt-1.5">{{ dueText }}</p>
            <p class="text-small text-muted-foreground dark:text-white/40 mt-1.5">
              {{ status === 'PAID' ? 'Fatura Paga' : 'Acompanhe as datas' }}
            </p>
          </div>
          <button
            v-if="status && status !== 'PAID'"
            @click="emit('pay')"
            class="mb-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-elevation-3 shadow-blue-500/20 active:scale-95 transition-all whitespace-nowrap"
          >
            PAGAR
          </button>
        </div>
      </div>
    </div>

    <!-- Card 4: Top Category -->
    <div
      class="relative overflow-hidden rounded-2xl p-5 md:p-6 border border-purple-500/20 shadow-glass transition-all hover:scale-[1.02] group bg-purple-500/10 backdrop-blur-2xl"
    >
      <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/40 dark:bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

      <div class="relative z-10 space-y-4">
        <div class="flex items-center justify-between">
          <div class="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-elevation-1">
            <component :is="categoryIcon" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div>
          <p class="text-micro text-muted-foreground dark:text-white/50">Maior Gasto</p>
          <p class="text-xl md:text-2xl lg:text-3xl font-black text-foreground dark:text-white mt-1.5 truncate">{{ topCategory?.name || '---' }}</p>
          <p class="text-small font-black text-purple-600 dark:text-purple-400 mt-1.5 tabular-nums">
            {{ topCategory ? formatCurrency(topCategory.amount) : 'Sem gastos' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
