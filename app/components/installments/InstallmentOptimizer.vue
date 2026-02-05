<script setup lang="ts">
import { Sparkles, Loader2, ArrowRight, TrendingDown, Clock, Zap } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const { optimize, optimizerState } = useInstallments()

const result = computed(() => optimizerState.value.result)
const isLoading = computed(() => optimizerState.value.isLoading)

const runAnalysis = async () => {
  await optimize()
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const recommendationColor = computed(() => {
  if (!result.value) return ''
  switch (result.value.recommendation.type) {
    case 'antecipate': return 'text-purple-500 bg-purple-500/10 border-purple-500/20'
    case 'pay_full': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center gap-2 mb-6">
      <div class="p-2 bg-indigo-500/10 rounded-lg">
        <Sparkles class="w-5 h-5 text-indigo-500" />
      </div>
      <div>
        <h3 class="font-bold text-lg">Otimizador</h3>
        <p class="text-xs text-muted-foreground">Estratégias para liberar limite</p>
      </div>
    </div>

    <!-- Initial State -->
    <div v-if="!result && !isLoading" class="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 border-2 border-dashed rounded-xl border-muted">
       <Sparkles class="w-10 h-10 text-muted-foreground/30" />
       <div>
         <p class="font-medium text-muted-foreground">IA pronta para analisar</p>
         <p class="text-xs text-muted-foreground/70 max-w-[200px] mx-auto mt-1">
           Descubra quais parcelas antecipar para economizar e liberar crédito.
         </p>
       </div>
       <Button class="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20" @click="runAnalysis">
         Analisar Agora
       </Button>
    </div>

    <!-- Loading -->
    <div v-else-if="isLoading" class="flex-1 flex flex-col items-center justify-center space-y-4">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
      <p class="text-xs text-muted-foreground animate-pulse">Consultando estratégias de otimização...</p>
    </div>

    <!-- Result -->
    <div v-else-if="result" class="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <!-- Main Recommendation -->
      <div class="p-4 rounded-xl border space-y-3" :class="recommendationColor">
         <div class="flex items-start gap-3">
           <div class="p-2 bg-background/50 backdrop-blur-sm rounded-full shadow-sm">
             <Zap class="w-4 h-4" />
           </div>
           <div>
             <h4 class="font-bold text-base leading-tight">{{ result.recommendation.title }}</h4>
             <p class="text-xs opacity-80 mt-1 leading-relaxed">{{ result.recommendation.description }}</p>
           </div>
         </div>
         
         <div class="grid grid-cols-2 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
           <div v-if="result.recommendation.impact.monthlySavings > 0">
             <div class="text-[10px] opacity-70">Libera/mês</div>
             <div class="font-bold text-sm">{{ formatCurrency(result.recommendation.impact.monthlySavings) }}</div>
           </div>
           <div v-if="result.recommendation.impact.limitFreed > 0">
             <div class="text-[10px] opacity-70">Libera Limite</div>
             <div class="font-bold text-sm">{{ formatCurrency(result.recommendation.impact.limitFreed) }}</div>
           </div>
         </div>
      </div>

      <!-- Priority List -->
      <div class="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1">
         <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
           <ArrowRight class="w-3 h-3" />
           Prioridades
         </div>
         
         <div 
           v-for="(item, i) in result.priorityList" 
           :key="i"
           class="p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors group"
         >
           <div class="flex justify-between items-start mb-1">
             <span class="font-medium text-sm group-hover:text-primary transition-colors">{{ item.description }}</span>
             <span 
               class="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase"
               :class="item.priority === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'"
             >
               {{ item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa' }}
             </span>
           </div>
           <p class="text-xs text-muted-foreground mb-2">{{ item.reason }}</p>
           
           <div class="flex items-center gap-4 text-[10px] text-muted-foreground">
             <div class="flex items-center gap-1">
               <Clock class="w-3 h-3" />
               {{ item.remainingInstallments }}x restantes
             </div>
             <div class="flex items-center gap-1">
               <TrendingDown class="w-3 h-3" />
               Restam {{ formatCurrency(item.remainingAmount) }}
             </div>
           </div>
         </div>
      </div>
    </div>
  </div>
</template>
