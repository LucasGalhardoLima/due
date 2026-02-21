<script setup lang="ts">
import { Target, Plus, Minus, Trash2, Pencil, X, Check } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PageHeader from '@/components/ui/PageHeader.vue'
import TierGatedPreview from '@/components/tier/TierGatedPreview.vue'
import { toast } from 'vue-sonner'

const { limits } = useTier()
const hasAccess = computed(() => (limits.value.maxSavingsGoals ?? 1) > 0)

interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  progress: number
  createdAt: string
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

// Fetch goals
const { data: goals, refresh: refreshGoals, status } = useFetch<SavingsGoal[]>('/api/savings-goals')

// Add goal form
const showAddForm = ref(false)
const newGoalName = ref('')
const newGoalTarget = ref<number | undefined>(undefined)
const newGoalDeadline = ref('')
const isSubmitting = ref(false)

async function addGoal() {
  if (!newGoalName.value || !newGoalTarget.value) return
  isSubmitting.value = true
  try {
    await $fetch('/api/savings-goals', {
      method: 'POST',
      body: {
        name: newGoalName.value,
        targetAmount: newGoalTarget.value,
        deadline: newGoalDeadline.value || undefined,
      },
    })
    toast.success('Meta criada com sucesso!')
    newGoalName.value = ''
    newGoalTarget.value = undefined
    newGoalDeadline.value = ''
    showAddForm.value = false
    refreshGoals()
  } catch {
    toast.error('Erro ao criar meta.')
  } finally {
    isSubmitting.value = false
  }
}

// Delete goal
async function deleteGoal(id: string) {
  try {
    await $fetch(`/api/savings-goals/${id}`, { method: 'DELETE' })
    toast.success('Meta excluida.')
    refreshGoals()
  } catch {
    toast.error('Erro ao excluir meta.')
  }
}

// Deposit / Withdraw
const depositAmounts = ref<Record<string, number | undefined>>({})

async function deposit(id: string) {
  const amount = depositAmounts.value[id]
  if (!amount || amount <= 0) return
  try {
    await $fetch(`/api/savings-goals/${id}/deposit`, {
      method: 'POST',
      body: { amount },
    })
    toast.success('Deposito registrado!')
    depositAmounts.value[id] = undefined
    refreshGoals()
  } catch {
    toast.error('Erro ao registrar deposito.')
  }
}

async function withdraw(id: string) {
  const amount = depositAmounts.value[id]
  if (!amount || amount <= 0) return
  try {
    await $fetch(`/api/savings-goals/${id}/deposit`, {
      method: 'POST',
      body: { amount: -amount },
    })
    toast.success('Resgate registrado!')
    depositAmounts.value[id] = undefined
    refreshGoals()
  } catch {
    toast.error('Erro ao registrar resgate.')
  }
}

// Edit goal inline
const editingGoalId = ref<string | null>(null)
const editName = ref('')
const editTarget = ref<number | undefined>(undefined)
const editDeadline = ref('')

function startEdit(goal: SavingsGoal) {
  editingGoalId.value = goal.id
  editName.value = goal.name
  editTarget.value = goal.targetAmount
  editDeadline.value = goal.deadline ? goal.deadline.split('T')[0] : ''
}

function cancelEdit() {
  editingGoalId.value = null
}

async function saveEdit(id: string) {
  if (!editName.value || !editTarget.value) return
  try {
    await $fetch(`/api/savings-goals/${id}`, {
      method: 'PUT',
      body: {
        name: editName.value,
        targetAmount: editTarget.value,
        deadline: editDeadline.value || null,
      },
    })
    toast.success('Meta atualizada!')
    editingGoalId.value = null
    refreshGoals()
  } catch {
    toast.error('Erro ao atualizar meta.')
  }
}

// Status color helpers
function progressBarColor(progress: number) {
  if (progress >= 66) return 'bg-success'
  if (progress >= 33) return 'bg-warning'
  return 'bg-danger'
}

function progressTextColor(progress: number) {
  if (progress >= 66) return 'text-success'
  if (progress >= 33) return 'text-warning'
  return 'text-danger'
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return null
  const date = new Date(deadline)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 pb-24 lg:pb-8">
    <TierGatedPreview
      v-if="!hasAccess"
      feature="maxSavingsGoals"
      title="Metas de Economia"
      description="Defina metas financeiras e acompanhe seu progresso com depósitos e resgates."
      required-tier="plus"
    />

    <template v-else>
    <!-- Desktop Header -->
    <PageHeader
      title="Metas de Economia"
      subtitle="Acompanhe e gerencie suas metas financeiras."
      :icon="Target"
      class="hidden lg:flex"
    >
      <template #actions>
        <Button @click="showAddForm = !showAddForm">
          <Plus class="w-4 h-4 mr-1.5" />
          Nova Meta
        </Button>
      </template>
    </PageHeader>

    <!-- Mobile Header -->
    <div class="lg:hidden space-y-4 mb-7">
      <div>
        <h1 class="text-h1">Metas</h1>
        <p class="text-sm text-muted-foreground mt-1">Gerencie suas metas financeiras.</p>
      </div>
      <Button class="w-full" @click="showAddForm = !showAddForm">
        <Plus class="w-4 h-4 mr-1.5" />
        Nova Meta
      </Button>
    </div>

    <!-- Add Goal Form -->
    <Card v-if="showAddForm" class="p-5 mb-6 space-y-4">
      <h3 class="text-base font-semibold">Criar nova meta</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="goal-name">Nome</Label>
          <Input
            id="goal-name"
            v-model="newGoalName"
            placeholder="Ex: Viagem, Reserva de Emergência"
          />
        </div>
        <div class="space-y-2">
          <Label for="goal-target">Valor alvo (R$)</Label>
          <Input
            id="goal-target"
            v-model.number="newGoalTarget"
            type="number"
            min="0"
            step="0.01"
            placeholder="10000.00"
          />
        </div>
        <div class="space-y-2">
          <Label for="goal-deadline">Prazo (opcional)</Label>
          <Input
            id="goal-deadline"
            v-model="newGoalDeadline"
            type="date"
          />
        </div>
      </div>
      <div class="flex items-center gap-2 pt-2">
        <Button :disabled="isSubmitting || !newGoalName || !newGoalTarget" @click="addGoal">
          <Check class="w-4 h-4 mr-1.5" />
          Salvar
        </Button>
        <Button variant="ghost" @click="showAddForm = false">
          Cancelar
        </Button>
      </div>
    </Card>

    <!-- Loading State -->
    <div v-if="status === 'pending' && !goals" class="space-y-4">
      <Skeleton v-for="i in 3" :key="i" class="h-40 rounded-3xl" />
    </div>

    <!-- Empty State -->
    <Card v-else-if="goals && goals.length === 0" class="overflow-hidden">
      <EmptyState
        :icon="Target"
        title="Sem metas ainda? Bora criar uma!"
        description="Defina um objetivo financeiro e acompanhe o progresso com depósitos."
        action-label="Criar primeira meta"
        @action="showAddForm = true"
      />
    </Card>

    <!-- Goals List -->
    <div v-else class="space-y-4">
      <Card
        v-for="goal in goals"
        :key="goal.id"
        class="p-5 space-y-4"
      >
        <!-- Edit mode -->
        <template v-if="editingGoalId === goal.id">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Nome</Label>
              <Input v-model="editName" />
            </div>
            <div class="space-y-2">
              <Label>Valor alvo (R$)</Label>
              <Input v-model.number="editTarget" type="number" min="0" step="0.01" />
            </div>
            <div class="space-y-2">
              <Label>Prazo</Label>
              <Input v-model="editDeadline" type="date" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button size="sm" @click="saveEdit(goal.id)">
              <Check class="w-3.5 h-3.5 mr-1" />
              Salvar
            </Button>
            <Button size="sm" variant="ghost" @click="cancelEdit">
              <X class="w-3.5 h-3.5 mr-1" />
              Cancelar
            </Button>
          </div>
        </template>

        <!-- View mode -->
        <template v-else>
          <!-- Header row -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="p-2 rounded-xl shrink-0" :class="goal.progress >= 100 ? 'bg-success/10' : 'bg-primary/10'">
                <Target class="w-5 h-5" :class="goal.progress >= 100 ? 'text-success' : 'text-primary'" />
              </div>
              <div class="min-w-0">
                <h3 class="text-base font-semibold truncate">{{ goal.name }}</h3>
                <p v-if="goal.deadline" class="text-micro text-muted-foreground">
                  Prazo: {{ formatDeadline(goal.deadline) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" class="h-8 w-8" @click="startEdit(goal)">
                <Pencil class="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" class="h-8 w-8 hover:text-danger" @click="deleteGoal(goal.id)">
                <Trash2 class="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-small font-bold tabular-nums">
                {{ formatCurrency(goal.currentAmount) }}
              </span>
              <span class="text-micro font-bold tabular-nums" :class="progressTextColor(goal.progress)">
                {{ goal.progress.toFixed(1) }}%
              </span>
            </div>
            <div class="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="progressBarColor(goal.progress)"
                :style="{ width: `${Math.min(goal.progress, 100)}%` }"
              />
            </div>
            <div class="flex justify-between text-micro text-muted-foreground tabular-nums">
              <span>Guardado</span>
              <span>Meta: {{ formatCurrency(goal.targetAmount) }}</span>
            </div>
          </div>

          <!-- Deposit / Withdraw -->
          <div class="flex items-center gap-2 pt-1">
            <Input
              v-model.number="depositAmounts[goal.id]"
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor"
              class="flex-1 h-9"
            />
            <Button
              size="sm"
              variant="outline"
              class="shrink-0"
              :disabled="!depositAmounts[goal.id] || depositAmounts[goal.id]! <= 0"
              @click="deposit(goal.id)"
            >
              <Plus class="w-3.5 h-3.5 mr-1" />
              Depositar
            </Button>
            <Button
              size="sm"
              variant="outline"
              class="shrink-0"
              :disabled="!depositAmounts[goal.id] || depositAmounts[goal.id]! <= 0"
              @click="withdraw(goal.id)"
            >
              <Minus class="w-3.5 h-3.5 mr-1" />
              Resgatar
            </Button>
          </div>
        </template>
      </Card>
    </div>
    </template>
  </div>
</template>
