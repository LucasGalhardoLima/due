<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import { toast } from 'vue-sonner'

const amountPerInstallment = ref(0)
const remainingInstallments = ref(1)
const description = ref('')
const selectedCardId = ref<string>('')
const selectedCategoryId = ref<string>('')

const { data: cards } = await useFetch<any[]>('/api/cards')
const { data: categories } = await useFetch<any[]>('/api/categories')

// Auto-select default card when cards load
watch(cards, (newCards) => {
  if (newCards && newCards.length > 0 && !selectedCardId.value) {
    const defaultCard = newCards.find(c => c.isDefault)
    if (defaultCard) {
      selectedCardId.value = defaultCard.id
    } else {
      // If no default, select first card
      selectedCardId.value = newCards[0].id
    }
  }
}, { immediate: true })

async function save() {
  if (amountPerInstallment.value <= 0 || remainingInstallments.value < 1 || !selectedCardId.value) return

  try {
    await $fetch('/api/transactions/legacy', {
      method: 'POST',
      body: {
        amountPerInstallment: amountPerInstallment.value,
        remainingInstallments: remainingInstallments.value,
        description: description.value,
        cardId: selectedCardId.value,
        categoryId: selectedCategoryId.value || undefined
      }
    })
    
    // Reset
    amountPerInstallment.value = 0
    remainingInstallments.value = 1
    description.value = ''
    
    // Redirect to dashboard
    await navigateTo('/')
    toast.success('Dívida importada com sucesso!')
  } catch (e) {
    console.error(e)
    toast.error('Erro ao importar dívida')
  }
}
</script>

<template>
  <div class="space-y-6 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
    <h3 class="font-semibold leading-none tracking-tight">Importar Dívida Legada (Restante)</h3>
    <p class="text-sm text-muted-foreground">Lance parcelas que já começaram.</p>

    <div class="space-y-4">
        <div>
            <Label for="legacy-description">Descrição</Label>
            <Input id="legacy-description" name="legacy-description" autocomplete="off" v-model="description" placeholder="Ex: iPhone (Restante)…" />
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <Label for="legacy-amount">Valor da Parcela</Label>
                <CurrencyInput id="legacy-amount" v-model="amountPerInstallment" placeholder="R$ 0,00" />
            </div>
            <div>
                <Label for="legacy-installments">Parcelas Restantes</Label>
                <Input id="legacy-installments" name="legacy-installments" inputmode="numeric" v-model="remainingInstallments" type="number" min="1" />
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                 <Label id="legacy-card-label">Cartão</Label>
                 <Select v-model="selectedCardId" aria-labelledby="legacy-card-label">
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="card in cards" :key="card.id" :value="card.id">
                            {{ card.name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div>
                 <Label id="legacy-category-label">Categoria</Label>
                 <Select v-model="selectedCategoryId" aria-labelledby="legacy-category-label">
                    <SelectTrigger>
                        <SelectValue placeholder="Opcional…" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="cat in (categories || [])" :key="cat.id" :value="cat.id">
                            {{ cat.name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Button class="w-full" @click="save">
            Importar
        </Button>
    </div>
  </div>
</template>
