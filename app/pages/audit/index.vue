<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'
import { toast } from 'vue-sonner'
import { UploadCloud, Loader2, Search, Zap } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PageHeader from '@/components/ui/PageHeader.vue'
import InvoiceAudit from '@/components/invoices/InvoiceAudit.vue'
import SubscriptionAnalysis from '@/components/reports/SubscriptionAnalysis.vue'

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

const { data: cards } = useFetch<CardOption[]>('/api/cards')
const auditResult = ref<AuditResult | null>(null)
const subscriptionAnalysis = ref<SubscriptionAnalysisData | null>(null)

// Demo Mode State
const demoCookie = useCookie('demo_mode')
const isDemoMode = computed(() => demoCookie.value === 'true')

// Tab state
const activeTab = ref<'audit' | 'subscriptions'>('audit')

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

  </div>
</template>
