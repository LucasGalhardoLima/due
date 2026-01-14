<script setup lang="ts">
import { LucideShoppingBag, LucideCreditCard, LucideUtensils, LucideCar, LucideHome } from 'lucide-vue-next'

const props = defineProps<{
    transactions: Record<string, any[]>
}>()

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    // Add timezone offset correction if needed, but split('T')[0] in backend + new Date here might interpret as UTC -> Local
    // For MVP simple logic:
    // If we receive "2023-01-01", input is YYYY-MM-DD.
    // Let's create date object properly.
    const [y, m, dNum] = dateStr.split('-').map(val => Number(val) || 0)
    // Month in Date constructor is 0-indexed, so we subtract 1.
    // However if m is 0 (parsed fail), -1 will go to Dec prev year.
    // Let's assume valid date format from backend (YYYY-MM-DD). Use '1' as default month if fail.
    const monthIndex = (m || 1) - 1
    const date = new Date(y || 2000, monthIndex, dNum || 1)
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', weekday: 'short' }).format(date)
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

// Icon Mapping
const iconMap: Record<string, any> = {
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
  <div class="space-y-6">
    <div v-if="!transactions || Object.keys(transactions).length === 0" class="text-center py-10 text-muted-foreground">
        Nenhum lançamento nesta fatura.
    </div>

    <div v-for="(items, date) in transactions" :key="date" class="space-y-2">
        <h4 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-2">
            {{ formatDate(String(date)) }}
        </h4>
        
        <div class="rounded-lg border bg-card text-card-foreground shadow-sm divide-y">
            <div v-for="tx in items" :key="tx.id" class="p-4 flex items-center justify-between">
                 <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                        <component :is="getIcon(tx.category)" class="h-5 w-5" />
                    </div>
                    <div>
                        <div class="font-medium">{{ tx.description }}</div>
                        <div class="text-xs text-muted-foreground flex gap-1">
                            <span>{{ tx.cardName }}</span>
                            <span v-if="tx.totalInstallments > 1">• {{ tx.installmentNumber }}/{{ tx.totalInstallments }}</span>
                        </div>
                    </div>
                 </div>
                 <div class="font-semibold">
                    {{ formatCurrency(tx.amount) }}
                 </div>
            </div>
        </div>
    </div>
  </div>
</template>
