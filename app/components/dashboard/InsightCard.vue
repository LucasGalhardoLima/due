<script setup lang="ts">
import { LucideLightbulb } from 'lucide-vue-next'

const props = defineProps<{
  month: number
  year: number
}>()

interface InsightResponse {
    hasData: boolean
    topCategory: {
        name: string
        amount: number
        percentage: number
    }
    totalInvoice: number
}

const { data: insight, refresh } = await useFetch<InsightResponse>('/api/reports/category-spending', {
    query: { month: props.month, year: props.year }
})

watch(() => [props.month, props.year], () => {
    refresh()
})

const messages = [
    "Tente reduzir gastos supérfluos.",
    "Que tal definir um teto para esta categoria?",
    "Pequenas economias geram grandes resultados."
]

function getRandomTip() {
    return messages[Math.floor(Math.random() * messages.length)]
}
</script>

<template>
  <div v-if="insight?.hasData" class="rounded-xl border bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-background p-6 shadow-sm relative overflow-hidden">
     <div class="absolute top-0 right-0 p-4 opacity-10">
        <LucideLightbulb class="h-16 w-16" />
     </div>
     
     <div class="relative z-10 space-y-2">
        <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wide">
            <LucideLightbulb class="h-4 w-4" />
            Insight Financeiro
        </div>
        
        <h3 class="text-lg font-bold leading-tight">
            Atenção com <span class="text-primary">{{ insight.topCategory.name }}</span>.
        </h3>
        
        <p class="text-muted-foreground text-sm">
            Esta categoria representa <span class="font-bold text-foreground">{{ insight.topCategory.percentage }}%</span> da sua fatura atual ({{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insight.topCategory.amount) }}).
        </p>
        
        <div class="pt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Dica: {{ getRandomTip() }}
        </div>
     </div>
  </div>
</template>
