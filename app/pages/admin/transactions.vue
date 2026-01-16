<script setup lang="ts">
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, Edit2, ArrowLeft, Clock, Calendar } from 'lucide-vue-next'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'

interface Transaction {
  id: string
  description: string
  amount: number
  purchaseDate: string
  createdAt: string
  card: { name: string }
  category: { name: string }
}

const { data: transactions, refresh } = await useFetch<Transaction[]>('/api/admin/transactions')

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
</script>

<template>
  <div class="container mx-auto py-10 px-4 space-y-8">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
                <AlertCircle class="w-6 h-6 " />
            </div>
            <div>
                <h1 class="text-3xl font-bold tracking-tight">Auditoria</h1>
                <p class="text-muted-foreground">Últimas 50 transações criadas no sistema.</p>
            </div>
        </div>
        
        <NuxtLink to="/" class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft class="w-4 h-4" />
            Voltar ao Dashboard
        </NuxtLink>
    </div>

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
                                <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{{ tx.card.name }}</span>
                                <span class="text-xs">{{ tx.category.name }}</span>
                            </div>
                        </td>
                        <td class="px-4 py-4 text-right font-bold">
                            {{ formatCurrency(tx.amount) }}
                        </td>
                        <td class="px-4 py-4 text-center">
                            <button 
                                @click="handleEdit(tx.id)"
                                class="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
                                title="Editar Transação"
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
    </div>

    <!-- Reuse TransactionDrawer for editing -->
    <TransactionDrawer 
      v-model:open="isDrawerOpen" 
      :transactionId="editingTransactionId"
      @saved="refresh"
    />
  </div>
</template>
