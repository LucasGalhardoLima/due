<script setup lang="ts">
import { CalendarClock, RotateCw, CreditCard } from 'lucide-vue-next'
import { parseISO, differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Bill {
  id: string
  description: string
  amount: number
  dueDate: string
  isSubscription: boolean
  installmentLabel: string | null
  categoryName: string
  categoryColor: string | null
}

defineProps<{
  bills: Bill[]
}>()

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

function daysUntil(dateStr: string) {
  return differenceInDays(parseISO(dateStr), new Date())
}

function dueLabel(dateStr: string) {
  const days = daysUntil(dateStr)
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Amanhã'
  if (days < 0) return `${Math.abs(days)}d atrás`
  if (days <= 7) return `${days}d`
  return format(parseISO(dateStr), "dd MMM", { locale: ptBR })
}

function dueColorClass(dateStr: string) {
  const days = daysUntil(dateStr)
  if (days <= 1) return 'text-danger font-bold'
  if (days <= 3) return 'text-warning font-bold'
  return 'text-muted-foreground'
}
</script>

<template>
  <div class="glass-surface p-5">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-xl bg-brand-accent/10 dark:bg-brand-accent/10">
          <CalendarClock class="w-4 h-4 text-primary-accent" />
        </div>
        <p class="text-micro text-muted-foreground font-medium">Próximos Vencimentos</p>
      </div>
    </div>

    <div v-if="bills.length === 0" class="flex items-center gap-2 py-4 px-1">
      <div class="w-6 h-6 rounded-xl bg-muted flex items-center justify-center text-[9px] font-black text-muted-foreground shrink-0 select-none">Du</div>
      <p class="text-small text-muted-foreground">Tudo limpo! Sem contas chegando.</p>
    </div>

    <div v-else class="space-y-1">
      <div
        v-for="bill in bills"
        :key="bill.id"
        class="flex items-center gap-3 p-2.5 -mx-1 rounded-2xl hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors group"
      >
        <!-- Icon -->
        <div
          class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          :class="bill.isSubscription ? 'bg-brand-accent/10 dark:bg-brand-accent/10' : 'bg-muted'"
        >
          <RotateCw v-if="bill.isSubscription" class="w-3.5 h-3.5 text-primary-accent" />
          <CreditCard v-else class="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        <!-- Details -->
        <div class="flex-1 min-w-0">
          <p class="text-small font-medium truncate">{{ bill.description }}</p>
          <div class="flex items-center gap-2">
            <span v-if="bill.installmentLabel" class="text-micro text-muted-foreground">
              {{ bill.installmentLabel }}
            </span>
            <span
              v-if="bill.categoryColor"
              class="w-1.5 h-1.5 rounded-full"
              :style="{ backgroundColor: bill.categoryColor }"
            />
            <span class="text-micro text-muted-foreground truncate">{{ bill.categoryName }}</span>
          </div>
        </div>

        <!-- Amount + Due -->
        <div class="text-right shrink-0">
          <p class="text-small font-bold tabular-nums">{{ formatCurrency(bill.amount) }}</p>
          <p class="text-micro tabular-nums" :class="dueColorClass(bill.dueDate)">
            {{ dueLabel(bill.dueDate) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
