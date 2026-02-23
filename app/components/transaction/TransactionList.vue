<script setup lang="ts">
import type { Component } from 'vue'
import { ref, computed } from 'vue'
import {
  LucideShoppingBag,
  LucideUtensils,
  LucideCar,
  LucideHome,
  ArrowUpDown,
  Pencil,
  Receipt,
} from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface TransactionItem {
  id: string
  transactionId: string
  description: string
  amount: number
  category: string
  categoryIcon: string
  installmentNumber: number
  totalInstallments: number
  cardName: string
  purchaseDate: string
}

const props = defineProps<{
  transactions: Record<string, TransactionItem[]>
}>()

defineEmits(['edit', 'delete'])

// Sorting state
const sortKey = ref<'purchaseDate' | 'description' | 'amount' | 'cardName'>('purchaseDate')
const sortOrder = ref<'asc' | 'desc'>('desc')

function toggleSort(key: typeof sortKey.value) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'desc'
  }
}

// Flattened transactions for desktop
interface TransactionWithDate extends TransactionItem {
  purchaseDate: string
}

const allTransactions = computed<TransactionWithDate[]>(() => {
  const flattened: TransactionWithDate[] = []
  Object.entries(props.transactions).forEach(([date, items]) => {
    items.forEach(item => {
      flattened.push({ ...item, purchaseDate: date })
    })
  })

  return flattened.sort((a, b) => {
    const modifier = sortOrder.value === 'asc' ? 1 : -1
    if (sortKey.value === 'amount') {
      return (a.amount - b.amount) * modifier
    }
    if (a[sortKey.value] < b[sortKey.value]) return -1 * modifier
    if (a[sortKey.value] > b[sortKey.value]) return 1 * modifier
    return 0
  })
})

function formatDate(dateStr: string, style: 'long' | 'short' = 'long') {
    const [y, m, dNum] = dateStr.split('-').map(val => Number(val) || 0)
    const monthIndex = (m || 1) - 1
    const date = new Date(y || 2000, monthIndex, dNum || 1)
    
    if (style === 'short') {
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date)
    }
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', weekday: 'short' }).format(date)
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

// Icon Mapping
const iconMap: Record<string, Component> = {
    'Alimentação': LucideUtensils,
    'Transporte': LucideCar,
    'Casa': LucideHome,
    'Outros': LucideShoppingBag
}

function getIcon(categoryName: string) {
    return iconMap[categoryName] || LucideShoppingBag
}
</script>

<template>
  <div class="transaction-list-container">
    <div v-if="!transactions || Object.keys(transactions).length === 0">
      <EmptyState
        :icon="Receipt"
        title="Nada registrado aqui... ainda"
        description="Adicione seus gastos pra gente começar a organizar."
        action-label="Adicionar gasto"
        @action="$emit('edit', null)"
      />
    </div>

    <template v-else>
      <!-- Mobile View (Grouped List) -->
      <div class="lg:hidden space-y-6">
        <div v-for="(items, date) in transactions" :key="date" class="space-y-3">
            <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-16 bg-background py-2 z-10 px-1">
                {{ formatDate(String(date)) }}
            </h4>
            
            <div class="rounded-xl border border-border bg-card text-card-foreground shadow-elevation-1 divide-y divide-border">
                <div 
                  v-for="tx in items" 
                  :key="tx.id" 
                  class="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted/80 touch-manipulation min-h-[72px]"
                  @click="$emit('edit', tx)"
                >
                     <div class="flex items-center gap-4">
                        <div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
                            <component :is="getIcon(tx.category)" class="h-5 w-5" />
                        </div>
                        <div class="min-w-0">
                            <div class="font-medium line-clamp-1 text-sm md:text-base">{{ tx.description }}</div>
                            <div class="text-xs text-muted-foreground flex gap-1 items-center mt-0.5">
                                <span class="truncate max-w-[120px]">{{ tx.cardName }}</span>
                                <span v-if="tx.totalInstallments > 1" class="text-[10px] bg-muted px-1.5 py-0.5 rounded-md">• {{ tx.installmentNumber }}/{{ tx.totalInstallments }}</span>
                            </div>
                        </div>
                     </div>
                     <div class="font-bold whitespace-nowrap text-sm">
                        {{ formatCurrency(tx.amount) }}
                     </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Desktop View (Data Table) -->
      <div class="hidden lg:block border border-border rounded-xl bg-card shadow-elevation-1 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[100px] cursor-pointer hover:text-foreground" @click="toggleSort('purchaseDate')">
                <div class="flex items-center gap-1">
                  Data
                  <ArrowUpDown class="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Categ.</TableHead>
              <TableHead class="cursor-pointer hover:text-foreground" @click="toggleSort('description')">
                <div class="flex items-center gap-1">
                  Descrição
                  <ArrowUpDown class="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead class="cursor-pointer hover:text-foreground" @click="toggleSort('cardName')">
                <div class="flex items-center gap-1">
                  Cartão
                  <ArrowUpDown class="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead class="text-center">Parcelas</TableHead>
              <TableHead class="text-right cursor-pointer hover:text-foreground" @click="toggleSort('amount')">
                <div class="flex items-center justify-end gap-1">
                  Valor
                  <ArrowUpDown class="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead class="w-[80px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="tx in allTransactions" :key="tx.id" class="group h-12 border-border hover:bg-muted/50 transition-colors">
              <TableCell class="font-medium py-1">
                {{ formatDate(tx.purchaseDate, 'short') }}
              </TableCell>
              <TableCell class="py-1">
                <div class="flex items-center justify-center h-7 w-7 rounded-full bg-secondary text-primary" :title="tx.category">
                  <component :is="getIcon(tx.category)" class="h-3.5 w-3.5" />
                </div>
              </TableCell>
              <TableCell class="py-1">
                <span class="font-medium">{{ tx.description }}</span>
              </TableCell>
              <TableCell class="py-1">
                <span class="text-xs px-2 py-0.5 rounded-full bg-muted border font-medium">{{ tx.cardName }}</span>
              </TableCell>
              <TableCell class="text-center py-1">
                <span v-if="tx.totalInstallments > 1" class="text-xs">
                  {{ tx.installmentNumber }}/{{ tx.totalInstallments }}
                </span>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell class="text-right font-bold py-1">
                {{ formatCurrency(tx.amount) }}
              </TableCell>
              <TableCell class="text-center py-1">
                <div class="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon-sm" @click="$emit('edit', tx)">
                    <Pencil class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>
  </div>
</template>
