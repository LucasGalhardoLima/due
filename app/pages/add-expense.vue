<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PageHeader from '@/components/ui/PageHeader.vue'
import { PlusCircle } from 'lucide-vue-next'

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
  if (!form.description) {
    toast.error('Informe uma descrição', { position: 'top-center' })
    return
  }
  if (!form.amount) {
    toast.error('Informe o valor', { position: 'top-center' })
    return
  }
  if (!form.cardId) {
    toast.error('Selecione um cartão', { position: 'top-center' })
    return
  }

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
    
    toast.success('Despesa adicionada!', { position: 'top-center' })
    router.push('/')
  } catch (e) {
    console.error(e)
    toast.error('Erro ao adicionar despesa')
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <PageHeader 
      title="Adicionar Gasto" 
      subtitle="Registre uma nova despesa rapidamente."
      :icon="PlusCircle"
      backTo="/"
    />

    <div v-if="!cards?.length" class="p-6 rounded-2xl border bg-warning-muted text-warning border-warning/20 shadow-elevation-2">
      <p class="text-body font-medium">Voce precisa cadastrar um cartao primeiro.</p>
      <NuxtLink to="/cards" class="text-micro underline mt-3 block hover:opacity-80">
        Cadastrar Cartao
      </NuxtLink>
    </div>

    <form v-else class="space-y-6 bg-card p-8 rounded-2xl border shadow-elevation-2" @submit.prevent="onSubmit">
      <!-- Descricao -->
      <div class="space-y-2">
        <label class="text-micro text-muted-foreground" for="description">O que voce comprou?</label>
        <input
          id="description"
          name="expense-description"
          autocomplete="off"
          v-model="form.description"
          placeholder="Ex: Almoco, Uber, Assinatura…"
          class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-elevation-1 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-colors transition-shadow"
          required
        >
      </div>

      <!-- Valor -->
      <div class="space-y-2">
        <label class="text-micro text-muted-foreground" for="amount">Valor Total (R$)</label>
        <input
          id="amount"
          name="expense-amount"
          inputmode="decimal"
          v-model.number="form.amount"
          type="number"
          step="0.01"
          placeholder="0,00"
          class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-lg font-bold shadow-elevation-1 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-colors transition-shadow"
          required
        >
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Data -->
        <div class="space-y-2">
          <label class="text-micro text-muted-foreground" for="date">Data da Compra</label>
          <input
            id="date"
            name="expense-date"
            v-model="form.date"
            type="date"
            class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-elevation-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-colors transition-shadow"
            required
          >
        </div>

        <!-- Parcelas -->
        <div class="space-y-2">
          <label class="text-micro text-muted-foreground" for="installments">Parcelas</label>
          <input
            id="installments"
            name="expense-installments"
            inputmode="numeric"
            v-model.number="form.installments"
            type="number"
            min="1"
            max="24"
            class="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-elevation-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-colors transition-shadow"
          >
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Cartao -->
        <div class="space-y-2">
          <label class="text-micro text-muted-foreground">Cartao</label>
          <Select v-model="form.cardId">
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="card in cards" :key="card.id" :value="card.id">
                {{ card.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Categoria -->
        <div class="space-y-2">
          <label class="text-micro text-muted-foreground">Categoria</label>
          <Select v-model="form.categoryId">
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="sticky bottom-0 -mx-8 -mb-8 p-4 bg-background/95 backdrop-blur-xl border-t md:static md:mx-0 md:mb-0 md:p-0 md:bg-transparent md:border-0 z-20">
        <button
          type="submit"
          class="w-full inline-flex items-center justify-center whitespace-nowrap rounded-xl text-base font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-14 md:h-11 px-4 shadow-elevation-3 active:scale-[0.98]"
        >
          <PlusCircle class="w-5 h-5 mr-2" />
          Adicionar Despesa
        </button>
      </div>

    </form>
  </div>
</template>
