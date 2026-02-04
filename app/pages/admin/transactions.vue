<script setup lang="ts">
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, Edit2, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/ui/PageHeader.vue'

interface Transaction {
  id: string
  description: string
  amount: number
  purchaseDate: string
  createdAt: string
  card: { name: string }
  category: { name: string }
}

interface AdminTransactionsResponse {
  transactions: Transaction[]
  total: number
  page: number
  pageSize: number
}

const currentPage = ref(1)
const { data: response, refresh } = await useFetch<AdminTransactionsResponse>('/api/admin/transactions', {
  query: {
    page: currentPage
  }
})

const isDrawerOpen = ref(false)
const editingTransactionId = ref<string | null>(null)

function handleEdit(id: string) {
  editingTransactionId.value = id
  isDrawerOpen.value = true
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

function formatDateShort(dateStr: string) {
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
}

const transactions = computed(() => response.value?.transactions || [])
const totalPages = computed(() => Math.ceil((response.value?.total || 0) / (response.value?.pageSize || 50)))

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl py-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <PageHeader 
      title="Auditoria" 
      subtitle="Analise as transações por ordem de criação."
      :icon="AlertCircle"
      back-to="/"
    />

    <!-- Latest Transactions Table -->
    <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-muted/50 border-b text-muted-foreground font-medium">
                        <th class="px-4 py-3 text-left">Criada em</th>
                        <th class="px-4 py-3 text-left">Data Compra</th>
                        <th class="px-4 py-3 text-left">Descrição</th>
                        <th class="px-4 py-3 text-left">Cartão / Categoria</th>
                        <th class="px-4 py-3 text-right">Valor</th>
                        <th class="px-4 py-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-muted/30 transition-colors">
                        <td class="px-4 py-4 whitespace-nowrap">
                            <div class="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock class="w-3 h-3" />
                                {{ formatDate(tx.createdAt) }}
                            </div>
                        </td>
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
                        <td class="px-4 py-4 text-center">
                            <button 
                                class="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
                                title="Editar Transação"
                                @click="handleEdit(tx.id)"
                            >
                                <Edit2 class="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                    <tr v-if="!transactions?.length">
                        <td colspan="6" class="px-4 py-12 text-center text-muted-foreground">
                            Nenhuma transação encontrada.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Pagination Controls -->
        <div class="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
            <div class="text-sm text-muted-foreground">
                Mostrando <span class="font-medium">{{ transactions.length }}</span> de <span class="font-medium">{{ response?.total || 0 }}</span> transações
            </div>
            <div class="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    :disabled="currentPage === 1"
                    class="gap-1 px-2"
                    @click="prevPage"
                >
                    <ChevronLeft class="w-4 h-4" />
                    Anterior
                </Button>
                <div class="text-sm font-medium px-2">
                    Página {{ currentPage }} de {{ totalPages }}
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    :disabled="currentPage === totalPages"
                    class="gap-1 px-2"
                    @click="nextPage"
                >
                    Próximo
                    <ChevronRight class="w-4 h-4" />
                </Button>
            </div>
        </div>
    </div>

    <!-- Reuse TransactionDrawer for editing -->
    <TransactionDrawer 
      v-model:open="isDrawerOpen" 
      :transaction-id="editingTransactionId"
      @saved="refresh"
    />
  </div>
</template>
