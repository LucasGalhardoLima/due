<script setup lang="ts">
import { toast } from 'vue-sonner'
// Quick Expense Add Page

const router = useRouter()

interface Card {
  id: string
  name: string
  closingDay: number
  dueDay: number
}

interface Category {
  id: string
  name: string
}

const { data: cards } = await useFetch<Card[]>('/api/cards')
const { data: categories } = await useFetch<Category[]>('/api/categories')

const form = reactive({
  description: '',
  amount: undefined as number | undefined,
  date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  installments: 1,
  cardId: '',
  categoryId: ''
})

// Set defaults if available
watchEffect(() => {
  if (cards.value && cards.value.length > 0 && !form.cardId) {
    const firstCard = cards.value[0]
    if (firstCard) form.cardId = firstCard.id
  }
  if (categories.value && categories.value.length > 0 && !form.categoryId) {
    const defaultCat = categories.value.find(c => c.name === 'Outros')
    if (defaultCat) {
      form.categoryId = defaultCat.id
    } else {
      const firstCat = categories.value[0]
      if (firstCat) form.categoryId = firstCat.id
    }
  }
})

async function onSubmit() {
  if (!form.description || !form.amount || !form.cardId) return

  try {
    await $fetch('/api/transactions', {
      method: 'POST',
      body: {
        description: form.description,
        amount: form.amount,
        purchaseDate: form.date ? new Date(form.date + 'T12:00:00Z').toISOString() : new Date().toISOString(),
        installmentsCount: form.installments,
        cardId: form.cardId,
        categoryId: form.categoryId || undefined
      }
    })
    
    toast.success('Despesa adicionada com sucesso!')
    router.push('/')
  } catch (e) {
    console.error(e)
    toast.error('Erro ao adicionar despesa')
  }
}
</script>

<template>
  <div class="container mx-auto py-8 max-w-lg space-y-8">
    <div class="flex items-center space-x-4">
      <NuxtLink to="/" class="p-2 -ml-2 rounded-full hover:bg-accent">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><path d="m15 18-6-6 6-6"/></svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold tracking-tight">Adicionar Gasto</h1>
    </div>

    <div v-if="!cards?.length" class="p-4 rounded-lg border bg-yellow-50 text-yellow-800">
      <p>Você precisa cadastrar um cartão primeiro.</p>
      <NuxtLink to="/cards" class="font-medium underline mt-2 block">Cadastrar Cartão</NuxtLink>
    </div>

    <form v-else @submit.prevent="onSubmit" class="space-y-6">
      
      <!-- Descrição -->
      <div class="space-y-2">
        <label class="text-sm font-medium leading-none" for="description">O que você comprou?</label>
        <input 
          id="description" 
          v-model="form.description" 
          placeholder="Ex: Almoço, Uber, Assinatura" 
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        />
      </div>

      <!-- Valor -->
      <div class="space-y-2">
        <label class="text-sm font-medium leading-none" for="amount">Valor Total (R$)</label>
        <input 
          id="amount" 
          type="number" 
          step="0.01"
          v-model.number="form.amount" 
          placeholder="0,00" 
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Data -->
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none" for="date">Data da Compra</label>
          <input 
            id="date" 
            type="date" 
            v-model="form.date" 
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          />
        </div>

        <!-- Parcelas -->
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none" for="installments">Parcelas</label>
          <input 
            id="installments" 
            type="number" 
            min="1" 
            max="24" 
            v-model.number="form.installments" 
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Cartão -->
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none" for="card">Cartão</label>
          <select 
            id="card" 
            v-model="form.cardId"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option v-for="card in cards" :key="card.id" :value="card.id">
              {{ card.name }} (Fecha dia {{ card.closingDay }})
            </option>
          </select>
        </div>

        <!-- Categoria -->
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none" for="category">Categoria</label>
          <select 
            id="category" 
            v-model="form.categoryId"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="" disabled>Selecione</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        class="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        Adicionar Despesa
      </button>

    </form>
  </div>
</template>
