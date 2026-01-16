<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, TrendingDown, AlertTriangle, Calendar, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

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
const showInsights = ref(false)

async function analyzeFinances() {
  isLoading.value = true
  showInsights.value = false
  
  try {
    const response = await $fetch<InsightsResponse>('/api/ai/insights', {
      method: 'POST' as any
    })
    
    insights.value = response
    showInsights.value = true
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
</script>

<template>
  <div class="space-y-4">
    <!-- Trigger Button -->
    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
      <div class="flex items-start justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Sparkles class="w-5 h-5" />
            <h3 class="text-lg font-bold">Consultor Financeiro IA</h3>
          </div>
          <p class="text-sm text-indigo-100 max-w-md">
            Descubra por que sua fatura está alta e receba sugestões personalizadas para economizar.
          </p>
        </div>
        <Button 
          @click="analyzeFinances" 
          :disabled="isLoading"
          class="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          <Sparkles v-else class="w-4 h-4 mr-2" />
          {{ isLoading ? 'Analisando...' : 'Analisar Gastos' }}
        </Button>
      </div>
    </div>

    <!-- Insights Results -->
    <div v-if="showInsights && insights" class="grid gap-4 md:grid-cols-2">
      <!-- Diagnosis Card -->
      <div class="bg-card rounded-xl border p-6 space-y-3">
        <div class="flex items-center gap-2 text-amber-600">
          <AlertTriangle class="w-5 h-5" />
          <h4 class="font-bold text-foreground">Diagnóstico</h4>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">
          {{ insights.insights.diagnostico }}
        </p>
        <div class="pt-2 border-t text-xs text-muted-foreground">
          Total gasto: <span class="font-bold text-foreground">{{ formatCurrency(insights.metadata.totalSpent) }}</span>
        </div>
      </div>

      <!-- Future Relief Card -->
      <div class="bg-card rounded-xl border p-6 space-y-3">
        <div class="flex items-center gap-2 text-green-600">
          <Calendar class="w-5 h-5" />
          <h4 class="font-bold text-foreground">Alívio Futuro</h4>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">
          {{ insights.insights.alivio_futuro }}
        </p>
      </div>

      <!-- Quick Actions Card -->
      <div class="bg-card rounded-xl border p-6 space-y-3">
        <div class="flex items-center gap-2 text-blue-600">
          <TrendingDown class="w-5 h-5" />
          <h4 class="font-bold text-foreground">Ações Imediatas</h4>
        </div>
        <ul class="space-y-2">
          <li 
            v-for="(action, idx) in insights.insights.acoes_imediatas" 
            :key="idx"
            class="flex gap-2 text-sm"
          >
            <span class="text-blue-600 font-bold">{{idx + 1}}.</span>
            <span class="text-muted-foreground">{{ action }}</span>
          </li>
        </ul>
      </div>

      <!-- Alerts Card -->
      <div class="bg-card rounded-xl border p-6 space-y-3">
        <div class="flex items-center gap-2 text-red-600">
          <AlertTriangle class="w-5 h-5" />
          <h4 class="font-bold text-foreground">Alertas</h4>
        </div>
        <ul class="space-y-2">
          <li 
            v-for="(alert, idx) in insights.insights.alertas" 
            :key="idx"
            class="text-sm text-muted-foreground flex gap-2"
          >
            <span class="text-red-500">⚠️</span>
            <span>{{ alert }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
