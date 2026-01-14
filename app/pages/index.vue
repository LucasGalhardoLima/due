<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { addMonths, subMonths, getMonth, getYear } from 'date-fns'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'

// Global State
const currentDate = ref(new Date())

// API Query Params
const queryParams = computed(() => ({
    month: getMonth(currentDate.value) + 1,
    year: getYear(currentDate.value)
}))

interface SummaryResponse {
    month: number
    year: number
    total: number
    limit: number
    available: number
    transactions: Record<string, any[]>
}

// Fetch Data
const { data: summary, refresh: refreshSummary } = await useFetch<SummaryResponse>('/api/invoices/summary', {
    query: queryParams
})
// Keep existing for now, but eventually replace with consolidated logic?
// Keeping futureProjection and pareto for now as they are "Global" or "Future" insights not tied strictly to "Current Selection"
// actually future projection is always "Next 3 months from NOW", so independent of selection.
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

import TransactionList from '@/components/transaction/TransactionList.vue'
import InsightCard from '@/components/dashboard/InsightCard.vue'

const isDrawerOpen = ref(false)
function onSaved() {
  refreshSummary()
  refreshFuture()
  refreshPareto()
  // Insight component watches props, so it might auto update if month changes, 
  // but here we just added a transaction, so maybe we need to force update?
  // Ideally use a global store or event bus, but for now it's fine.
}
</script>

<template>
  <div class="container mx-auto py-8 space-y-8 pb-24">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div class="flex gap-4">
        <NuxtLink to="/legacy" class="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Importar Legado
        </NuxtLink>
        <NuxtLink to="/cards" class="text-sm font-medium text-primary hover:underline">
            Gerenciar Cartões
        </NuxtLink>
      </div>
    </div>

    <!-- Month Navigation & Main KPI -->
    <div class="flex flex-col items-center space-y-4">
        <!-- Insight Card (Full Width) -->
        <div class="w-full max-w-md">
            <InsightCard :month="summary?.month || 1" :year="summary?.year || 2024" />
        </div>

        <div class="flex items-center space-x-4 bg-muted/30 p-2 rounded-full">
            <button @click="prevMonth" class="p-2 hover:bg-muted rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span class="font-semibold text-lg min-w-[120px] text-center">
                {{ getMonthName(summary?.month || 1) }}/{{ summary?.year }}
            </span>
            <button @click="nextMonth" class="p-2 hover:bg-muted rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
        </div>

        <div class="w-full max-w-md rounded-xl border bg-card text-card-foreground shadow p-6 text-center space-y-2">
            <div class="text-sm text-muted-foreground uppercase tracking-wide">Fatura Estimada</div>
            <div class="text-4xl font-bold text-primary">{{ formatCurrency(summary?.total || 0) }}</div>
            <div class="text-xs text-muted-foreground flex justify-center gap-2">
                <span>Limite: {{ formatCurrency(summary?.limit || 0) }}</span>
                <span>•</span>
                <span>Disponível: <span class="text-green-600 font-medium">{{ formatCurrency(summary?.available || 0) }}</span></span>
            </div>
            
            <!-- Safe gauge bar -->
            <div class="w-full bg-secondary h-2 rounded-full mt-4 overflow-hidden">
                <div class="bg-primary h-full transition-all duration-500" 
                     :style="{ width: `${Math.min(((summary?.total || 0) / (summary?.limit || 1)) * 100, 100)}%` }">
                </div>
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
          <div v-for="proj in futureProjection?.projections" :key="`${proj.month}-${proj.year}`" 
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
            <div class="h-2 rounded-full bg-primary" :style="{ width: `${cat.percentage}%` }"></div>
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
        <TransactionList :transactions="summary?.transactions || {}" />
    </div>

    <!-- Quick Add Button (Floating or Inline) -->
    <!-- We will add functionality later, for now just a link/button placeholder -->
    <div class="fixed bottom-8 right-8">
      <button @click="isDrawerOpen = true" class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      </button>
    </div>

    <TransactionDrawer v-model:open="isDrawerOpen" @saved="onSaved" />

  </div>
</template>
