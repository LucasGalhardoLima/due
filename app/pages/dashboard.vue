<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { addMonths, subMonths, getMonth, getYear, differenceInDays, parseISO } from 'date-fns'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Check, AlertCircle, Sparkles, Loader2, PlusCircle, TrendingDown, Calculator, ChevronLeft, ChevronRight, CreditCard as CreditCardIcon, Clock } from 'lucide-vue-next'

import TransactionList from '@/components/transaction/TransactionList.vue'
import AIInsights from '@/components/dashboard/AIInsights.vue'
import AIMobileDrawer from '@/components/dashboard/AIMobileDrawer.vue'
import SummaryCards from '@/components/dashboard/SummaryCards.vue'
import CategoryBubbleChart from '@/components/dashboard/CategoryBubbleChart.vue'
import PurchaseSimulator from '@/components/dashboard/PurchaseSimulator.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { Card } from '@/components/ui/card'
import { Calendar as CalendarIcon } from 'lucide-vue-next'

// Global State
const currentDate = ref(new Date())
const selectedCardId = ref<string>('')
const editingTransactionId = ref<string | null>(null)

// API Query Params
const queryParams = computed(() => ({
    month: getMonth(currentDate.value) + 1,
    year: getYear(currentDate.value),
    cardId: selectedCardId.value || undefined
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

// Fetch Data
const { data: summary, refresh: refreshSummary } = await useFetch<SummaryResponse>('/api/invoices/summary', {
    key: 'dashboard-summary', // Enable global access for optimistic updates
    query: queryParams
})

const daysToDue = computed(() => {
    if (!summary.value?.dueDate) return null
    const today = new Date()
    const due = parseISO(summary.value.dueDate)
    return differenceInDays(due, today)
})

// Fetch cards to check if user has any
const { data: cards } = await useFetch('/api/cards')

// Keeping futureProjection and pareto for now
const { data: futureProjection, refresh: refreshFuture } = await useFetch('/api/dashboard/future-projection')
const { data: pareto, refresh: refreshPareto } = await useFetch('/api/dashboard/pareto')

// Select Default Card on Load
watch(cards, (newCards) => {
  if (newCards && newCards.length > 0 && !selectedCardId.value) {
    const defaultCard = newCards.find(c => (c as any).isDefault) || newCards[0]
    if (defaultCard) selectedCardId.value = defaultCard.id
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
  const s = summary.value
  // Prioritize Budget (Meta) for the gauge
  const base = (s.budget && s.budget > 0) ? s.budget : s.limit
  if (!base || base === 0) return 0
  
  // Allow > 100% to show overflow
  return (s.total / base) * 100
})

const isOverBudget = computed(() => {
    // True if usage > 100% (regardless if base is Budget or Limit)
    return usagePercentage.value > 100
})

const progressColor = computed(() => {
  const pct = usagePercentage.value
  if (!summary.value) return 'bg-green-600'
  // Game Logic:
  // > 100% : Red (Over Budget/Limit)
  // 90-100% : Red (Danger Zone)
  // 70-90% : Yellow (Warning)
  // 0-70% : Green (Safe)
  if (pct >= 90) return 'bg-red-600'
  if (pct >= 70) return 'bg-yellow-500'
  return 'bg-green-600'
})

const showAlert = computed(() => usagePercentage.value >= 70)

// Top spending category
const topCategory = computed(() => {
  if (!pareto.value?.categories || pareto.value.categories.length === 0) return null
  const top = pareto.value.categories[0]
  if (!top) return null
  return {
    name: top.name || 'Outros',
    amount: top.total || 0,
    color: (top as any).color
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
    } catch (e) {
        toast.error('Erro ao pagar fatura.')
    } finally {
        showPayConfirm.value = false
    }
}

const showPayConfirm = ref(false)
</script>

<template>
  <div class="space-y-8 relative min-h-screen">

    <template v-if="summary">
      <!-- Desktop Header (Original) -->
      <PageHeader 
        :title="`${getMonthName(summary.month)} ${summary.year}`"
        subtitle="Visão geral da sua saúde financeira."
        :icon="CalendarIcon"
        class="hidden lg:flex"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <!-- Card Selector -->
            <Select v-model="selectedCardId">
              <SelectTrigger class="w-[180px] bg-card border-border/60">
                <SelectValue placeholder="Todos os Cartões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="card in cards" :key="card.id" :value="card.id">
                  {{ card.name }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Month Navigation Buttons -->
            <div class="flex items-center bg-muted/30 rounded-xl p-1 border shadow-elevation-1">
              <button @click="prevMonth" class="p-2 hover:bg-background rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <span class="sr-only">Anterior</span>
                <ChevronLeft class="w-4 h-4" />
              </button>
              <button @click="nextMonth" class="p-2 hover:bg-background rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <span class="sr-only">Proximo</span>
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </template>
      </PageHeader>

      <!-- Mobile Header & Navigation (New) -->
      <div class="lg:hidden space-y-4 mb-6">
        <div>
          <h1 class="text-h1">Dashboard</h1>
          <p class="text-body text-muted-foreground">Visao geral.</p>
        </div>

        <!-- Mobile Controls Row -->
        <div class="flex items-center gap-3">
           <!-- Card Selector (Mobile) -->
            <Select v-model="selectedCardId">
              <SelectTrigger class="flex-1 bg-card border-border/60 shadow-elevation-1 rounded-xl">
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
            <div class="flex items-center bg-zinc-900 border border-border/40 rounded-full h-10 shadow-elevation-2 shrink-0 px-1">
               <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-white/10 text-white" @click="prevMonth">
                <ChevronLeft class="w-4 h-4" />
              </Button>
               <span class="text-small font-bold px-2 whitespace-nowrap text-white min-w-[70px] text-center">
                {{ months[summary.month - 1] }}/{{ summary.year }}
               </span>
              <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-white/10 text-white" @click="nextMonth">
                <ChevronRight class="w-4 h-4" />
              </Button>
            </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Main Stats & Insights (2/3 width) -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Hero Summary Cards (NEW) -->
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





          <!-- Transaction List -->
          <Card class="p-6 overflow-hidden">
              <div class="flex items-center justify-between mb-6">
                  <h2 class="text-h2">Lançamentos</h2>
              </div>
              <TransactionList :transactions="summary.transactions || {}" @edit="handleEdit" />
          </Card>
        </div>

        <!-- Right Column: Sidebar (1/3 width) -->
        <div class="space-y-8">

            <!-- Future Projection -->
            <Card class="overflow-hidden p-0" v-if="futureProjection">
              <div class="p-4 border-b border-white/10 bg-white/10 dark:bg-black/10">
                <h3 class="text-micro text-muted-foreground">Projeção Futura</h3>
              </div>
              <div class="p-4 space-y-3">
                  <div
                      v-for="proj in futureProjection.projections" :key="`${proj.month}-${proj.year}`"
                      class="flex justify-between items-center p-3 rounded-xl bg-white/5 dark:bg-black/20 border border-white/5 hover:border-primary/20 transition-colors group"
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

            <!-- AI Tools Group (Hidden on Mobile) -->
            <div class="hidden lg:flex flex-col gap-6">
              <AIInsights :month="summary.month" :year="summary.year" />
              
              <PurchaseSimulator 
                v-if="selectedCardId && cards && cards.length > 0"
                :cardId="selectedCardId"
                :cardName="cards.find(c => c.id === selectedCardId)?.name || ''"
              />
            </div>
        </div>
      </div>
    </template>

    <div v-else class="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <Loader2 class="w-10 h-10 animate-spin text-primary" />
      <p class="text-muted-foreground animate-pulse">Carregando dados financeiros...</p>
    </div>

    <!-- Quick Add Button (Floating - Desktop & Mobile) -->
    <div class="fixed bottom-8 right-8 z-50 flex flex-col items-center gap-4">
      <!-- AI FAB (Mobile Only) -->
      <button 
        class="lg:hidden flex h-12 w-12 items-center justify-center rounded-full bg-background/80 dark:bg-zinc-800/80 backdrop-blur-md text-primary border border-primary/20 shadow-glass hover:bg-primary/20 transition-all active:scale-95" 
        @click="isAIDrawerOpen = true"
      >
        <Sparkles class="h-6 w-6" />
      </button>

      <!-- Main Add Button -->
      <button class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 hover:scale-110 transition-all duration-300" @click="isDrawerOpen = true">
        <PlusCircle class="h-8 w-8" />
      </button>
    </div>

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
