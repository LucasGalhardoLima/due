<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'

const form = reactive({
  name: '',
  limit: 0,
  closingDay: 1,
  dueDay: 10,
})

const { data: cards, refresh } = await useFetch('/api/cards')

async function onSubmit() {
  await $fetch('/api/cards', {
    method: 'POST',
    body: { ...form }
  })
  
  // Reset form
  form.name = ''
  form.limit = 0
  form.closingDay = 1
  form.dueDay = 10
  
  await refresh()
  alert('Cartão adicionado!')
}

async function deleteCard(id: string) {
  if (!confirm('Tem certeza que deseja remover este cartão?')) return
  await $fetch(`/api/cards/${id}`, { method: 'DELETE' })
  await refresh()
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
        <form @submit.prevent="onSubmit" class="grid gap-4 md:grid-cols-5 items-end">
          <div class="col-span-2 space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="name">Nome do Cartão</label>
            <input 
              id="name" 
              v-model="form.name" 
              placeholder="Ex: Nubank Ultravioleta" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none" for="limit">Limite (R$)</label>
            <input 
              id="limit" 
              type="number" 
              v-model.number="form.limit" 
              placeholder="10000" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none" for="closingDay">Dia Fechamento</label>
            <input 
              id="closingDay" 
              type="number" 
              min="1" 
              max="31" 
              v-model.number="form.closingDay" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none" for="dueDay">Dia Vencimento</label>
            <input 
              id="dueDay" 
              type="number" 
              min="1" 
              max="31" 
              v-model.number="form.dueDay" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
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
          <h3 class="text-lg font-medium tracking-tight">
            {{ card.name }}
          </h3>
          <button @click="deleteCard(card.id)" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
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
    
  </div>
</template>
