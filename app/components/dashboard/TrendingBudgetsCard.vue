<script setup lang="ts">
import { AlertTriangle, TrendingUp, Wallet } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'

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

const props = defineProps<{
  categories: CategoryBudgetStatus[]
}>()

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

// Only show categories with budgets, sorted by percentage (highest first), top 4
const trendingCategories = computed(() =>
  props.categories
    .filter(c => c.budgetLimit !== null && c.budgetLimit > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4)
)

const hasAlerts = computed(() =>
  trendingCategories.value.some(c => c.status === 'warning' || c.status === 'exceeded')
)

function barColor(status: string) {
  if (status === 'exceeded') return 'bg-danger'
  if (status === 'warning') return 'bg-warning'
  return 'bg-primary'
}

function textColor(status: string) {
  if (status === 'exceeded') return 'text-danger'
  if (status === 'warning') return 'text-warning'
  return 'text-muted-foreground'
}
</script>

<template>
  <div class="glass-surface p-5">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-xl" :class="hasAlerts ? 'bg-warning/[0.08]' : 'bg-primary/[0.08]'">
          <AlertTriangle v-if="hasAlerts" class="w-4 h-4 text-warning" />
          <TrendingUp v-else class="w-4 h-4 text-primary-accent" />
        </div>
        <p class="text-micro text-muted-foreground font-medium">Orçamentos</p>
      </div>
      <NuxtLink to="/orcamento" class="text-micro text-primary-accent hover:underline font-medium">
        Ver todos
      </NuxtLink>
    </div>

    <div v-if="trendingCategories.length === 0">
      <EmptyState
        :icon="Wallet"
        title="Sem limites definidos"
        description="Quer montar um orçamento? Defina limites por categoria."
        action-label="Definir orçamento"
        action-to="/orcamento"
      />
    </div>

    <div v-else class="space-y-3">
      <div v-for="cat in trendingCategories" :key="cat.categoryId" class="space-y-1.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <span v-if="cat.categoryEmoji" class="text-sm shrink-0">{{ cat.categoryEmoji }}</span>
            <span
              v-else-if="cat.categoryColor"
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: cat.categoryColor }"
            />
            <span class="text-small font-medium truncate">{{ cat.categoryName }}</span>
          </div>
          <span class="text-micro font-bold tabular-nums shrink-0 ml-2" :class="textColor(cat.status)">
            {{ cat.percentage }}%
          </span>
        </div>

        <div class="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="barColor(cat.status)"
            :style="{ width: `${Math.min(cat.percentage, 100)}%` }"
          />
        </div>

        <div class="flex justify-between text-micro text-muted-foreground tabular-nums">
          <span>{{ formatCurrency(cat.actualSpending) }}</span>
          <span>{{ formatCurrency(cat.budgetLimit!) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
