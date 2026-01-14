<script setup lang="ts">
import { toast } from 'vue-sonner'
// Using Vue reactive instead of vee-validate to avoid SSR issues
const form = reactive({
  description: '',
  installmentValue: 0,
  remainingInstallments: 1,
  cardId: ''
})

const errors = reactive({
  description: '',
  installmentValue: '',
  remainingInstallments: '',
  cardId: ''
})

const { data: cards } = await useFetch('/api/cards')

function validate() {
  let isValid = true
  
  // Reset errors
  errors.description = ''
  errors.installmentValue = ''
  errors.remainingInstallments = ''
  errors.cardId = ''
  
  if (!form.description || form.description.length < 2) {
    errors.description = 'Descrição é obrigatória'
    isValid = false
  }
  
  if (!form.installmentValue || form.installmentValue <= 0) {
    errors.installmentValue = 'Valor deve ser positivo'
    isValid = false
  }
  
  if (!form.remainingInstallments || form.remainingInstallments < 1) {
    errors.remainingInstallments = 'Mínimo 1 parcela'
    isValid = false
  }
  
  if (!form.cardId) {
    errors.cardId = 'Selecione um cartão'
    isValid = false
  }
  
  return isValid
}

async function onSubmit() {
  if (!validate()) return
  
  const totalAmount = form.installmentValue * form.remainingInstallments
  
  await $fetch('/api/transactions', {
    method: 'POST',
    body: {
      description: form.description,
      amount: totalAmount,
      installmentsCount: form.remainingInstallments,
      purchaseDate: new Date().toISOString(),
      cardId: form.cardId,
    }
  })
  
  toast.success('Despesa legada adicionada!')
  
  // Reset form
  form.description = ''
  form.installmentValue = 0
  form.remainingInstallments = 1
  form.cardId = ''
}
</script>

<template>
  <div class="container mx-auto max-w-md py-10">
    <div class="border rounded-lg shadow-sm bg-card text-card-foreground">
      <div class="p-6 pb-2">
        <h2 class="text-2xl font-semibold">Carga Inicial (Legado)</h2>
        <p class="text-sm text-muted-foreground">Cadastre o que falta pagar das suas compras antigas.</p>
      </div>
      <div class="p-6 pt-0">
        <form class="space-y-4" @submit.prevent="onSubmit">
          
          <div class="space-y-2">
            <label class="text-sm font-medium" for="description">O que você comprou?</label>
            <input 
              id="description"
              v-model="form.description" 
              type="text"
              placeholder="Ex: TV Sala" 
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
            <p v-if="errors.description" class="text-sm text-destructive">{{ errors.description }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium" for="installmentValue">Valor da Parcela</label>
              <input 
                id="installmentValue"
                v-model.number="form.installmentValue" 
                type="number" 
                step="0.01"
                placeholder="R$ 100,00" 
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
              <p v-if="errors.installmentValue" class="text-sm text-destructive">{{ errors.installmentValue }}</p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium" for="remainingInstallments">Faltam quantas?</label>
              <input 
                id="remainingInstallments"
                v-model.number="form.remainingInstallments" 
                type="number"
                placeholder="Ex: 4" 
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
              <p v-if="errors.remainingInstallments" class="text-sm text-destructive">{{ errors.remainingInstallments }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="cardId">Qual Cartão?</label>
            <select 
              id="cardId"
              v-model="form.cardId"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="" disabled>Selecione...</option>
              <option v-for="card in cards" :key="card.id" :value="card.id">
                {{ card.name }}
              </option>
            </select>
            <p v-if="errors.cardId" class="text-sm text-destructive">{{ errors.cardId }}</p>
          </div>

          <button 
            type="submit" 
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
          >
            Adicionar Legado
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
