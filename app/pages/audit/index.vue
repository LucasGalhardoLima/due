<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Papa from 'papaparse'
import { toast } from 'vue-sonner'
import { UploadCloud, Loader2, Search, Zap, Calendar, Edit2, Trash2, X, ChevronLeft, ChevronRight, ListFilter } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InvoiceAudit from '@/components/invoices/InvoiceAudit.vue'
import SubscriptionAnalysis from '@/components/reports/SubscriptionAnalysis.vue'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'

// Logic from Import page for parsing
const isDragging = ref(false)
const isProcessing = ref(false)
const selectedCardId = ref<string>('')
const selectedMonth = ref<string>(String(new Date().getMonth() + 1))
const selectedYear = ref<string>(String(new Date().getFullYear()))

// Data
interface CardOption {
  id: string
  name: string
}

interface CategoryOption {
  id: string
  name: string
}

interface AuditResult {
  status: 'divergent' | 'match'
  missing_in_app: unknown[]
  missing_in_bank: unknown[]
  duplicates: unknown[]
  suspicious: unknown[]
  total_divergence: number
  action_needed: boolean
}

interface SubscriptionAnalysisData {
  active_subscriptions: unknown[]
  total_wasted: number
  annual_waste: number
  quick_wins: string[]
}

interface Transaction {
  id: string
  description: string
  amount: number
  purchaseDate: string
  card: { name: string } | null
  category: { name: string } | null
}

interface TransactionsResponse {
  transactions: Transaction[]
  total: number
  page: number
  pageSize: number
}

const { data: cards } = useFetch<CardOption[]>('/api/cards')
const { data: categories } = useFetch<CategoryOption[]>('/api/categories')
const auditResult = ref<AuditResult | null>(null)
const subscriptionAnalysis = ref<SubscriptionAnalysisData | null>(null)

// Demo Mode State
const demoCookie = useCookie('demo_mode')
const isDemoMode = computed(() => demoCookie.value === 'true')

// Tab state
const activeTab = ref<'audit' | 'subscriptions' | 'transactions'>('audit')

// === Transactions tab state ===
const txSearch = ref('')
const txCardId = ref<string>('')
const txCategoryId = ref<string>('')
const txStartDate = ref('')
const txEndDate = ref('')
const txPage = ref(1)
const debouncedSearch = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(txSearch, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = val
    txPage.value = 1
  }, 300)
})

// Reset page when filters change
watch([txCardId, txCategoryId, txStartDate, txEndDate], () => {
  txPage.value = 1
})

const txQueryParams = computed(() => {
  const params: Record<string, string | number> = { page: txPage.value }
  if (debouncedSearch.value) params.search = debouncedSearch.value
  if (txCardId.value) params.cardId = txCardId.value
  if (txCategoryId.value) params.categoryId = txCategoryId.value
  if (txStartDate.value) params.startDate = txStartDate.value
  if (txEndDate.value) params.endDate = txEndDate.value
  return params
})

const { data: txResponse, refresh: refreshTx, status: txStatus } = useFetch<TransactionsResponse>('/api/admin/transactions', {
  query: txQueryParams,
  lazy: true
})

const txList = computed(() => txResponse.value?.transactions || [])
const txTotal = computed(() => txResponse.value?.total || 0)
const txTotalPages = computed(() => Math.ceil(txTotal.value / (txResponse.value?.pageSize || 50)))
const txLoading = computed(() => txStatus.value === 'pending')

const hasActiveFilters = computed(() =>
  !!(txSearch.value || txCardId.value || txCategoryId.value || txStartDate.value || txEndDate.value)
)

function clearFilters() {
  txSearch.value = ''
  debouncedSearch.value = ''
  txCardId.value = ''
  txCategoryId.value = ''
  txStartDate.value = ''
  txEndDate.value = ''
  txPage.value = 1
}

function txNextPage() {
  if (txPage.value < txTotalPages.value) txPage.value++
}

function txPrevPage() {
  if (txPage.value > 1) txPage.value--
}

// Edit
const isDrawerOpen = ref(false)
const editingTransactionId = ref<string | null>(null)

function handleEdit(id: string) {
  editingTransactionId.value = id
  isDrawerOpen.value = true
}

function onTransactionSaved() {
  refreshTx()
}

// Delete
const deleteDialogOpen = ref(false)
const deletingTransactionId = ref<string | null>(null)
const isDeleting = ref(false)

function confirmDelete(id: string) {
  deletingTransactionId.value = id
  deleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deletingTransactionId.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/transactions/${deletingTransactionId.value}`, { method: 'DELETE' })
    toast.success('Transação excluída.')
    refreshTx()
  } catch (e) {
    console.error(e)
    toast.error('Erro ao excluir transação.')
  } finally {
    isDeleting.value = false
    deleteDialogOpen.value = false
    deletingTransactionId.value = null
  }
}

// Formatters
function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function formatDateShort(dateStr: string) {
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
}

// Methods - Invoice Audit
function onDrop(e: DragEvent) {
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (files?.[0]) {
        handleFile(files[0])
    }
}

const fileInput = ref<HTMLInputElement | null>(null)

function onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files?.[0]) {
        handleFile(input.files[0])
    }
}

function handleFile(file: File) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Por favor envie um arquivo CSV.')
        return
    }

    if (!selectedCardId.value) {
        toast.error('Selecione um cartão primeiro.')
        return
    }

    isProcessing.value = true

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            await runAudit(results.data)
        },
        error: (err) => {
            console.error(err)
            toast.error('Erro ao ler CSV.')
            isProcessing.value = false
        }
    })
}

async function runAudit(rawRows: unknown[]) {
    // Normalize logic (same as Import)
    const items = []

    for(const row of rawRows) {
        const dateVal = row['date'] || row['Date'] || row['Data'] || row['Data Lançamento']
        const descVal = row['title'] || row['description'] || row['Description'] || row['Histórico'] || row['Estabelecimento']
        const amountVal = row['amount'] || row['Amount'] || row['Valor']

         if (dateVal && descVal && amountVal) {
             let numAmount = Number(amountVal)
            if (isNaN(numAmount) && typeof amountVal === 'string') {
                 numAmount = Number(amountVal.replace(',', '.'))
            }

            if (!isNaN(numAmount)) {
                let isoDate = dateVal
                if (dateVal.includes('/')) {
                     const [d, m, y] = dateVal.split('/')
                     isoDate = `${y}-${m}-${d}`
                }

                items.push({
                    date: new Date(isoDate).toISOString(),
                    description: descVal,
                    amount: Math.abs(numAmount)
                })
            }
         }
    }

    if (items.length === 0) {
        toast.error('Não conseguimos ler as linhas do CSV.')
        isProcessing.value = false
        return
    }

    try {
        const res = await $fetch('/api/invoices/audit', {
            method: 'POST',
            body: {
                items,
                cardId: selectedCardId.value,
                month: Number(selectedMonth.value),
                year: Number(selectedYear.value)
            }
        })
        auditResult.value = res
        toast.success('Auditoria concluída!')
    } catch (e) {
        console.error(e)
        toast.error('Erro ao processar auditoria.')
    } finally {
        isProcessing.value = false
    }
}

async function runDemoAudit() {
    isProcessing.value = true
    // Simulate some artificial delay
    await new Promise(r => setTimeout(r, 1500))

    // Hardcoded demo divergences to show off
    const mockAudit = {
        status: 'divergent',
        action_needed: true,
        total_divergence: 245.80,
        missing_in_app: [
            { date: '2026-01-15', merchant: 'Amazon.com', amount: 89.90, alert_level: 'warning', message: 'Cobrança não registrada no app - foi você?' },
            { date: '2026-01-22', merchant: 'Restaurante Sabor', amount: 155.90, alert_level: 'warning', message: 'Falta lançar este almoço.' }
        ],
        missing_in_bank: [
            { date: '2026-01-18', merchant: 'Uber *Trip', amount: 45.00, alert_level: 'info', message: 'Você registrou mas não aparece na fatura (estorno?)' }
        ],
        duplicates: [
            { date: '2026-01-20', merchant: 'Spotify Brasil', amount: 21.90, count: 2, alert_level: 'critical', message: '⚠️ DUPLICATA DETECTADA - Conteste com o banco' }
        ],
        suspicious: [
            { date: '2026-01-25', merchant: 'LOJA ELETRONICOS PV', amount: 1200.00, alert_level: 'critical', message: '🚨 Possível fraude - Valor 10x acima da média desta categoria', reason: 'Valor atípico' }
        ]
    }

    auditResult.value = mockAudit
    isProcessing.value = false
    toast.success('Auditoria demonstração concluída!')
}

// Methods - Subscription Analysis
async function loadSubscriptions() {
    try {
        const res = await $fetch('/api/reports/subscriptions')
        subscriptionAnalysis.value = res
    } catch (e) {
        console.error(e)
        toast.error('Erro ao carregar assinaturas.')
    }
}

onMounted(() => {
    // Pre-load subscription analysis
    loadSubscriptions()
})
</script>

<template>
  <div class="app-page animate-in fade-in slide-in-from-bottom-4 duration-500">
    <PageHeader
      title="Auditoria & Balanço"
      subtitle="Detecte erros na fatura e economize em assinaturas esquecidas."
      :icon="Search"
    />

    <!-- Tabs -->
    <div class="flex p-1.5 bg-muted/40 rounded-[1.25rem] w-fit border border-border/70 shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2">
        <button
           class="px-6 py-2 rounded-xl text-small font-medium transition-all duration-200 active:scale-[0.98]"
           :class="activeTab === 'audit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/60'"
           @click="activeTab = 'audit'"
        >
           Auditoria de Fatura
        </button>
        <button
           class="px-6 py-2 rounded-xl text-small font-medium transition-all duration-200 flex items-center gap-2 active:scale-[0.98]"
           :class="activeTab === 'subscriptions' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/60'"
           @click="activeTab = 'subscriptions'"
        >
           Análise de Assinaturas
           <span v-if="subscriptionAnalysis && subscriptionAnalysis.total_wasted > 0" class="w-2 h-2 rounded-full bg-destructive animate-pulse"/>
        </button>
        <button
           class="px-6 py-2 rounded-xl text-small font-medium transition-all duration-200 flex items-center gap-2 active:scale-[0.98]"
           :class="activeTab === 'transactions' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/60'"
           @click="activeTab = 'transactions'"
        >
           <ListFilter class="w-3.5 h-3.5" />
           Todas as Transações
        </button>
    </div>

    <!-- Tab Content: Audit -->
    <div v-show="activeTab === 'audit'" class="space-y-6">

        <!-- Controls -->
        <div v-if="!auditResult" class="rounded-[2rem] border border-border/70 bg-card text-card-foreground shadow-elevation-2 overflow-hidden transition-all duration-300 hover:shadow-elevation-3 hover:border-primary/25">
            <div class="bg-secondary/5 px-6 py-4 border-b border-border/60 flex items-center gap-2">
                <Search class="w-4 h-4 text-primary" />
                <h3 class="text-micro text-muted-foreground">Configuração da Auditoria</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <div class="space-y-2">
                <label class="text-micro text-muted-foreground">Cartão</label>
                <Select v-model="selectedCardId">
                    <SelectTrigger class="h-11 rounded-xl border border-input bg-background shadow-elevation-1 transition-all duration-200 hover:border-primary/30 data-[state=open]:border-primary/40 data-[state=open]:shadow-elevation-2"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="c in cards" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <label class="text-micro text-muted-foreground">Mês de Referência</label>
                <Select v-model="selectedMonth">
                    <SelectTrigger class="h-11 rounded-xl border border-input bg-background shadow-elevation-1 transition-all duration-200 hover:border-primary/30 data-[state=open]:border-primary/40 data-[state=open]:shadow-elevation-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Janeiro</SelectItem>
                        <SelectItem value="2">Fevereiro</SelectItem>
                        <SelectItem value="3">Março</SelectItem>
                        <SelectItem value="4">Abril</SelectItem>
                        <SelectItem value="5">Maio</SelectItem>
                        <SelectItem value="6">Junho</SelectItem>
                        <SelectItem value="7">Julho</SelectItem>
                        <SelectItem value="8">Agosto</SelectItem>
                        <SelectItem value="9">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <label class="text-micro text-muted-foreground">Ano</label>
                <Select v-model="selectedYear">
                    <SelectTrigger class="h-11 rounded-xl border border-input bg-background shadow-elevation-1 transition-all duration-200 hover:border-primary/30 data-[state=open]:border-primary/40 data-[state=open]:shadow-elevation-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
        </div>

        <!-- Dropzone -->
        <div
            v-if="!auditResult"
            class="border-2 border-dashed border-border/70 rounded-[2rem] bg-card p-12 flex flex-col items-center justify-center text-center space-y-4 transition-all duration-300 relative cursor-pointer shadow-elevation-2"
            :class="[
                isDragging ? 'border-primary bg-primary/5 scale-[1.005]' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 hover:-translate-y-[2px] hover:shadow-elevation-3',
                !selectedCardId && 'opacity-50 cursor-not-allowed'
            ]"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
            @click="() => selectedCardId && fileInput?.click()"
        >
             <div v-if="!isProcessing" class="bg-muted p-4 rounded-2xl">
                <UploadCloud class="w-8 h-8 text-muted-foreground" />
            </div>
            <Loader2 v-else class="w-10 h-10 animate-spin text-primary" />

            <div v-if="!isProcessing" class="space-y-1">
                <p class="text-h3">Upload da Fatura (CSV)</p>
                <p class="text-body text-muted-foreground">Compare o banco com seus registros</p>
            </div>
             <p v-if="!selectedCardId" class="text-small text-danger font-medium absolute bottom-4">
                * Selecione o cartão acima primeiro
            </p>

            <!-- Try Demo Mode Button -->
            <button
                v-if="isDemoMode && selectedCardId"
                class="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary/10 text-primary-accent border border-primary/20 hover:bg-primary/20 hover:-translate-y-[1px] transition-all duration-200 font-bold shadow-lg hover:shadow-elevation-3"
                @click.stop="runDemoAudit"
            >
                <Zap class="w-4 h-4" />
                Carregar Dados Demonstrativos
            </button>

            <input
                ref="fileInput"
                type="file"
                accept=".csv"
                class="hidden"
                :disabled="!selectedCardId"
                @change="onFileSelect"
            >
        </div>

        <!-- Result -->
        <div v-else class="space-y-4">
            <div class="flex justify-between items-center bg-muted/30 border border-border/70 p-4 rounded-[1.25rem] shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2">
                 <p class="text-small text-muted-foreground">Vendo auditoria para o mês {{ selectedMonth }}/{{ selectedYear }}</p>
                 <button class="text-small font-medium text-primary hover:underline transition-all duration-200 hover:-translate-y-[1px]" @click="auditResult = null">Nova Auditoria</button>
            </div>
            <InvoiceAudit :audit="auditResult" />
        </div>
    </div>

    <!-- Tab Content: Subscriptions -->
    <div v-show="activeTab === 'subscriptions'" class="space-y-6">
        <div v-if="!subscriptionAnalysis" class="flex justify-center p-12">
            <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
        <SubscriptionAnalysis v-else :analysis="subscriptionAnalysis" />
    </div>

    <!-- Tab Content: Transactions -->
    <div v-show="activeTab === 'transactions'" class="space-y-6">

        <!-- Filter Bar -->
        <div class="rounded-[2rem] border border-border/70 bg-card text-card-foreground shadow-elevation-2 overflow-hidden transition-all duration-300 hover:shadow-elevation-3 hover:border-primary/25">
            <div class="bg-secondary/5 px-6 py-4 border-b border-border/60 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <ListFilter class="w-4 h-4 text-primary" />
                    <h3 class="text-micro text-muted-foreground">Filtros</h3>
                </div>
                <button
                    v-if="hasActiveFilters"
                    class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                    @click="clearFilters"
                >
                    <X class="w-3 h-3" />
                    Limpar filtros
                </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-6">
                <!-- Search -->
                <div class="space-y-2 sm:col-span-2 lg:col-span-1">
                    <label class="text-micro text-muted-foreground">Buscar</label>
                    <div class="relative">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            v-model="txSearch"
                            placeholder="Buscar por descrição..."
                            class="h-11 pl-9 rounded-xl border border-input bg-background shadow-elevation-1 transition-all duration-200 hover:border-primary/30 focus:border-primary/40 focus:shadow-elevation-2"
                        />
                    </div>
                </div>
                <!-- Card filter -->
                <div class="space-y-2">
                    <label class="text-micro text-muted-foreground">Cartão</label>
                    <Select v-model="txCardId">
                        <SelectTrigger class="h-11 rounded-xl border border-input bg-background shadow-elevation-1 transition-all duration-200 hover:border-primary/30 data-[state=open]:border-primary/40 data-[state=open]:shadow-elevation-2">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Todos</SelectItem>
                            <SelectItem v-for="c in cards" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <!-- Category filter -->
                <div class="space-y-2">
                    <label class="text-micro text-muted-foreground">Categoria</label>
                    <Select v-model="txCategoryId">
                        <SelectTrigger class="h-11 rounded-xl border border-input bg-background shadow-elevation-1 transition-all duration-200 hover:border-primary/30 data-[state=open]:border-primary/40 data-[state=open]:shadow-elevation-2">
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Todas</SelectItem>
                            <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <!-- Start date -->
                <div class="space-y-2">
                    <label class="text-micro text-muted-foreground">Data início</label>
                    <input
                        v-model="txStartDate"
                        type="date"
                        class="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-elevation-1 transition-all duration-200 hover:border-primary/30 focus:border-primary/40 focus:shadow-elevation-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <!-- End date -->
                <div class="space-y-2">
                    <label class="text-micro text-muted-foreground">Data fim</label>
                    <input
                        v-model="txEndDate"
                        type="date"
                        class="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-elevation-1 transition-all duration-200 hover:border-primary/30 focus:border-primary/40 focus:shadow-elevation-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="txLoading" class="flex justify-center p-12">
            <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
        </div>

        <!-- Empty State -->
        <div v-else-if="txList.length === 0" class="rounded-[2rem] border border-border/70 bg-card shadow-elevation-2 overflow-hidden">
            <EmptyState
                :icon="Search"
                :title="hasActiveFilters ? 'Nenhuma transação encontrada' : 'Sem transações'"
                :description="hasActiveFilters ? 'Tente ajustar os filtros para encontrar o que procura.' : 'Suas transações aparecerão aqui quando forem criadas.'"
                :action-label="hasActiveFilters ? 'Limpar filtros' : undefined"
                @action="clearFilters"
            />
        </div>

        <!-- Transaction Table -->
        <div v-else class="rounded-[2rem] border border-border/70 bg-card shadow-elevation-2 overflow-hidden transition-all duration-300 hover:shadow-elevation-3">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-muted/40 border-b border-border/60 text-muted-foreground font-medium">
                            <th class="px-4 py-3 text-left">Data Compra</th>
                            <th class="px-4 py-3 text-left">Descrição</th>
                            <th class="px-4 py-3 text-left">Cartão / Categoria</th>
                            <th class="px-4 py-3 text-right">Valor</th>
                            <th class="px-4 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border/60">
                        <tr v-for="tx in txList" :key="tx.id" class="hover:bg-muted/40 transition-all duration-200 hover:translate-x-[2px]">
                            <td class="px-4 py-4 whitespace-nowrap">
                                <div class="flex items-center gap-2 font-medium">
                                    <Calendar class="w-3 h-3 text-primary" />
                                    {{ formatDateShort(tx.purchaseDate) }}
                                </div>
                            </td>
                            <td class="px-4 py-4">
                                <div class="font-medium">{{ tx.description }}</div>
                            </td>
                            <td class="px-4 py-4">
                                <div class="flex flex-col">
                                    <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{{ tx.card?.name || 'Sem Cartão' }}</span>
                                    <span class="text-xs">{{ tx.category?.name || 'Sem Categoria' }}</span>
                                </div>
                            </td>
                            <td class="px-4 py-4 text-right font-bold">
                                {{ formatCurrency(tx.amount) }}
                            </td>
                            <td class="px-4 py-4">
                                <div class="flex items-center justify-center gap-1">
                                    <button
                                        class="p-2 hover:bg-primary/10 rounded-xl text-primary transition-all duration-200 hover:scale-105 active:scale-[0.97]"
                                        title="Editar"
                                        @click="handleEdit(tx.id)"
                                    >
                                        <Edit2 class="w-4 h-4" />
                                    </button>
                                    <button
                                        class="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-all duration-200 hover:scale-105 active:scale-[0.97]"
                                        title="Excluir"
                                        @click="confirmDelete(tx.id)"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="flex items-center justify-between px-4 py-4 border-t border-border/60 bg-muted/30 transition-all duration-200 hover:bg-muted/40">
                <div class="text-sm text-muted-foreground">
                    Mostrando <span class="font-medium">{{ txList.length }}</span> de <span class="font-medium">{{ txTotal }}</span> transações
                </div>
                <div class="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="txPage === 1"
                        class="gap-1 px-2 transition-all duration-200 hover:-translate-y-[1px]"
                        @click="txPrevPage"
                    >
                        <ChevronLeft class="w-4 h-4" />
                        Anterior
                    </Button>
                    <div class="text-sm font-medium px-2">
                        Página {{ txPage }} de {{ txTotalPages || 1 }}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="txPage >= txTotalPages"
                        class="gap-1 px-2 transition-all duration-200 hover:-translate-y-[1px]"
                        @click="txNextPage"
                    >
                        Próximo
                        <ChevronRight class="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    </div>

    <!-- Transaction Drawer (edit) -->
    <TransactionDrawer
      v-model:open="isDrawerOpen"
      :transaction-id="editingTransactionId"
      @saved="onTransactionSaved"
    />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                <AlertDialogDescription>
                    Essa ação não pode ser desfeita. A transação será permanentemente removida.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel :disabled="isDeleting">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    :disabled="isDeleting"
                    @click="handleDelete"
                >
                    <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin mr-2" />
                    Excluir
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

  </div>
</template>
