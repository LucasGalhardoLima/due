<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

const form = reactive({
  name: '',
  limit: 0,
  budget: null as number | null,
  closingDay: 1,
  dueDay: 10,
})

interface Card {
  id: string
  name: string
  limit: number
  budget?: number
  closingDay: number
  dueDay: number
  isDefault: boolean
}

const { data: cards, refresh } = await useFetch<Card[]>('/api/cards')

async function onSubmit() {
  await $fetch('/api/cards', {
    method: 'POST',
    body: { ...form }
  })
  
  // Reset form
  form.name = ''
  form.limit = 0
  form.budget = null
  form.closingDay = 1
  form.dueDay = 10
  
  await refresh()
  toast.success('Cartão adicionado!')
}

// Confirm Dialog State
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
  <div class="container mx-auto py-10 space-y-8">
    
    <!-- Add Card Section (Shadcn Card Styles) -->
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div class="flex flex-col space-y-1.5 p-6">
        <h3 class="text-2xl font-semibold leading-none tracking-tight">Adicionar Novo Cartão</h3>
        <p class="text-sm text-muted-foreground">Cadastre seus cartões de crédito.</p>
      </div>
      <div class="p-6 pt-0">
        <form class="grid gap-4 md:grid-cols-5 items-end" @submit.prevent="onSubmit">
          <div class="col-span-2 space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">Nome do Cartão</label>
            <input 
              id="name" 
              v-model="form.name" 
              placeholder="Ex: Nubank Ultravioleta" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none" for="limit">Limite (R$)</label>
            <input 
              id="limit" 
              v-model.number="form.limit" 
              type="number" 
              placeholder="10000" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none" for="closingDay">Dia Fechamento</label>
            <input 
              id="closingDay" 
              v-model.number="form.closingDay" 
              type="number" 
              min="1" 
              max="31" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none" for="dueDay">Dia Vencimento</label>
            <input 
              id="dueDay" 
              v-model.number="form.dueDay" 
              type="number" 
              min="1" 
              max="31" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
          </div>
          
          <div class="col-span-1 md:col-start-5">
            <button 
              type="submit" 
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Cards List -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="card in cards" :key="card.id" class="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div class="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-medium tracking-tight">
              {{ card.name }}
            </h3>
            <span v-if="card.isDefault" class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Padrão
            </span>
          </div>
          <button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10" @click="confirmDelete(card.id)">
            <Trash2 class="h-4 w-4 text-destructive" />
          </button>
        </div>
        <div class="p-6 pt-0">
          <div class="text-2xl font-bold">R$ {{ card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</div>
          <p class="text-xs text-muted-foreground">
            Fecha dia {{ card.closingDay }} • Vence dia {{ card.dueDay }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Confirm Dialog -->
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
