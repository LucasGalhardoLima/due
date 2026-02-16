<script setup lang="ts">
import { RotateCw, CheckCircle2, Clock, AlertTriangle, Sparkles } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'
import PageHeader from '@/components/ui/PageHeader.vue'
import ListSkeleton from '@/components/ui/ListSkeleton.vue'
import TierGatedPreview from '@/components/tier/TierGatedPreview.vue'

const { canUse } = useTier()
const hasAccess = computed(() => canUse('recurring'))

interface Subscription {
  id: string
  description: string
  amount: number
  categoryName: string
  categoryColor: string | null
  categoryEmoji: string | null
  paidThisMonth: boolean
  nextDueDate: string | null
  active: boolean
  daysInactive: number
}

interface DetectedRecurring {
  description: string
  averageAmount: number
  occurrences: number
  lastDate: string
  categoryName: string
  categoryColor: string | null
  categoryEmoji: string | null
  averageInterval: number
}

const { data, status } = useFetch<{
  subscriptions: Subscription[]
  detected: DetectedRecurring[]
  totalMonthly: number
  totalAnnual: number
  activeCount: number
  detectedCount: number
}>('/api/reports/recurring')

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
</script>

<template>
  <div class="app-page animate-in fade-in slide-in-from-bottom-4 duration-500">
    <TierGatedPreview
      v-if="!hasAccess"
      feature="recurring"
      title="Gastos Recorrentes"
      description="Acompanhe assinaturas e cobranças recorrentes com detecção automática por IA."
      required-tier="plus"
    />

    <template v-else>
    <PageHeader
      title="Recorrentes"
      subtitle="Assinaturas e cobranças recorrentes."
      :icon="RotateCw"
    />

    <ListSkeleton v-if="status === 'pending'" :columns="1" :items="5" />

    <template v-else-if="data">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card class="p-5">
          <p class="text-micro text-muted-foreground">Gasto Mensal</p>
          <p class="text-2xl font-black tabular-nums mt-1">{{ formatCurrency(data.totalMonthly) }}</p>
        </Card>
        <Card class="p-5">
          <p class="text-micro text-muted-foreground">Custo Anual</p>
          <p class="text-2xl font-black tabular-nums mt-1">{{ formatCurrency(data.totalAnnual) }}</p>
        </Card>
        <Card class="p-5">
          <p class="text-micro text-muted-foreground">Assinaturas Ativas</p>
          <p class="text-2xl font-black tabular-nums mt-1">{{ data.activeCount }}</p>
        </Card>
      </div>

      <!-- Active Subscriptions -->
      <div class="space-y-3 mb-8">
        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Assinaturas Ativas
        </h3>

        <div v-if="data.subscriptions.length === 0" class="text-center py-8">
          <RotateCw class="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p class="text-sm text-muted-foreground">Nenhuma assinatura registrada.</p>
        </div>

        <Card
          v-for="sub in data.subscriptions"
          :key="sub.id"
          class="p-4 flex items-center gap-4 transition-all hover:shadow-elevation-2"
        >
          <!-- Category icon -->
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            :style="sub.categoryColor ? { backgroundColor: sub.categoryColor + '20', borderColor: sub.categoryColor + '40' } : {}"
            :class="!sub.categoryColor && 'bg-violet-100/60 dark:bg-violet-500/10'"
          >
            <span v-if="sub.categoryEmoji" class="text-base">{{ sub.categoryEmoji }}</span>
            <RotateCw v-else class="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>

          <!-- Details -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">{{ sub.description }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-muted-foreground">{{ sub.categoryName }}</span>
              <span v-if="sub.daysInactive > 45" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-warning/10 text-warning">
                {{ Math.floor(sub.daysInactive / 30) }}m inativo
              </span>
            </div>
          </div>

          <!-- Status -->
          <div class="flex items-center gap-2 shrink-0">
            <div
              class="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
              :class="sub.paidThisMonth
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'"
            >
              <CheckCircle2 v-if="sub.paidThisMonth" class="w-3 h-3" />
              <Clock v-else class="w-3 h-3" />
              {{ sub.paidThisMonth ? 'Pago' : 'Pendente' }}
            </div>
          </div>

          <!-- Amount -->
          <p class="text-sm font-black tabular-nums shrink-0">
            {{ formatCurrency(sub.amount) }}
          </p>
        </Card>
      </div>

      <!-- Auto-Detected Recurring -->
      <div v-if="data.detected.length > 0" class="space-y-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Detectados Automaticamente
          </h3>
          <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary-accent text-[10px] font-bold">
            <Sparkles class="w-3 h-3 inline mr-0.5" />
            IA
          </span>
        </div>

        <p class="text-xs text-muted-foreground">
          Transações que parecem recorrentes baseado no padrão de uso.
        </p>

        <Card
          v-for="item in data.detected"
          :key="item.description"
          class="p-4 flex items-center gap-4 border-dashed"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted/60"
          >
            <span v-if="item.categoryEmoji" class="text-base">{{ item.categoryEmoji }}</span>
            <AlertTriangle v-else class="w-4 h-4 text-muted-foreground" />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">{{ item.description }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-muted-foreground">{{ item.categoryName }}</span>
              <span class="text-xs text-muted-foreground">{{ item.occurrences }}x detectado</span>
              <span class="text-xs text-muted-foreground">~{{ item.averageInterval }}d intervalo</span>
            </div>
          </div>

          <p class="text-sm font-black tabular-nums shrink-0">
            ~{{ formatCurrency(item.averageAmount) }}
          </p>
        </Card>
      </div>
    </template>
    </template>
  </div>
</template>
