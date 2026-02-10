<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { addMonths, subMonths, getMonth, getYear, differenceInDays, parseISO } from 'date-fns'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Sparkles, ChevronLeft, ChevronRight, CreditCard as CreditCardIcon, Calendar as CalendarIcon  } from 'lucide-vue-next'

import TransactionList from '@/components/transaction/TransactionList.vue'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton.vue'
import AIInsights from '@/components/dashboard/AIInsights.vue'
import AIMobileDrawer from '@/components/dashboard/AIMobileDrawer.vue'
import SummaryCards from '@/components/dashboard/SummaryCards.vue'
import PurchaseSimulator from '@/components/dashboard/PurchaseSimulator.vue'
import ProactiveAdvisor from '@/components/dashboard/ProactiveAdvisor.vue'
import CrisisAlertCard from '@/components/dashboard/CrisisAlertCard.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { Card } from '@/components/ui/card'
import { useProactiveAdvisor } from '@/composables/useProactiveAdvisor'

// Proactive Advisor
const advisor = useProactiveAdvisor()
const { dataVersion } = useDataVersion()

// Global State
const currentDate = ref(new Date())
const selectedCardId = ref<string>('')
const editingTransactionId = ref<string | null>(null)

// API Query Params
const queryParams = computed(() => ({
    month: getMonth(currentDate.value) + 1,
    year: getYear(currentDate.value),
    cardId: selectedCardId.value || undefined,
    v: dataVersion.value
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
    dueDate?: string
}

interface CardItem {
  id: string
  name: string
  isDefault?: boolean
}

interface FutureProjectionResponse {
  projections: { month: number; year: number; total: number; installmentsCount: number }[]
}

interface ParetoCategory {
  name: string
  total: number
  percentage: number
  color?: string
}

interface ParetoResponse {
  categories: ParetoCategory[]
  grandTotal: number
  month: number
  year: number
}

interface CrisisAlert {
  type: 'future_shortage' | 'spending_trend_alert'
  [key: string]: unknown
}

interface TransactionListItem {
  transactionId: string
}

// Fetch Data
const summaryKey = computed(() => {
  const params = queryParams.value
  return `dashboard-summary-${params.year}-${params.month}-${params.cardId ?? 'all'}-v${dataVersion.value}`
})

const { data: summary, refresh: refreshSummary, status: summaryStatus } = useFetch<SummaryResponse>('/api/invoices/summary', {
    key: summaryKey, // Ensure cache key matches current month/card selection
    query: queryParams,
    watch: [queryParams]
})

const demoCookie = useCookie('demo_mode', { maxAge: 60 * 60 * 24 * 30, path: '/' })
const isDemoMode = computed(() => String(demoCookie.value) === 'true')

const daysToDue = computed(() => {
    let dueDateStr = summary.value?.dueDate
    
    // Fallback for Demo Mode if dueDate is missing (e.g. in Global View)
    if (!dueDateStr && isDemoMode.value) {
        const fallbackDate = new Date()
        fallbackDate.setDate(fallbackDate.getDate() + 5)
        dueDateStr = fallbackDate.toISOString()
    }

    if (!dueDateStr) return null
    const today = new Date()
    const due = parseISO(dueDateStr)
    return differenceInDays(due, today)
})

// Fetch cards to check if user has any
const { data: cards, status: cardsStatus } = useFetch<CardItem[]>('/api/cards')

// Keeping futureProjection and pareto for now
const { data: futureProjection, refresh: refreshFuture } = useFetch<FutureProjectionResponse>('/api/dashboard/future-projection', {
  key: computed(() => `dashboard-future-projection-v${dataVersion.value}`)
})
const { data: pareto, refresh: refreshPareto } = useFetch<ParetoResponse>('/api/dashboard/pareto', {
  key: computed(() => `dashboard-pareto-v${dataVersion.value}`)
})

// Fetch Crisis Alerts
const { data: crisisAlerts } = useFetch<CrisisAlert[]>('/api/reports/crisis-alerts', {
  key: 'crisis-alerts',
  query: computed(() => ({ cardId: selectedCardId.value || undefined }))
})

const isLoading = computed(() => summaryStatus.value === 'pending' || cardsStatus.value === 'pending')

// Select Default Card on Load
watch(cards, (newCards) => {
  if (newCards && newCards.length > 0 && !selectedCardId.value) {
    const defaultCard = newCards.find(c => c.isDefault) || newCards[0]
    if (defaultCard) selectedCardId.value = defaultCard.id
  }
}, { immediate: true })

// Proactive Advisor Triggers
onMounted(() => {
  // Morning check - only once per session
  if (advisor.shouldShowForTrigger('morning_check')) {
    advisor.trigger('morning_check', { cardId: selectedCardId.value || undefined })
  }
})

// Watch for pre-fechamento trigger (when <=5 days to closing)
watch(daysToDue, (days) => {
  if (days !== null && days <= 5 && days > 0) {
    if (advisor.shouldShowForTrigger('pre_fechamento')) {
      advisor.trigger('pre_fechamento', { cardId: selectedCardId.value || undefined })
    }
  }
}, { immediate: true })

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
const isAIDrawerOpen = ref(false)

function handleEdit(tx: TransactionListItem) {
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
  const s = summary.value
  // Prioritize Budget (Meta) for the gauge
  const base = (s.budget && s.budget > 0) ? s.budget : s.limit
  if (!base || base === 0) return 0
  
  // Allow > 100% to show overflow
  return (s.total / base) * 100
})


// Top spending category
const topCategory = computed(() => {
  if (!pareto.value?.categories || pareto.value.categories.length === 0) return null
  const top = pareto.value.categories[0]
  if (!top) return null
  return {
    name: top.name || 'Outros',
    amount: top.total || 0,
    color: top.color
  }
})

// Methods
const handlePayInvoice = async () => {
    if (!summary.value || !selectedCardId.value) return
    try {
        await $fetch('/api/invoices/pay', {
            method: 'POST',
            body: {
                cardId: selectedCardId.value,
                month: summary.value.month,
                year: summary.value.year
            }
        })
        toast.success('Fatura paga com sucesso!')
        refreshSummary()
    } catch {
        toast.error('Erro ao pagar fatura.')
    } finally {
        showPayConfirm.value = false
    }
}

const showPayConfirm = ref(false)
</script>

<template>
  <div class="app-page relative min-h-screen">

    <DashboardSkeleton v-if="isLoading" />

    <template v-else-if="summary">
      <!-- Desktop Header (Original) -->
      <PageHeader 
        :title="`${getMonthName(summary.month)} ${summary.year}`"
        subtitle="Visão geral da sua saúde financeira."
        :icon="CalendarIcon"
        class="hidden lg:flex"
      >
        <template #actions>
          <div class="flex items-center gap-3">
            <!-- Card Selector -->
            <Select v-model="selectedCardId">
              <SelectTrigger class="w-[220px] bg-card border-border/70 rounded-2xl shadow-elevation-1">
                <SelectValue placeholder="Todos os Cartões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="card in cards" :key="card.id" :value="card.id">
                  {{ card.name }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Month Navigation Buttons -->
            <div class="flex items-center bg-muted/40 rounded-2xl p-1 border border-border/70 shadow-elevation-1">
              <button class="p-2.5 hover:bg-background rounded-xl transition-colors text-muted-foreground hover:text-foreground" @click="prevMonth">
                <span class="sr-only">Anterior</span>
                <ChevronLeft class="w-4 h-4" />
              </button>
              <button class="p-2.5 hover:bg-background rounded-xl transition-colors text-muted-foreground hover:text-foreground" @click="nextMonth">
                <span class="sr-only">Proximo</span>
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </template>
      </PageHeader>

      <!-- Mobile Header & Navigation (New) -->
      <div class="lg:hidden space-y-4 mb-7">
        <div>
          <h1 class="text-h1">Dashboard</h1>
          <p class="text-body text-muted-foreground">Visao geral.</p>
        </div>

        <!-- Mobile Controls Row -->
        <div class="flex items-center gap-3">
           <!-- Card Selector (Mobile) -->
            <Select v-model="selectedCardId">
              <SelectTrigger class="flex-1 bg-card border-border/70 shadow-elevation-1 rounded-2xl">
                <div class="flex items-center gap-2 truncate">
                  <span class="bg-primary/10 p-1 rounded-lg shrink-0">
                    <CreditCardIcon class="w-3.5 h-3.5 text-primary" />
                  </span>
                  <span class="truncate text-small font-semibold">{{
                    selectedCardId === ''
                      ? 'Selecione um Cartao'
                      : cards?.find(c => c.id === selectedCardId)?.name || 'Selecione um Cartao'
                  }}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="card in cards" :key="card.id" :value="card.id">
                  {{ card.name }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Month Navigation (Pill) -->
            <div class="flex items-center bg-card border border-border/70 rounded-full h-10 shadow-elevation-2 shrink-0 px-1">
               <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground" @click="prevMonth">
                <ChevronLeft class="w-4 h-4" />
              </Button>
               <span class="text-small font-bold px-2 whitespace-nowrap text-foreground min-w-[70px] text-center">
                {{ months[summary.month - 1] }}/{{ summary.year }}
               </span>
              <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground" @click="nextMonth">
                <ChevronRight class="w-4 h-4" />
              </Button>
            </div>
        </div>
      </div>

      <!-- Section 1: Crisis Alerts + Summary -->
      <div class="space-y-5">
        <!-- Crisis Alerts -->
        <div v-if="crisisAlerts && crisisAlerts.length > 0" class="space-y-4">
          <div v-for="(alert, idx) in crisisAlerts" :key="idx" class="animate-in fade-in slide-in-from-top-4 duration-500">
            <CrisisAlertCard :alert="alert" />
          </div>
        </div>

        <!-- Summary Cards (own grid) -->
        <SummaryCards
          :total="summary.total"
          :limit="summary.limit"
          :budget="summary.budget"
          :usage-percentage="usagePercentage"
          :days-to-due="daysToDue"
          :status="summary.status"
          :top-category="topCategory || undefined"
          @pay="showPayConfirm = true"
        />
      </div>

      <!-- Section 2: Main + Sidebar -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <!-- Left: Transactions -->
        <Card class="p-6 overflow-hidden">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-h2">Lançamentos</h2>
          </div>
          <TransactionList :transactions="summary.transactions || {}" @edit="handleEdit" />
        </Card>

        <!-- Right: Sidebar stack -->
        <div class="space-y-5">
          <!-- Proactive Advisor -->
          <ProactiveAdvisor v-if="advisor.hasMessage.value || advisor.isLoading.value" class="hidden lg:block" />

          <!-- AI Insights -->
          <div class="hidden lg:block">
            <AIInsights :month="summary.month" :year="summary.year" />
          </div>

          <!-- Purchase Simulator -->
          <div v-if="selectedCardId && cards && cards.length > 0" class="hidden lg:block">
            <PurchaseSimulator
              :card-id="selectedCardId"
              :card-name="cards.find(c => c.id === selectedCardId)?.name || ''"
            />
          </div>

          <!-- Future Projection -->
          <Card v-if="futureProjection" class="overflow-hidden p-0 hidden lg:block">
            <div class="p-4 border-b border-border bg-muted/30">
              <h3 class="text-micro text-muted-foreground">Projeção Futura</h3>
            </div>
            <div class="p-4 space-y-3">
              <div
                v-for="proj in futureProjection.projections" :key="`${proj.month}-${proj.year}`"
                class="flex justify-between items-center p-3 rounded-2xl bg-muted/40 border border-border/70 hover:border-secondary/40 transition-colors group"
              >
                <div class="flex flex-col">
                  <span class="text-micro text-muted-foreground">{{ getMonthName(proj.month) }}/{{ proj.year }}</span>
                  <span class="text-small text-muted-foreground">{{ proj.installmentsCount }} parcelas</span>
                </div>
                <span class="text-body font-black group-hover:text-primary transition-colors">{{ formatCurrency(proj.total || 0) }}</span>
              </div>
              <div v-if="!futureProjection.projections?.length" class="text-small text-muted-foreground text-center py-4">
                Nenhuma projeção futura.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <div v-else-if="cardsStatus === 'success' && !cards?.length" class="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div class="p-6 rounded-[2rem] bg-card border border-border shadow-elevation-2 max-w-md">
         <CreditCardIcon class="w-12 h-12 text-primary mx-auto mb-4" />
         <h2 class="text-h2 mb-2">Nenhum cartão encontrado</h2>
         <p class="text-muted-foreground mb-6">Você precisa cadastrar seu primeiro cartão para começar a gerenciar suas finanças.</p>
         <Button class="w-full" @click="navigateTo('/cards')">Cadastrar Cartão</Button>
      </div>
    </div>

    <!-- AI FAB (Mobile Only) -->
    <button
      class="lg:hidden fixed bottom-24 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-card border border-ai-accent/30 shadow-elevation-2 text-ai-accent hover:bg-ai-accent/10 transition-all active:scale-95"
      aria-label="Abrir assistente IA"
      @click="isAIDrawerOpen = true"
    >
      <Sparkles class="h-6 w-6" aria-hidden="true" />
    </button>

    <!-- Drawer Component -->
    <TransactionDrawer v-model:open="isDrawerOpen" :transaction-id="editingTransactionId" @saved="onSaved" />
    
    <!-- AI Mobile Drawer -->
    <AIMobileDrawer 
      v-model:open="isAIDrawerOpen" 
      :selected-card-id="selectedCardId"
      :card-name="cards?.find(c => c.id === selectedCardId)?.name"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog 
      v-model:open="showPayConfirm"
      title="Pagar Fatura?"
      description="Isso marcará a fatura deste mês como paga. O limite será liberado no próximo ciclo (simulação)."
      confirm-text="Confirmar Pagamento"
      @confirm="handlePayInvoice"
    />
  </div>
</template>
