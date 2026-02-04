<script setup lang="ts">
import { Activity, Layers, Wallet, TrendingUp, TrendingDown } from 'lucide-vue-next'

const { health } = useInstallments()

const scoreColor = computed(() => {
  const score = health.value?.score || 0
  if (score >= 80) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-rose-500'
})

const scoreGradient = computed(() => {
  const score = health.value?.score || 0
  if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
  if (score >= 50) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
  return 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50'
})

const trend = computed(() => {
  if (!health.value?.limitReleaseProjection?.length) return null
  const current = health.value.totalMonthlyCommitment
  const next = health.value.limitReleaseProjection[1]?.committedAmount ?? current
  
  if (next < current) return 'better'
  if (next > current) return 'worse'
  return 'stable'
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Card 1: Health Score -->
    <div
      class="relative overflow-hidden rounded-xl p-4 md:p-5 border shadow-elevation-1 transition-all hover:scale-[1.02]"
      :class="scoreGradient"
    >
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-xl bg-white/80 dark:bg-white/10 border border-border">
             <Activity class="w-5 h-5" :class="scoreColor" />
           </div>
         </div>
         <div class="mt-4">
           <div class="text-xs text-muted-foreground">Saúde Financeira</div>
           <div class="text-2xl font-black mt-1" :class="scoreColor">
             {{ health?.score ?? '-' }}<span class="text-sm font-medium text-muted-foreground">/100</span>
           </div>
           <div class="text-xs font-medium mt-1 opacity-80">{{ health?.scoreLabel }}</div>
         </div>
      </div>
    </div>

    <!-- Card 2: Active Plans -->
    <div class="relative overflow-hidden rounded-xl p-4 md:p-5 border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 shadow-elevation-1 transition-all hover:scale-[1.02]">
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-xl bg-white/80 dark:bg-white/10 border border-border">
             <Layers class="w-5 h-5 text-blue-500" />
           </div>
         </div>
         <div class="mt-4">
           <div class="text-xs text-muted-foreground">Parcelamentos Ativos</div>
           <div class="text-2xl font-black mt-1 text-foreground">
             {{ health?.activeCount ?? '-' }}
           </div>
           <div class="text-xs text-muted-foreground mt-1">transações futuras</div>
         </div>
      </div>
    </div>

    <!-- Card 3: Monthly Commitment -->
    <div class="relative overflow-hidden rounded-xl p-4 md:p-5 border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/30 shadow-elevation-1 transition-all hover:scale-[1.02]">
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-lg bg-white/80 dark:bg-white/10 border border-violet-200 dark:border-violet-700/50">
             <Wallet class="w-5 h-5 text-violet-500" />
           </div>
         </div>
         <div class="mt-4">
           <div class="text-xs text-muted-foreground">Compromisso Mensal</div>
           <div class="text-2xl font-black mt-1 text-foreground truncate">
             {{ formatCurrency(health?.totalMonthlyCommitment ?? 0) }}
           </div>
           <div class="text-xs text-muted-foreground mt-1">neste mês</div>
         </div>
      </div>
    </div>

    <!-- Card 4: Trend -->
    <div class="relative overflow-hidden rounded-xl p-4 md:p-5 border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/30 shadow-elevation-1 transition-all hover:scale-[1.02]">
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-xl bg-white/80 dark:bg-white/10 border border-border">
             <TrendingUp v-if="trend === 'worse'" class="w-5 h-5 text-rose-500" />
             <TrendingDown v-else class="w-5 h-5 text-emerald-500" />
           </div>
         </div>
         <div class="mt-4">
           <div class="text-xs text-muted-foreground">Mês que vem</div>
           <div class="text-lg font-bold mt-1 text-foreground">
             <span v-if="trend === 'better'" class="text-emerald-600 dark:text-emerald-400">Alívio à vista</span>
             <span v-else-if="trend === 'worse'" class="text-rose-600 dark:text-rose-400">Cuidado</span>
             <span v-else>Estável</span>
           </div>
           <div class="text-xs text-muted-foreground mt-1">
             {{ trend === 'better' ? 'Fatura menor' : trend === 'worse' ? 'Fatura maior' : 'Mesmo valor' }}
           </div>
         </div>
      </div>
    </div>
  </div>
</template>
