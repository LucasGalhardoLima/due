<script setup lang="ts">
import { Target } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'

interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  progress: number
  createdAt: string
}

const { data: goals } = useFetch<SavingsGoal[]>('/api/savings-goals')

const activeGoals = computed(() =>
  (goals.value || []).filter((g) => g.progress < 100).slice(0, 4)
)

const totalSaved = computed(() =>
  (goals.value || []).reduce((sum, g) => sum + g.currentAmount, 0)
)

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

function barColor(progress: number) {
  if (progress >= 66) return 'bg-success'
  if (progress >= 33) return 'bg-warning'
  return 'bg-danger'
}

function textColor(progress: number) {
  if (progress >= 66) return 'text-success'
  if (progress >= 33) return 'text-warning'
  return 'text-danger'
}
</script>

<template>
  <div class="glass-surface p-5">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-xl bg-primary/10">
          <Target class="w-4 h-4 text-primary-accent" />
        </div>
        <p class="text-micro text-muted-foreground font-medium">Metas de Economia</p>
      </div>
      <NuxtLink to="/metas" class="text-micro text-primary-accent hover:underline font-medium">
        Ver todas
      </NuxtLink>
    </div>

    <div v-if="!goals || goals.length === 0">
      <EmptyState
        :icon="Target"
        title="Bora criar sua primeira meta?"
        description="Defina um objetivo e acompanhe seu progresso."
        action-label="Criar meta"
        action-to="/metas"
      />
    </div>

    <template v-else>
      <!-- Total saved -->
      <div class="mb-4 p-3 rounded-xl bg-muted">
        <p class="text-micro text-muted-foreground">Total guardado</p>
        <p class="text-lg font-black tabular-nums">{{ formatCurrency(totalSaved) }}</p>
      </div>

      <!-- Active goals list -->
      <div v-if="activeGoals.length > 0" class="space-y-3">
        <div v-for="goal in activeGoals" :key="goal.id" class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-small font-medium truncate">{{ goal.name }}</span>
            <span class="text-micro font-bold tabular-nums shrink-0 ml-2" :class="textColor(goal.progress)">
              {{ goal.progress.toFixed(0) }}%
            </span>
          </div>

          <div class="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="barColor(goal.progress)"
              :style="{ width: `${Math.min(goal.progress, 100)}%` }"
            />
          </div>

          <div class="flex justify-between text-micro text-muted-foreground tabular-nums">
            <span>{{ formatCurrency(goal.currentAmount) }}</span>
            <span>{{ formatCurrency(goal.targetAmount) }}</span>
          </div>
        </div>
      </div>

      <div v-else class="text-small text-muted-foreground text-center py-2">
        Todas as metas foram atingidas!
      </div>
    </template>
  </div>
</template>
