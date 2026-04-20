<script setup lang="ts">
import { Trash2, CreditCard as CardIcon, Plus, Pencil } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { Card } from '@/components/ui/card'
import ListSkeleton from '@/components/ui/ListSkeleton.vue'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import CardCyclePicker from '@/components/card/CardCyclePicker.vue'

interface CardItem {
  id: string
  name: string
  limit: number
  budget?: number
  closingDay: number
  dueDay: number
  dueNextMonth: boolean
  isDefault: boolean
}

const form = reactive({
  name: '',
  limit: 0,
  budget: null as number | null,
  closingDay: 1,
  dueDay: 10,
  dueNextMonth: true,
})

const { data: cards, refresh, status } = useFetch<CardItem[]>('/api/cards')

const cardsCount = computed(() => cards.value?.length ?? 0)
const totalLimit = computed(() => (cards.value ?? []).reduce((sum, card) => sum + (card.limit || 0), 0))
const totalBudget = computed(() => (cards.value ?? []).reduce((sum, card) => sum + (card.budget || 0), 0))

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function graceDays(card: CardItem) {
  const d = new Date()
  const close = new Date(d.getFullYear(), d.getMonth(), card.closingDay)
  const dueMonthOffset = card.dueNextMonth ? 1 : (card.dueDay < card.closingDay ? 1 : 0)
  const due = new Date(d.getFullYear(), d.getMonth() + dueMonthOffset, card.dueDay)
  return Math.max(0, Math.round((due.getTime() - close.getTime()) / 86_400_000))
}

async function onSubmit() {
  try {
    await $fetch('/api/cards', {
      method: 'POST',
      body: { ...form }
    })
    form.name = ''
    form.limit = 0
    form.budget = null
    form.closingDay = 1
    form.dueDay = 10
    form.dueNextMonth = true
    await refresh()
    toast.success('Cartão adicionado!')
  } catch (e) {
    console.error(e)
    toast.error('Erro ao salvar cartão')
  }
}

// Edit Sheet state
const editOpen = ref(false)
const editForm = reactive({
  id: '',
  name: '',
  limit: 0,
  budget: null as number | null,
  closingDay: 1,
  dueDay: 10,
  dueNextMonth: true,
})

function openEdit(card: CardItem) {
  editForm.id = card.id
  editForm.name = card.name
  editForm.limit = card.limit
  editForm.budget = card.budget ?? null
  editForm.closingDay = card.closingDay
  editForm.dueDay = card.dueDay
  editForm.dueNextMonth = card.dueNextMonth
  editOpen.value = true
}

async function onSave() {
  try {
    await $fetch(`/api/cards/${editForm.id}`, {
      method: 'PUT',
      body: {
        name: editForm.name,
        limit: editForm.limit,
        budget: editForm.budget,
        closingDay: editForm.closingDay,
        dueDay: editForm.dueDay,
        dueNextMonth: editForm.dueNextMonth,
      }
    })
    editOpen.value = false
    await refresh()
    toast.success('Cartão atualizado!')
  } catch (e) {
    console.error(e)
    toast.error('Erro ao salvar alterações')
  }
}

// Delete Confirm
const showConfirm = ref(false)
const cardToDelete = ref<string | null>(null)

function confirmDelete(id: string) {
  cardToDelete.value = id
  showConfirm.value = true
}

async function handleDelete() {
  if (!cardToDelete.value) return
  try {
    await $fetch(`/api/cards/${cardToDelete.value}`, { method: 'DELETE' })
    await refresh()
    toast.success('Cartão removido com sucesso')
  } catch (e) {
    console.error(e)
    toast.error('Erro ao remover cartão')
  } finally {
    showConfirm.value = false
    cardToDelete.value = null
  }
}
</script>

<template>
  <div class="app-page animate-in fade-in slide-in-from-bottom-4 duration-500">
    <PageHeader
      title="Cartões"
      subtitle="Gerencie seus cartões de crédito e limites."
      :icon="CardIcon"
    />

    <ListSkeleton v-if="status === 'pending'" :columns="3" :items="3" />

    <template v-else>
      <!-- Add Card -->
      <div class="rounded-[2rem] border border-border/70 bg-card text-card-foreground shadow-elevation-2 overflow-hidden transition-all duration-300 hover:shadow-elevation-3 hover:border-primary/25">
        <div class="bg-secondary/5 px-6 py-4 border-b border-border/60 flex items-center gap-2 transition-colors duration-200">
          <Plus class="w-4 h-4 text-primary" />
          <h3 class="text-micro text-muted-foreground">Adicionar Novo Cartão</h3>
        </div>
        <div class="p-8 space-y-6">
          <form class="space-y-6" @submit.prevent="onSubmit">
            <div class="grid gap-6 md:grid-cols-5 items-end">
              <div class="md:col-span-2 space-y-2">
                <label class="text-micro text-muted-foreground ml-1" for="name">Nome do Cartão</label>
                <input
                  id="name"
                  v-model="form.name"
                  name="card-name"
                  autocomplete="cc-name"
                  placeholder="Ex: Nubank Ultravioleta…"
                  class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
                  required
                >
              </div>

              <div class="space-y-2">
                <label class="text-micro text-muted-foreground ml-1" for="limit">Limite (R$)</label>
                <input
                  id="limit"
                  v-model.number="form.limit"
                  name="card-limit"
                  inputmode="numeric"
                  type="number"
                  placeholder="10000"
                  class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
                  required
                >
              </div>

              <div class="space-y-2">
                <label class="text-micro text-muted-foreground ml-1" for="closingDay">Fechamento</label>
                <input
                  id="closingDay"
                  v-model.number="form.closingDay"
                  name="closing-day"
                  inputmode="numeric"
                  type="number"
                  min="1"
                  max="31"
                  class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
                  required
                >
              </div>

              <div class="space-y-2">
                <label class="text-micro text-muted-foreground ml-1" for="dueDay">Vencimento</label>
                <input
                  id="dueDay"
                  v-model.number="form.dueDay"
                  name="due-day"
                  inputmode="numeric"
                  type="number"
                  min="1"
                  max="31"
                  class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
                  required
                >
              </div>
            </div>

            <div class="grid gap-6 md:grid-cols-5 items-end">
              <div class="md:col-span-2 space-y-2">
                <label class="text-micro text-muted-foreground ml-1" for="budget">Meta (Opcional)</label>
                <input
                  id="budget"
                  v-model.number="form.budget"
                  name="card-budget"
                  inputmode="decimal"
                  type="number"
                  placeholder="500.00"
                  class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
                >
              </div>

              <div class="md:col-span-3 md:col-start-5 flex justify-end">
                <button
                  type="submit"
                  class="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 py-2 active:scale-[0.98] hover:-translate-y-[1px] shadow-elevation-2 hover:shadow-elevation-3"
                >
                  Salvar
                </button>
              </div>
            </div>

            <CardCyclePicker
              v-model="form.dueNextMonth"
              :closing-day="form.closingDay"
              :due-day="form.dueDay"
            />
          </form>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <Card class="p-5 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-elevation-3">
          <p class="text-micro text-muted-foreground">Cartões cadastrados</p>
          <p class="text-h2 mt-1">{{ cardsCount }}</p>
        </Card>
        <Card class="p-5 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-elevation-3">
          <p class="text-micro text-muted-foreground">Limite total</p>
          <p class="text-h2 mt-1">{{ formatCurrency(totalLimit) }}</p>
        </Card>
        <Card class="p-5 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-elevation-3">
          <p class="text-micro text-muted-foreground">Meta total (opcional)</p>
          <p class="text-h2 mt-1">{{ formatCurrency(totalBudget) }}</p>
        </Card>
      </div>

      <!-- Cards List -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="card in cards"
          :key="card.id"
          interactive
          class="overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-elevation-3 hover:-translate-y-[2px]"
          @click="openEdit(card)"
        >
          <div class="flex flex-row items-center justify-between space-y-0 p-6 pb-4 border-b border-border/60 bg-secondary/5 transition-colors duration-200 group-hover:bg-secondary/8">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-xl bg-primary/20 border border-primary/35 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:bg-primary/25">
                <CardIcon class="h-4 w-4 text-primary transition-transform duration-200 group-hover:scale-105" />
              </div>
              <h3 class="text-micro text-muted-foreground">{{ card.name }}</h3>
              <span v-if="card.isDefault" class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-micro text-primary-accent border border-primary/20">
                Padrão
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary h-9 w-9 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-[0.97]"
                aria-label="Editar cartão"
                @click.stop="openEdit(card)"
              >
                <Pencil class="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                class="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive h-9 w-9 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-[0.97]"
                aria-label="Remover cartão"
                @click.stop="confirmDelete(card.id)"
              >
                <Trash2 class="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div class="p-6">
            <div class="flex flex-col mb-4">
              <div class="text-h2">{{ formatCurrency(card.limit) }}</div>
              <div v-if="card.budget" class="text-small font-bold text-primary mt-1 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-primary" />
                Meta: {{ formatCurrency(card.budget) }}
              </div>
            </div>
            <div class="pt-4 border-t border-border">
              <span class="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted/35 px-3 py-1.5 text-micro text-muted-foreground">
                <span class="font-semibold text-foreground tabular-nums">Fecha {{ card.closingDay }}</span>
                <span class="opacity-40">→</span>
                <span class="font-semibold text-foreground tabular-nums">Vence {{ card.dueDay }}</span>
                <span v-if="card.dueNextMonth" class="text-primary-accent">· mês seguinte</span>
                <span class="opacity-60 tabular-nums">· ~{{ graceDays(card) }}d</span>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </template>

    <!-- Edit Sheet -->
    <Sheet v-model:open="editOpen">
      <SheetContent class="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar cartão</SheetTitle>
          <SheetDescription>Ajuste limite, ciclo de fatura e meta.</SheetDescription>
        </SheetHeader>

        <form class="mt-6 space-y-5" @submit.prevent="onSave">
          <div class="space-y-2">
            <label class="text-micro text-muted-foreground ml-1" for="edit-name">Nome do Cartão</label>
            <input
              id="edit-name"
              v-model="editForm.name"
              class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
              required
            >
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-micro text-muted-foreground ml-1" for="edit-limit">Limite (R$)</label>
              <input
                id="edit-limit"
                v-model.number="editForm.limit"
                type="number"
                inputmode="numeric"
                class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
                required
              >
            </div>
            <div class="space-y-2">
              <label class="text-micro text-muted-foreground ml-1" for="edit-budget">Meta (opcional)</label>
              <input
                id="edit-budget"
                v-model.number="editForm.budget"
                type="number"
                inputmode="decimal"
                placeholder="500.00"
                class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
              >
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-micro text-muted-foreground ml-1" for="edit-closing">Fechamento</label>
              <input
                id="edit-closing"
                v-model.number="editForm.closingDay"
                type="number"
                inputmode="numeric"
                min="1"
                max="31"
                class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
                required
              >
            </div>
            <div class="space-y-2">
              <label class="text-micro text-muted-foreground ml-1" for="edit-due">Vencimento</label>
              <input
                id="edit-due"
                v-model.number="editForm.dueDay"
                type="number"
                inputmode="numeric"
                min="1"
                max="31"
                class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 shadow-elevation-1 hover:border-primary/30"
                required
              >
            </div>
          </div>

          <CardCyclePicker
            v-model="editForm.dueNextMonth"
            :closing-day="editForm.closingDay"
            :due-day="editForm.dueDay"
          />

          <SheetFooter class="flex-row gap-2 justify-end pt-4">
            <button
              type="button"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 bg-muted text-foreground hover:bg-muted/80 h-11 px-5"
              @click="editOpen = false"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-5 active:scale-[0.98] hover:-translate-y-[1px] shadow-elevation-2 hover:shadow-elevation-3"
            >
              Salvar alterações
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <ConfirmDialog
      v-model:open="showConfirm"
      title="Remover cartão?"
      description="Esta ação removerá o cartão e não poderá ser desfeita. Transações vinculadas poderão ficar sem cartão associado."
      confirm-text="Sim, remover"
      cancel-text="Cancelar"
      @confirm="handleDelete"
    />
  </div>
</template>
