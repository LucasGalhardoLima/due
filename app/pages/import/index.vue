<script setup lang="ts">
import Papa from 'papaparse'
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { UploadCloud, FileText, ArrowRight, Loader2, Smartphone, Share2, CreditCard } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PageHeader from '@/components/ui/PageHeader.vue'
import ListSkeleton from '@/components/ui/ListSkeleton.vue'

// Types
interface ParsedRow {
  date: string
  description: string
  amount: number
  selected: boolean
  categoryId?: string
  status: 'valid' | 'invalid'
}

interface CardOption {
  id: string
  name: string
}

interface CategoryOption {
  id: string
  name: string
}

// State
const step = ref<1 | 2>(1) // 1: Upload, 2: Review
const isDragging = ref(false)
const isProcessing = ref(false)
const parsedRows = ref<ParsedRow[]>([])
const selectedCardId = ref<string>('')
const importStats = ref({ total: 0, matched: 0 })

// Fetch Data
const { data: cards, status: cardsStatus } = useFetch<CardOption[]>('/api/cards')
const { data: categories, status: catStatus } = useFetch<CategoryOption[]>('/api/categories')

const isLoading = computed(() => cardsStatus.value === 'pending' || catStatus.value === 'pending')

// Quick Matching Logic (Client-side for now)
function findCategoryMatch(description: string): string | undefined {
    if (!categories.value) return undefined
    
    // Normalize logic
    const desc = description.toLowerCase()
    
    const commonMappings: Record<string, string[]> = {
        'Transporte': ['uber', '99', 'posto', 'sem parar', 'veloe', 'combustivel'],
        'Alimentação': ['ifood', 'rappi', 'subway', 'mc donalds', 'burger king', 'restaurante', 'padaria', 'mercado', 'atacad', 'carrefour', 'pao de acucar'],
        'Assinaturas': ['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'youtube', 'apple'],
        'Serviços': ['aws', 'digitalocean', 'google cloud', 'vercel', 'netlify', 'adobe', 'chatgpt', 'openai'],
        'Saúde': ['farmacia', 'drogaria', 'medico', 'hospital', 'lab'],
        'Casa': ['leroy', 'madeira', 'eletropaulo', 'energia', 'agua', 'sabesp', 'internet', 'claro', 'vivo', 'tim']
    }
    
    for (const cat of categories.value) {
        // Direct match with category name
        if (desc.includes(cat.name.toLowerCase())) return cat.id
        
        // Check common mappings
        const keywords = commonMappings[cat.name]
        if (keywords) {
            if (keywords.some(k => desc.includes(k))) return cat.id
        }
    }
    
    return undefined
}

// File Handling
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
        complete: (results) => {
            console.log('Parsed:', results)
            processResults(results.data)
            isProcessing.value = false
            step.value = 2
        },
        error: (err) => {
            console.error(err)
            toast.error('Erro ao ler CSV.')
            isProcessing.value = false
        }
    })
}

type RawRow = Record<string, string | number | null | undefined>

function processResults(data: RawRow[]) {
    // Nubank CSV Format: date, category, title, amount
    // Inter Format: Data Lançamento, Histórico, Valor
    // We need to normalize.
    
    const rows: ParsedRow[] = []
    let matches = 0
    
    data.forEach((row) => {
        // Auto-detect columns
        const dateVal = row['date'] || row['Date'] || row['Data'] || row['Data Lançamento']
        const descVal = row['title'] || row['description'] || row['Description'] || row['Histórico'] || row['Estabelecimento']
        const amountVal = row['amount'] || row['Amount'] || row['Valor']

        if (dateVal && descVal && amountVal) {
            
            if (typeof amountVal === 'string') {
              // Handle currency symbols
            }
            
            let numAmount = Number(amountVal)
            // If NaN, maybe needs replace
            if (isNaN(numAmount) && typeof amountVal === 'string') {
                 // Try replacing , with .
                 numAmount = Number(amountVal.replace(',', '.'))
            }

            // Valid row?
            if (!isNaN(numAmount)) {
                
                // Parse date (yyyy-mm-dd or dd/mm/yyyy)
                let isoDate = dateVal
                if (dateVal.includes('/')) {
                     const [d, m, y] = dateVal.split('/')
                     isoDate = `${y}-${m}-${d}` // simple ISO
                }
                
                // Match Category
                const matchedCatId = findCategoryMatch(descVal)
                if (matchedCatId) matches++

                rows.push({
                    date: new Date(isoDate).toISOString(),
                    description: descVal,
                    amount: Math.abs(numAmount), // Import transactions are usually expenses (positive for us)
                    selected: true,
                    categoryId: matchedCatId,
                    status: 'valid'
                })
            }
        }
    })
    
    parsedRows.value = rows
    importStats.value = { total: rows.length, matched: matches }
}

// Drag & Drop
function onDrop(e: DragEvent) {
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
        const file = files[0]
        if (file) handleFile(file)
    }
}

function onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
        const file = input.files[0]
        if (file) handleFile(file)
    }
}

// Submission
async function handleImport() {
    const selectedRows = parsedRows.value.filter(r => r.selected)
    if (selectedRows.length === 0) {
        toast.error('Nenhuma transação selecionada.')
        return
    }

    if (!selectedCardId.value) {
        toast.error('Cartão não selecionado (erro interno).')
        return
    }
    
    isProcessing.value = true
    try {
        const payload = selectedRows.map(r => ({
            description: r.description,
            amount: r.amount,
            date: r.date,
            categoryId: r.categoryId,
            cardId: selectedCardId.value
        }))

        const res = await $fetch<{ count: number }>('/api/transactions/batch', {
            method: 'POST',
            body: payload
        })
        
        toast.success(`${res.count} transações importadas!`)
        step.value = 1
        parsedRows.value = []
        navigateTo('/')
    } catch (error) {
        console.error(error)
        toast.error('Erro ao importar transações. Verifique o formato.')
    } finally {
        isProcessing.value = false
    }
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <PageHeader 
      title="Importação Inteligente" 
      subtitle="Arraste sua fatura (CSV) e nossa IA organiza tudo para você."
      :icon="UploadCloud"
    />

    <ListSkeleton v-if="isLoading" :items="3" />

    <template v-else>
      <!-- Step 1: Upload -->
      <div v-if="step === 1" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <!-- Visual Tutorial (Nubank Focus) -->
          <div class="bg-card rounded-[2rem] p-8 border border-border/70 shadow-elevation-3">
              <h3 class="text-micro text-muted-foreground mb-8 flex items-center gap-2">
                  <Smartphone class="w-3 h-3 text-primary" />
                  Como exportar do seu banco?
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <!-- Step 1 -->
                  <div class="flex items-start gap-3 group">
                      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">1</div>
                      <div class="space-y-1">
                          <p class="text-h4 flex items-center gap-2">
                              Abra a Fatura
                              <CreditCard class="w-3 h-3 text-muted-foreground" />
                          </p>
                          <p class="text-small text-muted-foreground leading-relaxed">No app do Nubank, toque no cartao de credito na tela inicial.</p>
                      </div>
                  </div>
  
                  <!-- Step 2 -->
                  <div class="flex items-start gap-3 group">
                      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">2</div>
                      <div class="space-y-1">
                          <p class="text-h4 flex items-center gap-2">
                              Enviar por E-mail
                              <Share2 class="w-3 h-3 text-muted-foreground" />
                          </p>
                          <p class="text-small text-muted-foreground leading-relaxed">Toque em "Mais" ou no icone de compartilhar no topo da fatura.</p>
                      </div>
                  </div>
  
                  <!-- Step 3 -->
                  <div class="flex items-start gap-3 group">
                      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">3</div>
                      <div class="space-y-1">
                          <p class="text-h4 flex items-center gap-2">
                              Formato CSV
                              <FileText class="w-3 h-3 text-muted-foreground" />
                          </p>
                          <p class="text-small text-muted-foreground leading-relaxed">Selecione CSV, envie para seu computador e arraste o arquivo abaixo.</p>
                      </div>
                  </div>
              </div>
          </div>
          <!-- Card Selector -->
           <div class="max-w-md space-y-2">
              <label class="text-micro text-muted-foreground">Cartao de Destino</label>
              <Select v-model="selectedCardId">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="card in cards" :key="card.id" :value="card.id">
                    {{ card.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
          </div>
  
          <!-- Dropzone -->
          <div
              class="border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center space-y-4 transition-colors relative bg-card/60"
              :class="[
                  isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
                  !selectedCardId && 'opacity-50 cursor-not-allowed'
              ]"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop"
          >
              <div class="bg-muted p-4 rounded-2xl">
                  <FileText class="w-8 h-8 text-muted-foreground" />
              </div>
  
              <div class="space-y-1">
                  <p class="text-h3">Arraste o arquivo CSV aqui</p>
                  <p class="text-body text-muted-foreground">ou clique para selecionar</p>
              </div>
  
              <input
                  type="file"
                  accept=".csv"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  :disabled="!selectedCardId"
                  aria-label="Selecionar arquivo CSV para importação"
                  @change="onFileSelect"
              >
  
              <p v-if="!selectedCardId" class="text-small text-danger font-medium absolute -bottom-6">
                  * Selecione um cartao primeiro
              </p>
          </div>
  
          <!-- Instructions / Supported Banks -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
               <div class="border border-border/70 rounded-3xl p-4 text-center space-y-2 shadow-elevation-1 bg-card/70">
                   <div class="text-h4">Nubank</div>
                   <div class="text-small text-muted-foreground">Suporte total ao CSV exportado pelo app.</div>
               </div>
               <div class="border border-border/70 rounded-3xl p-4 text-center space-y-2 shadow-elevation-1 bg-card/70">
                   <div class="text-h4">Inter</div>
                   <div class="text-small text-muted-foreground">CSV de extrato suportado.</div>
               </div>
                <div class="border border-border/70 rounded-3xl p-4 text-center space-y-2 shadow-elevation-1 bg-card/70">
                   <div class="text-h4">Outros</div>
                   <div class="text-small text-muted-foreground">CSV generico (Data, Descricao, Valor).</div>
               </div>
          </div>
      </div>
  
      <!-- Step 2: Review -->
      <div v-else class="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
          <div class="flex items-center justify-between">
              <h2 class="text-h2">Revisao de Lancamentos</h2>
              <div class="flex items-center gap-4 text-small">
                  <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-success"/>
                      <span>{{ importStats.matched }} Categorizados</span>
                  </div>
                  <div class="text-muted-foreground">Total: {{ parsedRows.length }}</div>
              </div>
          </div>
  
          <div class="rounded-[2rem] border border-border/70 bg-card shadow-elevation-3">
              <div class="relative w-full overflow-auto max-h-[500px]">
                  <table class="w-full caption-bottom text-sm">
                      <thead class="sticky top-0 bg-background border-b z-10">
                          <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                              <th class="h-12 px-4 text-left align-middle text-micro text-muted-foreground w-[50px]">
                                  <input type="checkbox" checked aria-label="Selecionar todas as transações" @change="(e) => parsedRows.forEach(r => r.selected = (e.target as HTMLInputElement).checked)" >
                              </th>
                              <th class="h-12 px-4 text-left align-middle text-micro text-muted-foreground">Data</th>
                              <th class="h-12 px-4 text-left align-middle text-micro text-muted-foreground">Descricao</th>
                              <th class="h-12 px-4 text-left align-middle text-micro text-muted-foreground">Valor</th>
                              <th class="h-12 px-4 text-left align-middle text-micro text-muted-foreground">Categoria</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="(row, idx) in parsedRows" :key="idx" class="border-b transition-colors hover:bg-muted/50">
                              <td class="p-4 align-middle">
                                  <input v-model="row.selected" type="checkbox" :aria-label="`Selecionar transação: ${row.description}`" >
                              </td>
                              <td class="p-4 align-middle text-body">{{ new Date(row.date).toLocaleDateString() }}</td>
                              <td class="p-4 align-middle text-body font-medium">{{ row.description }}</td>
                              <td class="p-4 align-middle text-body">R$ {{ row.amount.toFixed(2) }}</td>
                              <td class="p-4 align-middle w-[250px]">
                                  <Select v-model="row.categoryId">
                                    <SelectTrigger :class="!row.categoryId && 'text-muted-foreground border-warning bg-warning-muted'">
                                      <SelectValue placeholder="Sem Categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id">
                                        {{ cat.name }}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
  
          <div class="flex justify-end gap-3 pt-4">
              <button class="px-4 py-2 text-body font-medium text-muted-foreground hover:text-foreground transition-colors" @click="step = 1">
                  Cancelar
              </button>
              <button
                  class="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-body font-bold shadow-elevation-2 hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98] transition-all"
                  :disabled="isProcessing || parsedRows.filter(r => r.selected).length === 0"
                  @click="handleImport"
              >
                  <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin" />
                  <span v-else>Importar {{ parsedRows.filter(r => r.selected).length }} Itens</span>
                  <ArrowRight v-if="!isProcessing" class="w-4 h-4 ml-1" />
              </button>
          </div>
      </div>
    </template>
  </div>
</template>
