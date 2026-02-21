<script setup lang="ts">
import { Pencil, Trash2, Plus, RefreshCw, ArrowUpCircle } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

interface IncomeEntry {
  id: string
  description: string
  amount: number
  isRecurring: boolean
}

const props = defineProps<{
  incomes: IncomeEntry[]
}>()

const emit = defineEmits<{
  add: []
  edit: [id: string]
  deleted: []
}>()

const showConfirm = ref(false)
const deleteTargetId = ref<string | null>(null)
const isDeleting = ref(false)

function confirmDelete(id: string) {
  deleteTargetId.value = id
  showConfirm.value = true
}

async function handleDelete() {
  if (!deleteTargetId.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/income/${deleteTargetId.value}`, { method: 'DELETE' })
    toast.success('Receita removida')
    emit('deleted')
  } catch {
    toast.error('Erro ao remover receita')
  } finally {
    isDeleting.value = false
    showConfirm.value = false
    deleteTargetId.value = null
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Receitas
      </h3>
      <Button variant="ghost" size="sm" class="h-8 gap-1.5" @click="emit('add')">
        <Plus class="w-3.5 h-3.5" />
        Adicionar
      </Button>
    </div>

    <!-- Empty State -->
    <Card v-if="!incomes || incomes.length === 0" class="overflow-hidden">
      <EmptyState
        :icon="ArrowUpCircle"
        title="Me conta sua renda pra eu calcular tudo!"
        description="Adicionando sua renda mensal eu consigo te mostrar quanto pode gastar por dia."
        action-label="Adicionar receita"
        @action="emit('add')"
      />
    </Card>

    <!-- Income Items -->
    <Card
      v-for="income in incomes"
      :key="income.id"
      class="flex items-center justify-between p-4 group"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex flex-col min-w-0">
          <span class="text-sm font-medium truncate">{{ income.description }}</span>
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-success font-semibold">{{ formatCurrency(income.amount) }}</span>
            <span
              v-if="income.isRecurring"
              class="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full"
            >
              <RefreshCw class="w-2.5 h-2.5" />
              Mensal
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('edit', income.id)">
          <Pencil class="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive" @click="confirmDelete(income.id)">
          <Trash2 class="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>

    <ConfirmDialog
      v-model:open="showConfirm"
      title="Remover receita?"
      description="Esta receita será removida permanentemente."
      confirm-text="Remover"
      :loading="isDeleting"
      @confirm="handleDelete"
    />
  </div>
</template>
