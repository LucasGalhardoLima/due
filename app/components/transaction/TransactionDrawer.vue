<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open', 'saved'])

// Form State
const amount = ref(0)
const description = ref('')
const installments = ref([1])
const selectedCategoryId = ref<string>('')
const selectedCardId = ref<string>('')

// Data Fetching
const { data: cards } = await useFetch<any[]>('/api/cards')
const { data: categories } = await useFetch<any[]>('/api/categories') 

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

async function save() {
  if (amount.value <= 0 || !selectedCardId.value || !description.value) return

  try {
    await $fetch('/api/transactions', {
      method: 'POST',
      body: {
        amount: amount.value,
        description: description.value,
        installmentsCount: installments.value[0],
        cardId: selectedCardId.value,
        categoryId: selectedCategoryId.value || undefined, // Backend handles default
        purchaseDate: new Date().toISOString()
      }
    })
    
    // Reset & Close
    amount.value = 0
    description.value = ''
    installments.value = [1]
    isOpen.value = false
    emit('saved')
  } catch (e) {
    console.error(e)
    alert('Erro ao salvar')
  }
}

// Quick presets for installments (Optional, but "Slider ou botões rápidos")
function setInstallments(n: number) {
    installments.value = [n]
}

</script>

<template>
  <Drawer v-model:open="isOpen">
    <DrawerContent>
      <div class="mx-auto w-full max-w-sm">
        <DrawerHeader>
          <DrawerTitle class="text-center">Nova Despesa</DrawerTitle>
        </DrawerHeader>

        <div class="p-4 space-y-6">
          
          <!-- Amount -->
          <div class="text-center">
             <Label class="sr-only">Valor</Label>
             <CurrencyInput v-model="amount" class="text-center text-4xl h-16 border-none focus-visible:ring-0 shadow-none font-bold" placeholder="R$ 0,00" />
          </div>

          <!-- Description -->
          <div>
            <Input v-model="description" placeholder="Descrição (ex: Almoço)" />
          </div>

          <!-- Card & Category -->
          <div class="grid grid-cols-2 gap-2">
            <Select v-model="selectedCardId">
                <SelectTrigger>
                    <SelectValue placeholder="Cartão" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="card in cards" :key="card.id" :value="card.id">
                        {{ card.name }}
                    </SelectItem>
                </SelectContent>
            </Select>

             <Select v-model="selectedCategoryId">
                <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="cat in (categories || [])" :key="cat.id" :value="cat.id">
                        {{ cat.name }}
                    </SelectItem>
                    <!-- Fallback if empty -->
                    <SelectItem value="new">Outros</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <!-- Installments -->
          <div class="space-y-4">
            <div class="flex justify-between items-center">
                <Label>Parcelas</Label>
                <span class="font-bold text-lg">{{ installments[0] }}x</span>
            </div>
            <Slider
                v-model="installments"
                :max="12"
                :min="1"
                :step="1"
            />
            <div class="flex justify-between text-xs text-muted-foreground">
                <button @click="setInstallments(1)">1x</button>
                <button @click="setInstallments(3)">3x</button>
                <button @click="setInstallments(6)">6x</button>
                <button @click="setInstallments(10)">10x</button>
                <button @click="setInstallments(12)">12x</button>
            </div>
          </div>
          
        </div>

        <DrawerFooter>
          <Button @click="save" size="lg" class="w-full text-lg h-12">
            Confirmar R$ {{ amount.toFixed(2) }}
          </Button>
          <DrawerClose as-child>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>
