<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { addMonths, subMonths, getMonth, getYear } from 'date-fns'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'vue-sonner'
import { Check, AlertCircle, Sparkles, Loader2  } from 'lucide-vue-next'

import TransactionList from '@/components/transaction/TransactionList.vue'
import InsightCard from '@/components/dashboard/InsightCard.vue'
import AdvisorCard from '@/components/dashboard/AdvisorCard.vue'

// Global State
const currentDate = ref(new Date())
const selectedCardId = ref<string>('all')
const editingTransactionId = ref<string | null>(null)

// API Query Params
const queryParams = computed(() => ({
    month: getMonth(currentDate.value) + 1,
    year: getYear(currentDate.value),
    cardId: selectedCardId.value === 'all' ? undefined : selectedCardId.value
}))

interface SummaryResponse {
    month: number
    year: number
    total: number
    limit: number
    budget?: number
    available: number
    transactions: Record<string, unknown[]>
    status?: 'OPEN' | 'PAID' | 'CLOSED'
}

// Fetch Data
const { data: summary, refresh: refreshSummary } = await useFetch<SummaryResponse>('/api/invoices/summary', {
    key: 'dashboard-summary', // Enable global access for optimistic updates
    query: queryParams
})

// Fetch cards to check if user has any
const { data: cards } = await useFetch('/api/cards')

// Keeping futureProjection and pareto for now
const { data: futureProjection, refresh: refreshFuture } = await useFetch('/api/dashboard/future-projection')
const { data: pareto, refresh: refreshPareto } = await useFetch('/api/dashboard/pareto')

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function getMonthName(monthIndex: number) {
  return months[monthIndex - 1]
}

function nextMonth() {
    currentDate.value = addMonths(currentDate.value, 1)
}

function prevMonth() {
    currentDate.value = subMonths(currentDate.value, 1)
}

const isDrawerOpen = ref(false)

function handleEdit(tx: any) {
  editingTransactionId.value = tx.transactionId
  isDrawerOpen.value = true
}

// Reset ID when drawer closes
watch(isDrawerOpen, (val) => {
  if (!val) {
    setTimeout(() => {
        editingTransactionId.value = null
    }, 300)
  }
})

function onSaved() {
  refreshFuture()
  refreshPareto()
}

// Progress bar computed properties
const usagePercentage = computed(() => {
  if (!summary.value) return 0
  // Use Budget if exists and > 0, otherwise Limit
  const base = (summary.value.budget && summary.value.budget > 0) ? summary.value.budget : summary.value.limit
  if (!base || base === 0) return 0
  return Math.min((summary.value.total / base) * 100, 100)
})

const isOverBudget = computed(() => {
    if (!summary.value || !summary.value.budget) return false
    return summary.value.total > summary.value.budget
})

const progressColor = computed(() => {
  const pct = usagePercentage.value
  // Game Logic:
  // 90%+ : Red (Danger)
  // 70-90% : Yellow (Warning)
  // 0-70% : Green (Safe)
  if (pct >= 90) return 'bg-red-600'
  if (pct >= 70) return 'bg-yellow-500'
  return 'bg-green-600'
})

const showAlert = computed(() => usagePercentage.value >= 70)

// Payment Logic
const showPayConfirm = ref(false)

function onPayClick() {
    showPayConfirm.value = true
}

async function handlePayInvoice() {
    if (selectedCardId.value === 'all') return

    try {
        await $fetch('/api/invoices/pay', {
            method: 'POST',
            body: {
                cardId: selectedCardId.value,
                month: getMonth(currentDate.value) + 1,
                year: getYear(currentDate.value)
            }
        })
        
        await refreshSummary()
        toast.success('Fatura paga com sucesso!')
    } catch (e) {
        console.error(e)
        toast.error('Erro ao pagar fatura')
    }
}

// Advisor Logic
interface AdvisorAnalysis {
    verdict: string
    severity: 'info' | 'warning' | 'critical'
    title: string
    message: string
    action: string
}

const showAdvisor = ref(false)
const advisorLoading = ref(false)
const advisorResult = ref<AdvisorAnalysis | null>(null)

async function runAnalysis() {
    if (showAdvisor.value && advisorResult.value) {
        showAdvisor.value = false // Toggle off
        return
    }

    showAdvisor.value = true
    advisorLoading.value = true
    advisorResult.value = null // Reset

    try {
        const result = await $fetch<AdvisorAnalysis>('/api/advisor/analyze', {
            method: 'POST',
            body: {
                month: getMonth(currentDate.value) + 1,
                year: getYear(currentDate.value),
                cardId: selectedCardId.value === 'all' ? undefined : selectedCardId.value
            }
        })
        advisorResult.value = result
    } catch (e) {
        console.error(e)
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        toast.error('Não foi possível analisar a fatura: ' + errorMessage)
        showAdvisor.value = false
    } finally {
        advisorLoading.value = false
    }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 space-y-8 pb-24">
    <!-- Empty State: No Cards -->
    <div v-if="!cards || cards.length === 0" class="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div class="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
          <rect width="20" height="14" x="2" y="5" rx="2"/>
          <line x1="2" x2="22" y1="10" y2="10"/>
        </svg>
      </div>
      <div class="text-center space-y-2 max-w-md">
        <h2 class="text-2xl font-bold">Vamos configurar seu cartão principal?</h2>
        <p class="text-muted-foreground">
          Para começar a controlar suas despesas, você precisa cadastrar pelo menos um cartão de crédito.
        </p>
      </div>
      <NuxtLink 
        to="/cards" 
        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
      >
        Adicionar Primeiro Cartão
      </NuxtLink>
    </div>

    <!-- Main Dashboard Content -->
    <template v-else>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div class="flex items-center gap-3">
          <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
          <button 
            class="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-sm font-medium transition-colors hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
            @click="runAnalysis"
          >
            <Sparkles v-if="!advisorLoading" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            {{ showAdvisor ? 'Fechar Análise' : 'Analisar' }}
          </button>
      </div>
      
      <!-- Card Filter -->
      <div class="w-full md:w-[200px]">
        <Select v-model="selectedCardId">
          <SelectTrigger>
            <SelectValue placeholder="Todos os Cartões" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Cartões</SelectItem>
            <SelectItem v-for="card in cards" :key="card.id" :value="card.id">
              {{ card.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Month Navigation & Main KPI -->
    <div class="flex flex-col items-center space-y-4">
        <!-- Insight Card (Full Width) -->
        <div class="w-full max-w-md">
            <div v-if="!showAdvisor">
                <InsightCard :month="summary?.month || 1" :year="summary?.year || 2024" />
            </div>
            <div v-else>
                <AdvisorCard :analysis="advisorResult" :loading="advisorLoading" />
            </div>
        </div>

        <div class="flex items-center space-x-4 bg-muted/30 p-2 rounded-full">
            <button class="p-2 hover:bg-muted rounded-full transition-colors" @click="prevMonth">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span class="font-semibold text-lg min-w-[120px] text-center">
                {{ getMonthName(summary?.month || 1) }}/{{ summary?.year }}
            </span>
            <button class="p-2 hover:bg-muted rounded-full transition-colors" @click="nextMonth">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
        </div>

        <div class="w-full max-w-md rounded-xl border bg-card text-card-foreground shadow p-6 text-center space-y-2">
            <div class="text-sm text-muted-foreground uppercase tracking-wide">Fatura Estimada</div>
            <div class="text-4xl font-bold text-primary">{{ formatCurrency(summary?.total || 0) }}</div>
            <div class="text-xs text-muted-foreground flex justify-center gap-2">
                <span v-if="summary?.budget && summary.budget > 0" class="font-medium text-indigo-600">
                    Meta: {{ formatCurrency(summary.budget) }}
                </span>
                <span v-else>Limite: {{ formatCurrency(summary?.limit || 0) }}</span>
                
                <span>•</span>
                <span>Disponível: <span class="text-green-600 font-medium">{{ formatCurrency(summary?.available || 0) }}</span></span>
            </div>
            
            <!-- Invoice Status Badge (Only for specific card) -->
            <div v-if="selectedCardId !== 'all' && summary?.status" class="flex justify-center mt-2">
                <span 
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="summary.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
                >
                    <component :is="summary.status === 'PAID' ? Check : AlertCircle" class="w-3 h-3" />
                    {{ summary.status === 'PAID' ? 'Fatura Paga' : 'Fatura Aberta' }}
                </span>
            </div>
            
            <!-- Alert Badge -->
            <div v-if="showAlert" class="flex items-center justify-center gap-2 mt-2" :class="usagePercentage >= 90 ? 'text-red-600' : 'text-yellow-600'">
              <component :is="usagePercentage >= 90 ? AlertCircle : Sparkles" class="w-4 h-4" />
              <span class="text-sm font-medium">
                {{ usagePercentage >= 100 ? (isOverBudget ? 'Meta estourada!' : 'Limite atingido!') : (usagePercentage >= 90 ? 'Zona de Perigo (90%+)' : 'Atenção (70%+)') }}
              </span>
            </div>

            <!-- Dynamic gauge bar -->
            <div class="w-full bg-secondary h-2 rounded-full mt-4 overflow-hidden relative">
                <div 
                  :class="[progressColor, usagePercentage >= 90 && 'animate-pulse']" 
                  class="h-full transition-all duration-700 ease-out" 
                  :style="{ width: `${usagePercentage}%` }"
                />
            </div>
            
            <!-- Percentage display -->
            <div class="text-xs text-muted-foreground mt-1">
              {{ usagePercentage.toFixed(1) }}% da {{ (summary?.budget && summary.budget > 0) ? 'meta' : 'fatura' }} utilizada
            </div>

            <!-- Pay Button (Only if specific card and NOT paid) -->
            <div v-if="selectedCardId !== 'all' && summary?.status !== 'PAID'" class="pt-4">
                <button 
                    class="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                    @click="onPayClick"
                >
                    Pagar Fatura
                </button>
            </div>
            
            <div v-else-if="selectedCardId !== 'all' && summary?.status === 'PAID'" class="pt-4 text-center text-sm text-green-600 font-medium">
                Esta fatura já foi paga em {{ new Date().toLocaleDateString() /* TODO: Store pay date */ }}
            </div>
        </div>
    </div>
    <!-- Future Projection -->
    <div class="rounded-xl border bg-card text-card-foreground shadow">
      <div class="p-6 pb-4">
        <h3 class="text-lg font-semibold">Projeção Futura (Danos Contratados)</h3>
        <p class="text-sm text-muted-foreground">O que já está parcelado para os próximos meses.</p>
      </div>
      <div class="p-6 pt-0">
        <div class="grid gap-4 md:grid-cols-3">
          <div
v-for="proj in futureProjection?.projections" :key="`${proj.month}-${proj.year}`" 
               class="flex flex-col p-4 rounded-lg bg-muted/50 border">
            <span class="text-sm font-medium text-muted-foreground uppercase">{{ getMonthName(proj.month) }}/{{ proj.year }}</span>
            <span class="text-xl font-bold mt-1">{{ formatCurrency(proj.total || 0) }}</span>
            <span class="text-xs text-muted-foreground mt-1">{{ proj.installmentsCount }} parcelas</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pareto Analysis -->
    <div class="rounded-xl border bg-card text-card-foreground shadow">
      <div class="p-6 pb-4">
        <h3 class="text-lg font-semibold">Análise de Pareto</h3>
        <p class="text-sm text-muted-foreground">Onde seu dinheiro está indo (Top Categorias).</p>
      </div>
      <div class="p-6 pt-0 space-y-4">
        <div v-for="cat in pareto?.categories.slice(0, 5)" :key="cat.name" class="space-y-1">
          <div class="flex justify-between text-sm">
            <span class="font-medium">{{ cat.name }}</span>
            <span class="text-muted-foreground">{{ formatCurrency(cat.total) }} ({{ cat.percentage }}%)</span>
          </div>
          <div class="h-2 w-full rounded-full bg-secondary">
            <div class="h-2 rounded-full bg-primary" :style="{ width: `${cat.percentage}%` }"/>
          </div>
        </div>
        <div v-if="!pareto?.categories?.length" class="text-sm text-muted-foreground py-4">
          Nenhuma despesa registrada ainda.
        </div>
      </div>
    </div>
    
    <!-- Transaction List -->
    <div class="rounded-xl border bg-card text-card-foreground shadow p-6">
        <h3 class="text-lg font-semibold mb-4">Lançamentos</h3>
        <!-- Pass empty object if undefined to avoid errors -->
        <TransactionList :transactions="summary?.transactions || {}" @edit="handleEdit" />
    </div>

    <!-- Quick Add Button (Floating or Inline) -->
    <!-- We will add functionality later, for now just a link/button placeholder -->
    <div class="fixed bottom-8 right-8">
      <button class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors" @click="isDrawerOpen = true">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      </button>
    </div>

    <TransactionDrawer v-model:open="isDrawerOpen" :transaction-id="editingTransactionId" @saved="onSaved" />

    <ConfirmDialog 
      v-model:open="showPayConfirm"
      title="Pagar Fatura?"
      description="Isso marcará a fatura deste mês como paga. O limite será liberado no próximo ciclo (simulação)."
      confirm-text="Confirmar Pagamento"
      @confirm="handlePayInvoice"
    />

    </template>
  </div>
</template>
