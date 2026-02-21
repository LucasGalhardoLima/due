<script setup lang="ts">
import { Card } from '@/components/ui/card'
import { Target } from 'lucide-vue-next'

interface CategoryBudgetStatus {
  categoryId: string
  categoryName: string
  categoryColor: string | null
  categoryEmoji: string | null
  budgetLimit: number | null
  actualSpending: number
  percentage: number
  status: 'under' | 'warning' | 'exceeded' | 'no-limit'
}

defineProps<{
  categories: CategoryBudgetStatus[]
}>()

const emit = defineEmits<{
  setLimit: [categoryId: string, categoryName: string, currentLimit: number | null]
}>()

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getBarColor(status: string) {
  switch (status) {
    case 'exceeded': return 'bg-destructive'
    case 'warning': return 'bg-warning'
    case 'under': return 'bg-primary'
    default: return 'bg-muted-foreground/30'
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'exceeded': return { label: 'Acima', class: 'bg-destructive/10 text-destructive' }
    case 'warning': return { label: 'Atenção', class: 'bg-warning/10 text-warning' }
    case 'under': return { label: 'OK', class: 'bg-success/10 text-success' }
    default: return null
  }
}
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
      Categorias
    </h3>

    <Card v-if="!categories || categories.length === 0" class="p-4">
      <div class="flex items-center gap-2 py-2">
        <div class="w-6 h-6 rounded-xl bg-muted flex items-center justify-center text-[9px] font-black text-muted-foreground shrink-0 select-none">Du</div>
        <p class="text-sm text-muted-foreground">Mês zerado! Nenhum gasto registrado.</p>
      </div>
    </Card>

    <Card
      v-for="cat in categories"
      :key="cat.categoryId"
      class="p-4 space-y-2 cursor-pointer hover:bg-accent/5 transition-colors"
      @click="emit('setLimit', cat.categoryId, cat.categoryName, cat.budgetLimit)"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <span v-if="cat.categoryEmoji" class="text-sm shrink-0">{{ cat.categoryEmoji }}</span>
          <div
            v-else
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: cat.categoryColor || '#888' }"
          />
          <span class="text-sm font-medium truncate">{{ cat.categoryName }}</span>
          <span
            v-if="getStatusBadge(cat.status)"
            class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
            :class="getStatusBadge(cat.status)!.class"
          >
            {{ getStatusBadge(cat.status)!.label }}
          </span>
        </div>
        <div class="text-right shrink-0">
          <span v-if="cat.budgetLimit" class="text-xs text-muted-foreground">
            {{ formatCurrency(cat.actualSpending) }} / {{ formatCurrency(cat.budgetLimit) }}
          </span>
          <span v-else class="text-xs text-muted-foreground">
            {{ formatCurrency(cat.actualSpending) }}
          </span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="cat.budgetLimit && cat.budgetLimit > 0" class="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          :class="getBarColor(cat.status)"
          :style="{ width: `${Math.min(cat.percentage, 100)}%` }"
        />
      </div>

      <!-- No limit link -->
      <p v-if="!cat.budgetLimit" class="text-xs text-primary cursor-pointer hover:underline">
        Definir meta
      </p>
    </Card>
  </div>
</template>
