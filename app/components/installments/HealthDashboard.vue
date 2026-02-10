<script setup lang="ts">
import { Activity, Layers, Wallet, TrendingUp, TrendingDown } from 'lucide-vue-next'

const { health } = useInstallments()

const scoreColor = computed(() => {
  const score = health.value?.score || 0
  if (score >= 80) return 'text-success'
  if (score >= 50) return 'text-warning'
  return 'text-danger'
})

const scoreGradient = computed(() => {
  const score = health.value?.score || 0
  if (score >= 80) return 'bg-card border-border/70'
  if (score >= 50) return 'bg-card border-border/70'
  return 'bg-card border-border/70'
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
    <div class="group relative overflow-hidden rounded-[1.5rem] p-4 md:p-5 border shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-3 hover:-translate-y-[2px]" :class="scoreGradient">
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-xl bg-primary/12 border border-primary/30 transition-all duration-200 group-hover:scale-105">
             <Activity class="w-5 h-5 transition-transform duration-200 group-hover:scale-105" :class="scoreColor" />
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
    <div class="group relative overflow-hidden rounded-[1.5rem] p-4 md:p-5 border border-border/70 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-3 hover:-translate-y-[2px]">
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-xl bg-primary/12 border border-primary/30 transition-all duration-200 group-hover:scale-105">
             <Layers class="w-5 h-5 text-primary transition-transform duration-200 group-hover:scale-105" />
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
    <div class="group relative overflow-hidden rounded-[1.5rem] p-4 md:p-5 border border-border/70 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-3 hover:-translate-y-[2px]">
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-lg bg-secondary/12 border border-secondary/30 transition-all duration-200 group-hover:scale-105">
             <Wallet class="w-5 h-5 text-secondary transition-transform duration-200 group-hover:scale-105" />
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
    <div class="group relative overflow-hidden rounded-[1.5rem] p-4 md:p-5 border border-border/70 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-3 hover:-translate-y-[2px]">
      <div class="flex flex-col h-full justify-between">
         <div class="flex items-start justify-between">
           <div class="p-2 rounded-xl bg-primary/12 border border-primary/30 transition-all duration-200 group-hover:scale-105">
             <TrendingUp v-if="trend === 'worse'" class="w-5 h-5 text-danger transition-transform duration-200 group-hover:scale-105" />
             <TrendingDown v-else class="w-5 h-5 text-success transition-transform duration-200 group-hover:scale-105" />
           </div>
         </div>
         <div class="mt-4">
           <div class="text-xs text-muted-foreground">Mês que vem</div>
           <div class="text-lg font-bold mt-1 text-foreground">
             <span v-if="trend === 'better'" class="text-success">Alívio à vista</span>
             <span v-else-if="trend === 'worse'" class="text-danger">Cuidado</span>
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
