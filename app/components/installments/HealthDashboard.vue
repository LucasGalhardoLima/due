<script setup lang="ts">
import { Activity, Layers, Wallet, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-vue-next'

const { health, healthStatus } = useInstallments()

const scoreColor = computed(() => {
  const score = health.value?.score || 0
  if (score >= 80) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-rose-500'
})

const scoreGradient = computed(() => {
  const score = health.value?.score || 0
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20'
  if (score >= 50) return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-rose-500/10 border-rose-500/20'
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
      class="relative overflow-hidden rounded-2xl p-4 md:p-5 border backdrop-blur-xl transition-all hover:scale-[1.02]"
      :class="scoreGradient"
    >
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 dark:border-white/10">
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
    <div class="relative overflow-hidden rounded-2xl p-4 md:p-5 border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl transition-all hover:scale-[1.02]">
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 dark:border-white/10">
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
    <div class="relative overflow-hidden rounded-2xl p-4 md:p-5 border border-purple-500/20 bg-purple-500/5 backdrop-blur-xl transition-all hover:scale-[1.02]">
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 dark:border-white/10">
             <Wallet class="w-5 h-5 text-purple-500" />
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
    <div class="relative overflow-hidden rounded-2xl p-4 md:p-5 border border-orange-500/20 bg-orange-500/5 backdrop-blur-xl transition-all hover:scale-[1.02]">
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 dark:border-white/10">
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
