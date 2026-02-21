<script setup lang="ts">
import { Lightbulb } from 'lucide-vue-next'

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
  <div v-if="insight?.hasData" class="rounded-2xl border border-info/20 bg-info-muted p-6 shadow-elevation-1 relative overflow-hidden group hover:border-info/40 transition-colors duration-300">
     <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Lightbulb class="h-16 w-16 text-info" />
     </div>

     <div class="relative z-10 space-y-2">
        <div class="flex items-center gap-2 text-info">
            <Lightbulb class="h-4 w-4" />
            <span class="text-micro">Insight Financeiro</span>
        </div>

        <h3 class="text-h3 leading-tight">
            Atencao com <span class="text-info">{{ insight.topCategory.name }}</span>.
        </h3>

        <p class="text-body text-muted-foreground">
            Esta categoria representa <span class="font-bold text-foreground">{{ insight.topCategory.percentage }}%</span> da sua fatura atual ({{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insight.topCategory.amount) }}).
        </p>

        <div class="pt-2 text-small font-semibold text-info/80">
            Dica: {{ getRandomTip() }}
        </div>
     </div>
  </div>
</template>
