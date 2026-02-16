<script setup lang="ts">
import { ChevronLeft, ChevronRight, Wallet, ArrowUpCircle, CreditCard as CreditCardIcon } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/ui/PageHeader.vue'
import BudgetSkeleton from '@/components/budget/BudgetSkeleton.vue'
import BudgetOverviewCard from '@/components/budget/BudgetOverviewCard.vue'
import IncomeList from '@/components/budget/IncomeList.vue'
import IncomeDrawer from '@/components/budget/IncomeDrawer.vue'
import CategoryBudgetList from '@/components/budget/CategoryBudgetList.vue'
import CategoryBudgetDrawer from '@/components/budget/CategoryBudgetDrawer.vue'
import BudgetReport from '@/components/budget/BudgetReport.vue'

const { bumpDataVersion } = useDataVersion()
const { summary, status, budgetParams, prevMonth, nextMonth, refreshBudget } = useBudget()

// Pull-to-refresh
const isRefreshing = ref(false)
const pullStartY = ref(0)
const pulling = ref(false)

function onTouchStart(e: TouchEvent) {
  if (window.scrollY === 0) {
    pullStartY.value = e.touches[0].clientY
    pulling.value = true
  }
}

async function onTouchEnd(e: TouchEvent) {
  if (!pulling.value) return
  pulling.value = false
  const pullDistance = e.changedTouches[0].clientY - pullStartY.value
  if (pullDistance > 80) {
    isRefreshing.value = true
    await refreshBudget()
    isRefreshing.value = false
  }
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const monthLabel = computed(() =>
  `${MONTH_NAMES[budgetParams.value.month - 1]} ${budgetParams.value.year}`
)

// Income Drawer state
const incomeDrawerOpen = ref(false)
const editingIncomeId = ref<string | null>(null)

function openAddIncome() {
  editingIncomeId.value = null
  incomeDrawerOpen.value = true
}

function openEditIncome(id: string) {
  editingIncomeId.value = id
  incomeDrawerOpen.value = true
}

function onIncomeSaved() {
  bumpDataVersion()
}

function onIncomeDeleted() {
  bumpDataVersion()
}

// Category Budget Drawer state
const categoryBudgetDrawerOpen = ref(false)
const editingCategoryId = ref<string | null>(null)
const editingCategoryName = ref('')
const editingBudgetLimit = ref<number | null>(null)

function openCategoryBudget(categoryId: string, categoryName: string, currentLimit: number | null) {
  editingCategoryId.value = categoryId
  editingCategoryName.value = categoryName
  editingBudgetLimit.value = currentLimit
  categoryBudgetDrawerOpen.value = true
}

function onCategoryBudgetSaved() {
  bumpDataVersion()
}

// Budget Report
const { data: report } = useFetch('/api/budget/report', {
  query: computed(() => ({
    month: budgetParams.value.month,
    year: budgetParams.value.year,
  })),
  watch: [budgetParams],
})
</script>

<template>
  <div
    class="max-w-3xl mx-auto px-4 pb-24 lg:pb-8"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Loading State -->
    <BudgetSkeleton v-if="status === 'pending' && !summary" />

    <template v-else>
      <!-- Desktop Header -->
      <PageHeader
        :title="monthLabel"
        subtitle="Visão geral do seu orçamento mensal."
        :icon="Wallet"
        class="hidden lg:flex"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="icon" class="h-9 w-9" @click="prevMonth">
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" class="h-9 w-9" @click="nextMonth">
              <ChevronRight class="w-4 h-4" />
            </Button>
          </div>
        </template>
      </PageHeader>

      <!-- Mobile Header -->
      <div class="lg:hidden space-y-4 mb-7">
        <div>
          <h1 class="text-h1">Orçamento</h1>
          <p class="text-sm text-muted-foreground mt-1">Gerencie suas receitas e despesas.</p>
        </div>

        <!-- Month Navigation (Mobile) -->
        <div class="flex items-center justify-between bg-muted/40 rounded-2xl p-1.5">
          <Button variant="ghost" size="icon" class="h-9 w-9" @click="prevMonth">
            <ChevronLeft class="w-4 h-4" />
          </Button>
          <span class="text-sm font-semibold">{{ monthLabel }}</span>
          <Button variant="ghost" size="icon" class="h-9 w-9" @click="nextMonth">
            <ChevronRight class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <!-- Empty State: No income AND no transactions -->
      <Card
        v-if="summary && summary.totalIncome === 0 && summary.totalSpending === 0 && (!summary.incomes || summary.incomes.length === 0)"
        class="p-8 text-center space-y-4"
      >
        <Wallet class="w-12 h-12 mx-auto text-muted-foreground/40" />
        <div>
          <h2 class="text-lg font-semibold">Configure seu orçamento</h2>
          <p class="text-sm text-muted-foreground mt-1">Comece adicionando suas fontes de receita para ter uma visão completa do seu orçamento mensal.</p>
        </div>
        <Button @click="openAddIncome">
          <ArrowUpCircle class="w-4 h-4 mr-1.5" />
          Adicionar primeira receita
        </Button>
      </Card>

      <!-- Prompt: Has transactions but no income -->
      <Card
        v-else-if="summary && summary.totalIncome === 0 && summary.totalSpending > 0"
        class="p-4 flex items-center gap-3 border-warning/30 bg-warning/5"
      >
        <CreditCardIcon class="w-5 h-5 text-warning shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">Receitas não configuradas</p>
          <p class="text-xs text-muted-foreground">Adicione suas receitas para ver o saldo disponível e a taxa de poupança.</p>
        </div>
        <Button size="sm" variant="outline" @click="openAddIncome">Adicionar</Button>
      </Card>

      <!-- Budget Overview -->
      <div class="space-y-6">
        <BudgetOverviewCard
          v-if="summary && (summary.totalIncome > 0 || summary.totalSpending > 0)"
          :total-income="summary.totalIncome"
          :total-spending="summary.totalSpending"
          :remaining="summary.remaining"
          :savings-rate="summary.savingsRate"
        />

        <!-- Income Section -->
        <IncomeList
          :incomes="summary?.incomes || []"
          @add="openAddIncome"
          @edit="openEditIncome"
          @deleted="onIncomeDeleted"
        />

        <!-- Category Budgets Section -->
        <CategoryBudgetList
          :categories="summary?.categories || []"
          @set-limit="openCategoryBudget"
        />

        <!-- Monthly Report Section -->
        <BudgetReport v-if="report" :report="report" />
      </div>
    </template>

    <!-- Income Drawer -->
    <IncomeDrawer
      v-model:open="incomeDrawerOpen"
      :month="budgetParams.month"
      :year="budgetParams.year"
      :income-id="editingIncomeId"
      @saved="onIncomeSaved"
    />

    <!-- Category Budget Drawer -->
    <CategoryBudgetDrawer
      v-model:open="categoryBudgetDrawerOpen"
      :category-id="editingCategoryId"
      :category-name="editingCategoryName"
      :budget-limit="editingBudgetLimit"
      @saved="onCategoryBudgetSaved"
    />
  </div>
</template>
