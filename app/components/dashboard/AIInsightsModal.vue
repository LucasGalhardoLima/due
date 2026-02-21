<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  Target,
  Lightbulb,
  Heart,
  Zap
} from 'lucide-vue-next'
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

// Tab state
type TabType = 'resumo' | 'profunda'
const activeTab = ref<TabType>('resumo')

// Quick insights types
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

// Deep insights types
interface DeepInsights {
  trend_analysis: {
    direction: 'crescente' | 'estável' | 'decrescente'
    monthly_change_pct: number
    categories_driving_change: { name: string; change_pct: number }[]
  }
  forecast: {
    next_month_prediction: number
    confidence: number
    factors: string[]
  }
  optimization_opportunities: {
    category: string
    current_spending: number
    potential_saving: number
    difficulty: 'fácil' | 'médio' | 'difícil'
    suggestion: string
  }[]
  health_score: {
    score: number
    factors: { label: string; impact: 'positive' | 'negative' }[]
  }
}

interface DeepInsightsResponse {
  success: boolean
  insights: DeepInsights
  metadata: {
    periodStart: string
    periodEnd: string
    totalAnalyzed: number
    monthlyAverage: number
    monthlyData: { month: string; total: number; change_pct: number | null }[]
    categoryTrends: { name: string; sixMonthAvg: number; lastMonth: number; change_pct: number }[]
  }
}

// Loading states
const isLoadingQuick = ref(false)
const isLoadingDeep = ref(false)

// Results
const quickInsights = ref<InsightsResponse | null>(null)
const deepInsights = ref<DeepInsightsResponse | null>(null)

const hasAnalyzedQuick = ref(false)
const hasAnalyzedDeep = ref(false)

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const monthName = computed(() => months[props.month - 1])

async function analyzeQuick() {
  isLoadingQuick.value = true
  hasAnalyzedQuick.value = false

  try {
    const response = await $fetch<InsightsResponse>('/api/ai/insights', {
      method: 'POST'
    })

    quickInsights.value = response
    hasAnalyzedQuick.value = true
  } catch (error) {
    console.error('AI Insights Error:', error)
    toast.error('Erro ao gerar insights. Verifique sua API Key.')
  } finally {
    isLoadingQuick.value = false
  }
}

async function analyzeDeep() {
  isLoadingDeep.value = true
  hasAnalyzedDeep.value = false

  try {
    const response = await $fetch<DeepInsightsResponse>('/api/ai/deep-insights', {
      method: 'POST'
    })

    deepInsights.value = response
    hasAnalyzedDeep.value = true
  } catch (error) {
    console.error('Deep AI Insights Error:', error)
    toast.error('Erro ao gerar análise profunda.')
  } finally {
    isLoadingDeep.value = false
  }
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function getTrendIcon(direction: string) {
  if (direction === 'crescente') return TrendingUp
  if (direction === 'decrescente') return TrendingDown
  return Minus
}

function getTrendColor(direction: string) {
  if (direction === 'crescente') return 'text-destructive'
  if (direction === 'decrescente') return 'text-success'
  return 'text-muted-foreground'
}

function getDifficultyBadgeClass(difficulty: string) {
  if (difficulty === 'fácil') return 'bg-success/10 text-success border-success/20'
  if (difficulty === 'médio') return 'bg-warning/10 text-warning border-warning/20'
  return 'bg-destructive/10 text-destructive border-destructive/20'
}

function getHealthScoreColor(score: number) {
  if (score >= 70) return 'text-success'
  if (score >= 40) return 'text-warning'
  return 'text-destructive'
}

function getHealthScoreGradient(score: number) {
  if (score >= 70) return 'from-success to-success/70'
  if (score >= 40) return 'from-warning to-warning/70'
  return 'from-destructive to-destructive/70'
}

// Reset state when modal closes
watch(isOpen, (val) => {
  if (!val) {
    activeTab.value = 'resumo'
  }
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-xl bg-background border-border max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div class="flex items-center gap-3 mb-2">
          <div class="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-ai-accent shadow-glass ring-1 ring-primary/30">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <DialogTitle class="text-h3">Consultor IA</DialogTitle>
            <DialogDescription>
              Análise inteligente de <span class="font-bold text-foreground">{{ monthName }}/{{ year }}</span>
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <!-- Tab Buttons -->
      <div class="flex gap-2 p-1 bg-muted/30 rounded-xl border border-border">
        <button
          :class="[
            'flex-1 px-4 py-2 text-small font-semibold rounded-lg transition-all',
            activeTab === 'resumo'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          ]"
          @click="activeTab = 'resumo'"
        >
          Resumo Rápido
        </button>
        <button
          :class="[
            'flex-1 px-4 py-2 text-small font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
            activeTab === 'profunda'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          ]"
          @click="activeTab = 'profunda'"
        >
          <Zap class="w-3.5 h-3.5" />
          Análise Profunda
        </button>
      </div>

      <div class="space-y-6 py-2">
        <!-- ==================== QUICK INSIGHTS TAB ==================== -->
        <template v-if="activeTab === 'resumo'">
          <!-- Initial State / Loading -->
          <div v-if="!hasAnalyzedQuick" class="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div class="p-4 rounded-full bg-primary/5 border border-primary/10 relative">
              <Sparkles class="w-8 h-8 text-ai-accent" :class="isLoadingQuick ? 'animate-pulse' : ''" />
              <div v-if="isLoadingQuick" class="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"/>
            </div>

            <div class="space-y-2 max-w-sm mx-auto">
              <h4 v-if="!isLoadingQuick" class="text-h4 font-bold">Diagnóstico Rápido</h4>
              <h4 v-else class="text-h4 font-bold">Analisando padrões de consumo...</h4>

              <p v-if="!isLoadingQuick" class="text-body text-muted-foreground">
                Análise do mês atual com ações práticas e alertas de risco.
              </p>
              <p v-else class="text-body text-muted-foreground">
                Isso pode levar alguns segundos. Estamos verificando categorias e limites.
              </p>
            </div>

            <Button
              v-if="!isLoadingQuick"
              size="lg"
              class="w-full max-w-xs font-bold shadow-primary-glow mt-4"
              @click="analyzeQuick"
            >
              <Sparkles class="w-4 h-4 mr-2" />
              Gerar Diagnóstico
            </Button>
          </div>

          <!-- Quick Results -->
          <div v-else-if="quickInsights" class="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <!-- Diagnosis Card -->
            <Card variant="glass-warning" class="p-5 space-y-3 border-warning/20 bg-warning/5">
              <div class="flex items-center gap-2 text-warning">
                <AlertTriangle class="w-5 h-5" />
                <h4 class="text-small font-black uppercase tracking-wide">Diagnóstico</h4>
              </div>
              <p class="text-body text-foreground leading-relaxed font-medium">
                {{ quickInsights.insights.diagnostico }}
              </p>
            </Card>

            <!-- Quick Actions -->
            <div class="space-y-3">
              <h4 class="text-small font-black text-muted-foreground uppercase tracking-wider ml-1">Ações Recomendadas</h4>
              <div class="space-y-2">
                <div
                  v-for="(action, idx) in quickInsights.insights.acoes_imediatas" :key="idx"
                  class="p-4 rounded-xl bg-muted/30 border border-border flex gap-3 items-start group hover:bg-muted/50 transition-colors"
                >
                  <div class="h-6 w-6 rounded-full bg-background flex items-center justify-center shrink-0 border border-border text-[10px] font-bold text-muted-foreground group-hover:border-ai-accent/50 group-hover:text-ai-accent transition-colors">
                    {{ idx + 1 }}
                  </div>
                  <p class="text-small text-foreground/90 pt-0.5">{{ action }}</p>
                </div>
              </div>
            </div>

            <!-- Future Outlook -->
            <div class="p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5 space-y-2">
              <div class="flex items-center gap-2 text-ai-accent">
                <TrendingDown class="w-4 h-4" />
                <h4 class="text-micro font-bold uppercase">Previsão e Próximos Passos</h4>
              </div>
              <p class="text-small text-muted-foreground leading-relaxed">
                {{ quickInsights.insights.alivio_futuro }}
              </p>
            </div>

            <!-- Alerts -->
            <div v-if="quickInsights.insights.alertas?.length" class="space-y-2">
              <div v-for="(alerta, idx) in quickInsights.insights.alertas" :key="idx" class="flex items-center gap-2 text-destructive bg-destructive/5 p-2 rounded-lg border border-destructive/10 text-micro">
                <div class="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse"/>
                {{ alerta }}
              </div>
            </div>

            <!-- Footer Stats -->
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <span class="text-micro text-muted-foreground block mb-0.5">Fatura Analisada</span>
                <span class="text-h3 font-black">{{ formatCurrency(quickInsights.metadata.totalSpent) }}</span>
              </div>
              <div class="text-right">
                <span class="text-micro text-muted-foreground block mb-0.5">Transações</span>
                <span class="text-h3 font-black">{{ quickInsights.metadata.transactionCount }}</span>
              </div>
            </div>

            <Button class="w-full" variant="outline" @click="hasAnalyzedQuick = false">
              Nova Análise
            </Button>
          </div>
        </template>

        <!-- ==================== DEEP INSIGHTS TAB ==================== -->
        <template v-if="activeTab === 'profunda'">
          <!-- Initial State / Loading -->
          <div v-if="!hasAnalyzedDeep" class="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div class="p-4 rounded-full bg-primary/5 border border-primary/10 relative">
              <Zap class="w-8 h-8 text-ai-accent" :class="isLoadingDeep ? 'animate-pulse' : ''" />
              <div v-if="isLoadingDeep" class="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"/>
            </div>

            <div class="space-y-2 max-w-sm mx-auto">
              <h4 v-if="!isLoadingDeep" class="text-h4 font-bold">Análise Profunda</h4>
              <h4 v-else class="text-h4 font-bold">Processando 6 meses de dados...</h4>

              <p v-if="!isLoadingDeep" class="text-body text-muted-foreground">
                Análise de tendências com 6 meses de histórico, previsões e oportunidades de economia.
              </p>
              <p v-else class="text-body text-muted-foreground">
                Nossa IA está analisando padrões, tendências e gerando previsões personalizadas.
              </p>
            </div>

            <Button
              v-if="!isLoadingDeep"
              size="lg"
              class="w-full max-w-xs font-bold shadow-primary-glow mt-4"
              @click="analyzeDeep"
            >
              <Zap class="w-4 h-4 mr-2" />
              Iniciar Análise Profunda
            </Button>
          </div>

          <!-- Deep Results -->
          <div v-else-if="deepInsights" class="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <!-- Health Score -->
            <Card class="p-5 border-border bg-muted/20">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <Heart class="w-5 h-5 text-ai-accent" />
                  <h4 class="text-small font-black uppercase tracking-wide">Saúde Financeira</h4>
                </div>
                <span :class="['text-h2 font-black', getHealthScoreColor(deepInsights.insights.health_score.score)]">
                  {{ deepInsights.insights.health_score.score }}
                </span>
              </div>

              <!-- Score Bar -->
              <div class="h-3 bg-secondary rounded-full overflow-hidden mb-4">
                <div
                  :class="['h-full rounded-full bg-gradient-to-r transition-all duration-1000', getHealthScoreGradient(deepInsights.insights.health_score.score)]"
                  :style="{ width: `${deepInsights.insights.health_score.score}%` }"
                />
              </div>

              <!-- Factors -->
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(factor, idx) in deepInsights.insights.health_score.factors.slice(0, 4)"
                  :key="idx"
                  :class="[
                    'text-micro px-2 py-1 rounded-full border',
                    factor.impact === 'positive'
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  ]"
                >
                  {{ factor.impact === 'positive' ? '+' : '-' }} {{ factor.label }}
                </span>
              </div>
            </Card>

            <!-- Trend Analysis -->
            <Card class="p-5 border-border bg-muted/20">
              <div class="flex items-center gap-2 mb-3">
                <component :is="getTrendIcon(deepInsights.insights.trend_analysis.direction)" :class="['w-5 h-5', getTrendColor(deepInsights.insights.trend_analysis.direction)]" />
                <h4 class="text-small font-black uppercase tracking-wide">Tendência de Gastos</h4>
              </div>

              <div class="flex items-baseline gap-2 mb-4">
                <span :class="['text-h2 font-black capitalize', getTrendColor(deepInsights.insights.trend_analysis.direction)]">
                  {{ deepInsights.insights.trend_analysis.direction }}
                </span>
                <span class="text-body text-muted-foreground">
                  ({{ deepInsights.insights.trend_analysis.monthly_change_pct > 0 ? '+' : '' }}{{ deepInsights.insights.trend_analysis.monthly_change_pct.toFixed(1) }}% ao mês)
                </span>
              </div>

              <!-- Category Drivers -->
              <div class="space-y-2">
                <span class="text-micro text-muted-foreground uppercase font-bold">Categorias em destaque</span>
                <div class="space-y-1.5">
                  <div
                    v-for="cat in deepInsights.insights.trend_analysis.categories_driving_change.slice(0, 3)"
                    :key="cat.name"
                    class="flex items-center justify-between text-small"
                  >
                    <span class="text-foreground/80">{{ cat.name }}</span>
                    <span :class="cat.change_pct > 0 ? 'text-destructive' : 'text-success'">
                      {{ cat.change_pct > 0 ? '+' : '' }}{{ cat.change_pct.toFixed(0) }}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <!-- Forecast -->
            <Card class="p-5 border-primary/20 bg-primary/5">
              <div class="flex items-center gap-2 mb-3">
                <Target class="w-5 h-5 text-ai-accent" />
                <h4 class="text-small font-black uppercase tracking-wide text-ai-accent">Previsão Próximo Mês</h4>
              </div>

              <div class="flex items-baseline gap-3 mb-3">
                <span class="text-h2 font-black">{{ formatCurrency(deepInsights.insights.forecast.next_month_prediction) }}</span>
                <div class="flex items-center gap-1.5">
                  <div class="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      class="h-full bg-primary rounded-full"
                      :style="{ width: `${deepInsights.insights.forecast.confidence}%` }"
                    />
                  </div>
                  <span class="text-micro text-muted-foreground">{{ deepInsights.insights.forecast.confidence }}% confiança</span>
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="(factor, idx) in deepInsights.insights.forecast.factors"
                  :key="idx"
                  class="text-micro px-2 py-0.5 rounded-full bg-primary/10 text-ai-accent/80"
                >
                  {{ factor }}
                </span>
              </div>
            </Card>

            <!-- Optimization Opportunities -->
            <div class="space-y-3">
              <div class="flex items-center gap-2 ml-1">
                <Lightbulb class="w-4 h-4 text-warning" />
                <h4 class="text-small font-black text-muted-foreground uppercase tracking-wider">Oportunidades de Economia</h4>
              </div>

              <div class="space-y-2">
                <div
                  v-for="(opp, idx) in deepInsights.insights.optimization_opportunities"
                  :key="idx"
                  class="p-4 rounded-xl bg-muted/30 border border-border space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-foreground">{{ opp.category }}</span>
                    <span :class="['text-micro px-2 py-0.5 rounded-full border', getDifficultyBadgeClass(opp.difficulty)]">
                      {{ opp.difficulty }}
                    </span>
                  </div>
                  <p class="text-small text-muted-foreground">{{ opp.suggestion }}</p>
                  <div class="flex items-center justify-between pt-2 border-t border-border/50 text-small">
                    <span class="text-muted-foreground">Gasto atual: <span class="text-foreground">{{ formatCurrency(opp.current_spending) }}</span></span>
                    <span class="text-success font-semibold">Economia: {{ formatCurrency(opp.potential_saving) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Period Info -->
            <div class="pt-4 border-t border-border text-center">
              <span class="text-micro text-muted-foreground">
                Período analisado: {{ deepInsights.metadata.periodStart }} a {{ deepInsights.metadata.periodEnd }} |
                Média mensal: <span class="font-semibold text-foreground">{{ formatCurrency(deepInsights.metadata.monthlyAverage) }}</span>
              </span>
            </div>

            <Button class="w-full" variant="outline" @click="hasAnalyzedDeep = false">
              Nova Análise Profunda
            </Button>
          </div>
        </template>
      </div>
    </DialogContent>
  </Dialog>
</template>
