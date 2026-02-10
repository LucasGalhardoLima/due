<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'

const { simulate, simulationState, clearSimulation } = useInstallments()

const amount = ref(0)
const installments = ref([1])
const quickOptions = [1, 3, 6, 10, 12]

const runSimulation = async () => {
  if (amount.value <= 0 || !installments.value[0]) return
  await simulate(amount.value, installments.value[0])
}

const reset = () => {
  clearSimulation()
  amount.value = 0
  installments.value = [1]
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const result = computed(() => simulationState.value.result)
const isLoading = computed(() => simulationState.value.isLoading)

// Computed helpers for result display
const verdictColor = computed(() => {
  if (!result.value) return ''
  return result.value.evaluation.viable ? 'text-success' : 'text-danger'
})

const verdictBg = computed(() => {
  if (!result.value) return ''
  return result.value.evaluation.viable ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20'
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-2">
      <div class="p-2 bg-ai-accent/10 rounded-lg border border-ai-accent/20">
        <Sparkles class="w-5 h-5 text-ai-accent" />
      </div>
      <div>
        <h3 class="font-bold text-lg">Simulador</h3>
        <p class="text-xs text-muted-foreground">Avalie novas compras com IA</p>
      </div>
    </div>

    <!-- Input Form -->
    <div v-if="!result" class="space-y-6 flex-1">
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>Valor Total</Label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
            <CurrencyInput 
              v-model="amount"
              class="pl-9 h-11 font-bold text-lg"
              placeholder="0,00"
            />
          </div>
        </div>

        <div class="space-y-4">
           <div class="flex justify-between items-center">
             <Label>Parcelas</Label>
             <span class="font-bold text-base text-ai-accent">{{ installments[0] }}x</span>
           </div>
           <Slider v-model="installments" variant="ai" :min="1" :max="12" :step="1" />
           <div class="grid grid-cols-5 gap-1 text-center">
             <button
               v-for="option in quickOptions"
               :key="option"
               class="rounded-md px-2 py-1 text-[11px] font-semibold transition-colors"
               :class="installments[0] === option 
                 ? 'bg-ai-accent/15 text-ai-accent' 
                 : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50'"
               @click="installments = [option]"
             >
               {{ option }}x
             </button>
           </div>
        </div>
      </div>

      <div class="pt-4">
        <div v-if="amount > 0" class="mb-4 p-3 bg-muted/30 rounded-lg space-y-2">
           <div class="flex justify-between text-sm">
             <span class="text-muted-foreground">Parcela estimada:</span>
             <span class="font-bold">{{ formatCurrency(amount / (installments[0] || 1)) }}</span>
           </div>
        </div>

        <Button 
          class="w-full h-11 font-bold shadow-lg shadow-ai-accent/20 bg-ai-accent text-ai-accent-foreground hover:bg-ai-accent/90" 
          :disabled="isLoading || amount <= 0"
          @click="runSimulation"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          {{ isLoading ? 'Analisando...' : 'Simular Impacto' }}
        </Button>
      </div>
    </div>

    <!-- Result View -->
    <div v-else class="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 flex-1 flex flex-col">
      <!-- AI Verdict Banner -->
      <div 
        class="p-4 rounded-xl border flex flex-col gap-3 text-center"
        :class="verdictBg"
      >
        <div class="mx-auto p-2 bg-background/50 rounded-full w-fit backdrop-blur-sm shadow-sm" :class="verdictColor">
          <CheckCircle2 v-if="result.evaluation.viable" class="w-6 h-6" />
          <XCircle v-else class="w-6 h-6" />
        </div>
        <div>
          <h4 class="font-bold text-base leading-tight mb-1" :class="verdictColor">
            {{ result.evaluation.viable ? 'Compra Viável' : 'Atenção Necessária' }}
          </h4>
          <p class="text-xs text-muted-foreground leading-relaxed px-1">
            {{ result.evaluation.recommendation }}
          </p>
        </div>
      </div>

      <!-- Stats -->
      <div class="space-y-3">
        <div class="p-3 rounded-lg bg-muted/10 border flex items-center justify-between">
          <div class="text-xs text-muted-foreground">Impacto Mensal</div>
          <div class="font-mono text-sm font-bold">
            {{ formatCurrency(result.timeline.monthlyImpact) }}
          </div>
        </div>

        <div class="p-3 rounded-lg bg-muted/10 border flex flex-col gap-1">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pico de Uso</span>
            <span>Mês {{ result.timeline.peakMonth.label }}</span>
          </div>
          <div class="flex items-center gap-2">
             <div class="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
               <div
                  class="h-full rounded-full"
                  :class="result.timeline.peakMonth.usagePercentAfter > 80 ? 'bg-danger' : 'bg-ai-accent'"
                  :style="{ width: `${Math.min(result.timeline.peakMonth.usagePercentAfter, 100)}%` }"
               />
             </div>
             <div class="text-xs font-bold w-12 text-right">
               {{ result.timeline.peakMonth.usagePercentAfter.toFixed(0) }}%
             </div>
          </div>
        </div>
      </div>
      
      <div class="flex-1"/>

      <Button variant="outline" class="w-full" @click="reset">
        Nova Simulação
      </Button>
    </div>
  </div>
</template>
