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
import CategoryAutocomplete from '@/components/ui/CategoryAutocomplete.vue'
import { useProactiveAdvisor } from '@/composables/useProactiveAdvisor'

// Proactive Advisor for post_transaction trigger
const advisor = useProactiveAdvisor()

const props = defineProps<{
  open: boolean
  transactionId?: string | null
}>()

const emit = defineEmits(['update:open', 'saved'])

// Form State
const amount = ref(0)
const description = ref('')
const installments = ref([1])
const selectedCategoryId = ref<string>('')
const selectedCardId = ref<string>('')
const paymentType = ref<'cash' | 'installment' | 'subscription'>('cash')
const purchaseDate = ref(new Date().toISOString().split('T')[0]) // YYYY-MM-DD format

// Data Fetching
interface Card {
  id: string
  name: string
  isDefault: boolean
}

interface Category {
  id: string
  name: string
}

const { data: cards } = await useFetch<Card[]>('/api/cards')
const { data: categories, refresh: refreshCategories } = await useFetch<Category[]>('/api/categories') 

// Auto-select default card when cards load (only if NEW)
watch(cards, (newCards) => {
  if (newCards && newCards.length > 0 && !selectedCardId.value && !props.transactionId) {
    const defaultCard = newCards.find(c => c.isDefault)
    if (defaultCard) {
      selectedCardId.value = defaultCard.id
    } else {
      // If no default, select first card
      const firstCard = newCards[0]
      if (firstCard) selectedCardId.value = firstCard.id
    }
  }
}, { immediate: true })

// Edit Mode Logic
watch(() => props.open, async (isOpen) => {
    if (isOpen && props.transactionId) {
        try {
            const tx = await $fetch<any>(`/api/transactions/${props.transactionId}`)
            amount.value = tx.amount
            description.value = tx.description
            selectedCardId.value = tx.cardId
            selectedCategoryId.value = tx.categoryId
            purchaseDate.value = tx.purchaseDate.split('T')[0]
            installments.value = [tx.installmentsCount]
            paymentType.value = tx.isSubscription ? 'subscription' : (tx.installmentsCount > 1 ? 'installment' : 'cash')
        } catch (e) {
            toast.error('Erro ao carregar despesa')
            emit('update:open', false)
        }
    } else if (isOpen && !props.transactionId) {
        // Reset for new entry
        amount.value = 0
        description.value = ''
        installments.value = [1]
        paymentType.value = 'cash'
        purchaseDate.value = new Date().toISOString().split('T')[0]
        if (cards.value && cards.value.length) {
             const defaultCard = cards.value.find(c => c.isDefault) || cards.value[0]
             if (defaultCard) selectedCardId.value = defaultCard.id
        }
    }
})

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
    installmentsCount: installments.value[0] ?? 1,
    cardId: selectedCardId.value,
    categoryId: selectedCategoryId.value || undefined, 
    purchaseDate: purchaseDate.value ? new Date(purchaseDate.value + 'T12:00:00Z').toISOString() : new Date().toISOString(),
    isSubscription: paymentType.value === 'subscription'
  }

  // 2. OPTIMISTIC UPDATE SETUP
  // Access the dashboard cache
  interface Transaction {
    id: string
    description: string
    amount: number
    category: string
    categoryIcon: string
    installmentNumber: number
    totalInstallments: number
    cardName: string
    purchaseDate: string
    isOptimistic?: boolean
  }

  interface SummaryResponse {
    total: number
    limit: number
    available: number
    transactions: Record<string, Transaction[]>
  }

  const { data: summaryCache } = useNuxtData<SummaryResponse>('dashboard-summary')
  let previousData: SummaryResponse | null = null

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
    
    if (pDateKey) {
      // Create a "Optimistic Transaction" object
      const optimisticTx: Transaction = {
         id: 'temp-' + Date.now(),
         description: payload.description,
         amount: payload.amount,
         category: 'Processando...',
         categoryIcon: 'clock',
         installmentNumber: 1,
         totalInstallments: payload.installmentsCount,
         cardName: '',
         purchaseDate: payload.purchaseDate,
         isOptimistic: true
      }

      if (!summaryCache.value.transactions[pDateKey]) {
          summaryCache.value.transactions[pDateKey] = []
      }
      // Add to beginning of list
      summaryCache.value.transactions[pDateKey].unshift(optimisticTx)
    }
  }

  // Close UI immediately for "Native Feel"
  
  // Reset Form
  amount.value = 0
  description.value = ''
  installments.value = [1]
  paymentType.value = 'cash'
  purchaseDate.value = new Date().toISOString().split('T')[0]
  isOpen.value = false

  try {
    // 4. API Call
    if (props.transactionId) {
        await $fetch(`/api/transactions/${props.transactionId}`, {
            method: 'PUT',
            body: payload
        })
        toast.success('Despesa atualizada!')
    } else {
        await $fetch('/api/transactions', {
            method: 'POST',
            body: payload
        })
        toast.success('Despesa salva com sucesso!')

        // Trigger proactive advisor for significant transactions (>=R$100)
        if (payload.amount >= 100) {
          const categoryName = categories.value?.find(c => c.id === payload.categoryId)?.name || 'Outros'
          advisor.trigger('post_transaction', {
            cardId: payload.cardId,
            transactionData: {
              amount: payload.amount,
              description: payload.description,
              categoryName
            }
          })
        }
    }

    emit('saved')
    
    // 5. Revalidation (Background)
    // Refresh to get the real ID, real category name, real calculations
    await refreshNuxtData('dashboard-summary')
    await refreshNuxtData('dashboard-summary')
    // toast handled above

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
function togglePaymentType(type: 'cash' | 'installment' | 'subscription') {
  paymentType.value = type
  if (type === 'cash' || type === 'subscription') {
    installments.value = [1]
  }
}

async function handleDelete() {
    if (!props.transactionId) return
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return

    try {
        await $fetch(`/api/transactions/${props.transactionId}`, {
            method: 'DELETE'
        })
        toast.success('Despesa excluída')
        isOpen.value = false
        emit('saved')
        await refreshNuxtData('dashboard-summary')
    } catch (e) {
        toast.error('Erro ao excluir')
    }
}

</script>

<template>
  <Drawer v-model:open="isOpen">
    <DrawerContent>
      <div class="mx-auto w-full max-w-sm">
        <DrawerHeader>
          <DrawerTitle class="text-center">{{ transactionId ? 'Editar Despesa' : 'Nova Despesa' }}</DrawerTitle>
        </DrawerHeader>

        <div class="p-4 space-y-6">
          
          <!-- Amount -->
          <div class="text-center">
             <Label for="drawer-amount" class="sr-only">Valor</Label>
             <CurrencyInput id="drawer-amount" v-model="amount" class="text-center text-4xl h-16 border-none focus-visible:ring-0 shadow-none font-bold" placeholder="R$ 0,00" />
          </div>

          <!-- Description -->
          <div>
            <Label for="drawer-description" class="sr-only">Descrição</Label>
            <Input id="drawer-description" name="transaction-description" autocomplete="off" v-model="description" placeholder="Descrição (ex: Almoço)…" />
          </div>

          <!-- Date -->
          <div>
            <Label for="drawer-date" class="text-sm text-muted-foreground">Data da Compra</Label>
            <Input
              id="drawer-date"
              name="transaction-date"
              v-model="purchaseDate"
              type="date"
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

            <CategoryAutocomplete 
                v-model="selectedCategoryId" 
                :categories="categories || []" 
                @refresh="refreshCategories"
            />
          </div>

          <!-- Payment Type Toggle -->
          <div class="space-y-3">
            <Label>Tipo de Pagamento</Label>
            <div class="grid grid-cols-3 gap-2">
              <Button 
                type="button"
                :variant="paymentType === 'cash' ? 'default' : 'outline'"
                class="w-full text-xs px-1"
                @click="togglePaymentType('cash')"
              >
                À Vista
              </Button>
              <Button 
                type="button"
                :variant="paymentType === 'installment' ? 'default' : 'outline'"
                class="w-full text-xs px-1"
                @click="togglePaymentType('installment')"
              >
                Parcelado
              </Button>
              <Button 
                type="button"
                :variant="paymentType === 'subscription' ? 'default' : 'outline'"
                class="w-full text-xs px-1"
                @click="togglePaymentType('subscription')"
              >
                Assinatura
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
                <button type="button" @click="setInstallments(1)" aria-label="Definir 1 parcela">1x</button>
                <button type="button" @click="setInstallments(3)" aria-label="Definir 3 parcelas">3x</button>
                <button type="button" @click="setInstallments(6)" aria-label="Definir 6 parcelas">6x</button>
                <button type="button" @click="setInstallments(10)" aria-label="Definir 10 parcelas">10x</button>
                <button type="button" @click="setInstallments(12)" aria-label="Definir 12 parcelas">12x</button>
            </div>
          </div>
          
        </div>

        <DrawerFooter>
          <Button size="lg" class="w-full text-lg h-12" @click="save">
            {{ transactionId ? 'Salvar Alterações' : `Confirmar R$ ${amount.toFixed(2)}` }}
          </Button>
          
          <Button v-if="transactionId" variant="destructive" class="w-full" @click="handleDelete">
            Excluir Despesa
          </Button>
          
          <DrawerClose as-child>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>
