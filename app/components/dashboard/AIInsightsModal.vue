<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, TrendingDown, AlertTriangle, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
  month: number
  year: number
}>()

const emit = defineEmits(['update:open'])

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

interface AIInsights {
  diagnostico: string
  acoes_imediatas: string[]
  alivio_futuro: string
  alertas: string[]
}

interface InsightsResponse {
  success: boolean
  insights: AIInsights
  metadata: {
    totalSpent: number
    transactionCount: number
    topCategories: Array<{ name: string; amount: number; percentage: string }>
  }
}

const isLoading = ref(false)
const insights = ref<InsightsResponse | null>(null)
const hasAnalyzed = ref(false)

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const monthName = computed(() => months[props.month - 1])

async function analyzeFinances() {
  isLoading.value = true
  hasAnalyzed.value = false
  
  try {
    const response = await $fetch<InsightsResponse>('/api/ai/insights', {
      method: 'POST' as any
    })
    
    insights.value = response
    hasAnalyzed.value = true
  } catch (error: any) {
    console.error('AI Insights Error:', error)
    toast.error('Erro ao gerar insights. Verifique sua API Key.')
  } finally {
    isLoading.value = false
  }
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

// Auto-analyze when opened (optional, user might prefer to click)
// But to match previous flow of "Generate Insights", we'll keep the button.
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-xl bg-background border-border">
      <DialogHeader>
        <div class="flex items-center gap-3 mb-2">
            <div class="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-glass ring-1 ring-primary/30">
              <Sparkles class="w-5 h-5" />
            </div>
            <div>
                <DialogTitle class="text-h3">AI Financial Advisor</DialogTitle>
                <DialogDescription>
                    Analisando fatura de <span class="font-bold text-foreground">{{ monthName }}/{{ year }}</span>
                </DialogDescription>
            </div>
        </div>
      </DialogHeader>

      <div class="space-y-6 py-2">
        <!-- Initial State / Loading -->
        <div v-if="!hasAnalyzed" class="flex flex-col items-center justify-center py-8 text-center space-y-4">
             <div class="p-4 rounded-full bg-primary/5 border border-primary/10 relative">
                <Sparkles class="w-8 h-8 text-primary" :class="isLoading ? 'animate-pulse' : ''" />
                <div v-if="isLoading" class="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
             </div>
             
             <div class="space-y-2 max-w-sm mx-auto">
                <h4 class="text-h4 font-bold" v-if="!isLoading">Pronto para analisar?</h4>
                <h4 class="text-h4 font-bold" v-else>Analisando padrões de consumo...</h4>
                
                <p class="text-body text-muted-foreground" v-if="!isLoading">
                    Nossa IA vai varrer seus lançamentos deste mês para encontrar oportunidades de economia e alertas de risco.
                </p>
                <p class="text-body text-muted-foreground" v-else>
                    Isso pode levar alguns segundos. Estamos verificando categorias, recorrências e limites.
                </p>
             </div>

             <Button 
                v-if="!isLoading" 
                size="lg" 
                class="w-full max-w-xs font-bold shadow-primary-glow mt-4" 
                @click="analyzeFinances"
            >
                <Sparkles class="w-4 h-4 mr-2" />
                Gerar Diagnóstico
             </Button>
        </div>

        <!-- Results -->
        <div v-else-if="insights" class="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <!-- Diagnosis Card -->
             <Card variant="glass-warning" class="p-5 space-y-3 border-amber-500/20 bg-amber-500/5">
                <div class="flex items-center gap-2 text-amber-500">
                    <AlertTriangle class="w-5 h-5" />
                    <h4 class="text-small font-black uppercase tracking-wide">Diagnóstico</h4>
                </div>
                <p class="text-body text-foreground leading-relaxed font-medium">
                    {{ insights.insights.diagnostico }}
                </p>
             </Card>

             <!-- Quick Actions -->
             <div class="space-y-3">
                <h4 class="text-small font-black text-muted-foreground uppercase tracking-wider ml-1">Ações Recomendadas</h4>
                <div class="space-y-2">
                    <div 
                        v-for="(action, idx) in insights.insights.acoes_imediatas" :key="idx"
                        class="p-4 rounded-xl bg-secondary/30 border border-border flex gap-3 items-start group hover:bg-secondary/50 transition-colors"
                    >
                        <div class="h-6 w-6 rounded-full bg-background flex items-center justify-center shrink-0 border border-border text-[10px] font-bold text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors">
                            {{ idx + 1 }}
                        </div>
                        <p class="text-small text-foreground/90 pt-0.5">{{ action }}</p>
                    </div>
                </div>
             </div>

             <!-- Future Outlook -->
             <div class="p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5 space-y-2">
                <div class="flex items-center gap-2 text-primary">
                    <TrendingDown class="w-4 h-4" />
                    <h4 class="text-micro font-bold uppercase">Previsão e Próximos Passos</h4>
                </div>
                <p class="text-small text-muted-foreground leading-relaxed">
                    {{ insights.insights.alivio_futuro }}
                </p>
             </div>

             <!-- Alerts -->
             <div v-if="insights.insights.alertas?.length" class="space-y-2">
                <div v-for="(alerta, idx) in insights.insights.alertas" :key="idx" class="flex items-center gap-2 text-destructive bg-destructive/5 p-2 rounded-lg border border-destructive/10 text-micro">
                    <div class="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse"></div>
                    {{ alerta }}
                </div>
             </div>

             <!-- Footer Stats -->
             <div class="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                    <span class="text-micro text-muted-foreground block mb-0.5">Fatura Analisada</span>
                    <span class="text-h3 font-black">{{ formatCurrency(insights.metadata.totalSpent) }}</span>
                </div>
                 <div class="text-right">
                    <span class="text-micro text-muted-foreground block mb-0.5">Transações</span>
                    <span class="text-h3 font-black">{{ insights.metadata.transactionCount }}</span>
                </div>
             </div>
             
             <Button class="w-full" variant="outline" @click="hasAnalyzed = false">
                Nova Análise
             </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
