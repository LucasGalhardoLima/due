<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { toast } from 'vue-sonner'
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
import { format } from 'date-fns'

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
const paymentType = ref<'cash' | 'installment'>('cash')
const purchaseDate = ref(new Date().toISOString().split('T')[0]) // YYYY-MM-DD format

// Data Fetching
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

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

async function save() {
  if (amount.value <= 0 || !selectedCardId.value || !description.value) return

  // 1. Prepare Payload
  const payload = {
    amount: amount.value,
    description: description.value,
    installmentsCount: installments.value[0],
    cardId: selectedCardId.value,
    categoryId: selectedCategoryId.value || undefined, 
    purchaseDate: new Date(purchaseDate.value).toISOString()
  }

  // 2. OPTIMISTIC UPDATE SETUP
  // Access the dashboard cache
  const { data: summaryCache } = useNuxtData('dashboard-summary')
  let previousData = null

  // 3. Apply Optimistic Changes
  if (summaryCache.value) {
    // Snapshot for rollback
    previousData = JSON.parse(JSON.stringify(summaryCache.value))

    // Mutate KPIs
    summaryCache.value.total += payload.amount
    summaryCache.value.available -= payload.amount
    
    // Mutate List (Add temporary item)
    // We try to find the date key. If not found, we create it.
    // Note: purchaseDate is in YYYY-MM-DD format from the input
    const pDateKey = purchaseDate.value
    
    // Create a "Optimistic Transaction" object
    const optimisticTx = {
       id: 'temp-' + Date.now(),
       description: payload.description,
       amount: payload.amount,
       category: 'Processando...', // We don't have the category name resolved yet easily
       categoryIcon: 'clock',
       installmentNumber: 1,
       totalInstallments: payload.installmentsCount,
       cardName: '', // Could resolve from props, but keep simple
       purchaseDate: payload.purchaseDate,
       isOptimistic: true // Flag for UI to show spinner or opacity
    }

    if (!summaryCache.value.transactions[pDateKey]) {
        summaryCache.value.transactions[pDateKey] = []
    }
    // Add to beginning of list
    summaryCache.value.transactions[pDateKey].unshift(optimisticTx)
  }

  // Close UI immediately for "Native Feel"
  const currentAmount = amount.value // save for reset
  
  // Reset Form
  amount.value = 0
  description.value = ''
  installments.value = [1]
  paymentType.value = 'cash'
  purchaseDate.value = new Date().toISOString().split('T')[0]
  isOpen.value = false

  try {
    // 4. API Call
    await $fetch('/api/transactions', {
      method: 'POST',
      body: payload
    })
    
    emit('saved')
    
    // 5. Revalidation (Background)
    // Refresh to get the real ID, real category name, real calculations
    await refreshNuxtData('dashboard-summary')
    toast.success('Despesa salva com sucesso!')

  } catch (e) {
    console.error(e)
    toast.error('Erro ao salvar despesa. Revertendo...')

    // 6. Rollback on Error
    if (summaryCache.value && previousData) {
        summaryCache.value = previousData // Restore snapshot
    }
    // Re-open drawer or handle error UI
  }
}

// Quick presets for installments (Optional, but "Slider ou botões rápidos")
function setInstallments(n: number) {
    installments.value = [n]
}

// Toggle payment type
function togglePaymentType(type: 'cash' | 'installment') {
  paymentType.value = type
  if (type === 'cash') {
    installments.value = [1]
  }
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

          <!-- Date -->
          <div>
            <Label class="text-sm text-muted-foreground">Data da Compra</Label>
            <Input 
              type="date" 
              v-model="purchaseDate" 
              :max="new Date().toISOString().split('T')[0]"
              class="mt-1"
            />
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

          <!-- Payment Type Toggle -->
          <div class="space-y-3">
            <Label>Tipo de Pagamento</Label>
            <div class="grid grid-cols-2 gap-2">
              <Button 
                type="button"
                :variant="paymentType === 'cash' ? 'default' : 'outline'"
                @click="togglePaymentType('cash')"
                class="w-full"
              >
                À Vista
              </Button>
              <Button 
                type="button"
                :variant="paymentType === 'installment' ? 'default' : 'outline'"
                @click="togglePaymentType('installment')"
                class="w-full"
              >
                Parcelado
              </Button>
            </div>
          </div>

          <!-- Installments (only if parcelado) -->
          <div v-if="paymentType === 'installment'" class="space-y-4">
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
