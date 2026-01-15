<script setup lang="ts">
import Papa from 'papaparse'
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { UploadCloud, Check, AlertCircle, FileText, ArrowRight, Loader2 } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Types
interface ParsedRow {
  date: string
  description: string
  amount: number
  selected: boolean
  categoryId?: string
  status: 'valid' | 'invalid'
}

interface MatchingRule {
  keyword: string
  categoryId: string
}

// State
const step = ref<1 | 2>(1) // 1: Upload, 2: Review
const isDragging = ref(false)
const isProcessing = ref(false)
const parsedRows = ref<ParsedRow[]>([])
const selectedCardId = ref<string>('')
const importStats = ref({ total: 0, matched: 0 })

// Fetch Data
const { data: cards } = await useFetch('/api/cards')
const { data: categories } = await useFetch('/api/categories')

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

function processResults(data: any[]) {
    // Nubank CSV Format: date, category, title, amount
    // Inter Format: Data Lançamento, Histórico, Valor
    // We need to normalize.
    
    const rows: ParsedRow[] = []
    let matches = 0
    
    data.forEach((row: any) => {
        // Auto-detect columns
        const dateVal = row['date'] || row['Date'] || row['Data'] || row['Data Lançamento']
        const descVal = row['title'] || row['description'] || row['Description'] || row['Histórico'] || row['Estabelecimento']
        let amountVal = row['amount'] || row['Amount'] || row['Valor']

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

        // Explicit POST method casting workaround
        const res = await $fetch('/api/transactions/batch', {
            method: 'POST' as any,
            body: payload
        })
        
        toast.success(`${(res as any).count} transações importadas!`)
        step.value = 1
        parsedRows.value = []
        navigateTo('/')
    } catch (e) {
        console.error(e)
        const err = e as { data?: any }
        toast.error('Erro ao importar transações. Verifique o formato.')
    } finally {
        isProcessing.value = false
    }
}
</script>

<template>
  <div class="container mx-auto py-10 max-w-4xl space-y-8">
    <div class="flex items-center gap-3">
        <div class="bg-primary/10 p-3 rounded-full">
            <UploadCloud class="w-6 h-6 text-primary" />
        </div>
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Importação Inteligente</h1>
            <p class="text-muted-foreground">Arraste sua fatura (CSV) e nós organizamos tudo.</p>
        </div>
    </div>

    <!-- Step 1: Upload -->
    <div v-if="step === 1" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <!-- Card Selector -->
         <div class="max-w-md space-y-2">
            <label class="text-sm font-medium">Cartão de Destino</label>
            <Select v-model="selectedCardId">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cartão" />
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
            class="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 transition-colors relative"
            :class="[
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
                !selectedCardId && 'opacity-50 cursor-not-allowed'
            ]"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
        >
            <div class="bg-muted p-4 rounded-full">
                <FileText class="w-8 h-8 text-muted-foreground" />
            </div>
            
            <div class="space-y-1">
                <p class="font-medium text-lg">Arraste o arquivo CSV aqui</p>
                <p class="text-sm text-muted-foreground">ou clique para selecionar</p>
            </div>
            
            <input 
                type="file" 
                accept=".csv" 
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                :disabled="!selectedCardId"
                @change="onFileSelect"
            />
            
            <p v-if="!selectedCardId" class="text-xs text-red-500 font-medium absolute -bottom-6">
                * Selecione um cartão primeiro
            </p>
        </div>
        
        <!-- Instructions / Supported Banks -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
             <div class="border rounded-lg p-4 text-center space-y-2">
                 <div class="font-bold text-sm">Nubank</div>
                 <div class="text-xs text-muted-foreground">Suporte total ao CSV exportado pelo app.</div>
             </div>
             <div class="border rounded-lg p-4 text-center space-y-2">
                 <div class="font-bold text-sm">Inter</div>
                 <div class="text-xs text-muted-foreground">CSV de extrato suportado.</div>
             </div>
              <div class="border rounded-lg p-4 text-center space-y-2">
                 <div class="font-bold text-sm">Outros</div>
                 <div class="text-xs text-muted-foreground">CSV genérico (Data, Descrição, Valor).</div>
             </div>
        </div>
    </div>

    <!-- Step 2: Review -->
    <div v-else class="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Revisão de Lançamentos</h2>
            <div class="flex items-center gap-4 text-sm">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>{{ importStats.matched }} Categorizados</span>
                </div>
                <div class="text-muted-foreground">Total: {{ parsedRows.length }}</div>
            </div>
        </div>

        <div class="rounded-md border bg-card">
            <div class="relative w-full overflow-auto max-h-[500px]">
                <table class="w-full caption-bottom text-sm">
                    <thead class="sticky top-0 bg-background border-b z-10">
                        <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">
                                <input type="checkbox" checked @change="(e) => parsedRows.forEach(r => r.selected = (e.target as HTMLInputElement).checked)" />
                            </th>
                            <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Data</th>
                            <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Descrição</th>
                            <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Valor</th>
                            <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Categoria</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, idx) in parsedRows" :key="idx" class="border-b transition-colors hover:bg-muted/50">
                            <td class="p-4 align-middle">
                                <input type="checkbox" v-model="row.selected" />
                            </td>
                            <td class="p-4 align-middle">{{ new Date(row.date).toLocaleDateString() }}</td>
                            <td class="p-4 align-middle font-medium">{{ row.description }}</td>
                            <td class="p-4 align-middle">R$ {{ row.amount.toFixed(2) }}</td>
                            <td class="p-4 align-middle w-[250px]">
                                <Select v-model="row.categoryId">
                                  <SelectTrigger :class="!row.categoryId && 'text-muted-foreground border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'">
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
            <button class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" @click="step = 1">
                Cancelar
            </button>
            <button 
                class="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                :disabled="isProcessing || parsedRows.filter(r => r.selected).length === 0"
                @click="handleImport"
            >
                <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin" />
                <span v-else>Importar {{ parsedRows.filter(r => r.selected).length }} Itens</span>
                <ArrowRight class="w-4 h-4 ml-1" v-if="!isProcessing" />
            </button>
        </div>
    </div>
  </div>
</template>
