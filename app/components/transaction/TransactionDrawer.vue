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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, PlusCircle, X, Tag } from 'lucide-vue-next'
import { useProactiveAdvisor } from '@/composables/useProactiveAdvisor'

interface TransactionResponse {
  amount: number
  description: string
  cardId: string
  categoryId: string
  purchaseDate: string
  installmentsCount: number
  isSubscription: boolean
  tags?: Array<{ tag: TagItem }>
}

interface TagItem {
  id: string
  name: string
  color: string | null
  emoji: string | null
}

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
const selectedTagIds = ref<string[]>([])
const newTagName = ref('')
const isCreatingTag = ref(false)
const showTagPicker = ref(false)

// AI Mode State
const isAiMode = ref(false)
const aiText = ref('')
const isAnalyzing = ref(false)
const aiParseError = ref('')

interface AiParsedResult {
  amount: number
  description: string
  date: string
  installments: number
  cardId?: string
  categoryId?: string
  cardName?: string
  categoryName?: string
}

const aiParsedResult = ref<AiParsedResult | null>(null)

async function analyzeText() {
  if (!aiText.value.trim()) return

  isAnalyzing.value = true
  aiParseError.value = ''
  aiParsedResult.value = null
  try {
    const res = await $fetch<AiParsedResult>('/api/ai/parse-expense', {
      method: 'POST',
      body: {
        text: aiText.value,
        currentDate: new Date().toISOString()
      }
    })

    // Find display names for card and category
    const cardName = cards.value?.find(c => c.id === res.cardId)?.name
    const categoryName = categories.value?.find(c => c.id === res.categoryId)?.name

    // Store parsed result for inline display
    aiParsedResult.value = {
      ...res,
      cardName: cardName || undefined,
      categoryName: categoryName || undefined,
    }

    // Also populate form fields for potential manual editing
    amount.value = res.amount
    description.value = res.description
    purchaseDate.value = res.date
    installments.value = [res.installments]
    if (res.cardId && res.cardId !== 'null') selectedCardId.value = res.cardId
    if (res.categoryId && res.categoryId !== 'null') selectedCategoryId.value = res.categoryId
    paymentType.value = res.installments > 1 ? 'installment' : 'cash'
  } catch (e) {
    console.error(e)
    aiParseError.value = 'Não entendi. Tente ser mais específico.'
  } finally {
    isAnalyzing.value = false
  }
}

function switchToManualFromAi() {
  // Form fields are already populated from the AI parse
  isAiMode.value = false
  aiParsedResult.value = null
}

async function submitAiParsed() {
  if (!aiParsedResult.value) return
  // Fields are already populated, just call save
  await save()
  aiParsedResult.value = null
}

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
const { data: tags, refresh: refreshTags } = await useFetch<TagItem[]>('/api/tags')

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
            const tx = await $fetch<TransactionResponse>(`/api/transactions/${props.transactionId}`)
            amount.value = tx.amount
            description.value = tx.description
            selectedCardId.value = tx.cardId
            selectedCategoryId.value = tx.categoryId
            purchaseDate.value = tx.purchaseDate.split('T')[0]
            installments.value = [tx.installmentsCount]
            paymentType.value = tx.isSubscription ? 'subscription' : (tx.installmentsCount > 1 ? 'installment' : 'cash')
            selectedTagIds.value = tx.tags?.map(t => t.tag.id) || []
        } catch {
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
        selectedTagIds.value = []
        if (cards.value && cards.value.length) {
             const defaultCard = cards.value.find(c => c.isDefault) || cards.value[0]
             if (defaultCard) selectedCardId.value = defaultCard.id
        }
    }
    
    // Reset AI Mode and tag picker when opening
    if (isOpen) {
        isAiMode.value = false
        aiText.value = ''
        aiParsedResult.value = null
        aiParseError.value = ''
        newTagName.value = ''
        showTagPicker.value = false
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
  const savedTagIds = [...selectedTagIds.value]
  amount.value = 0
  description.value = ''
  installments.value = [1]
  paymentType.value = 'cash'
  purchaseDate.value = new Date().toISOString().split('T')[0]
  selectedTagIds.value = []
  isOpen.value = false

  try {
    // 4. API Call
    let savedTransactionId = props.transactionId
    if (props.transactionId) {
        await $fetch(`/api/transactions/${props.transactionId}`, {
            method: 'PUT',
            body: payload
        })
        toast.success('Despesa atualizada!')
    } else {
        const created = await $fetch<{ id: string }>('/api/transactions', {
            method: 'POST',
            body: payload
        })
        savedTransactionId = created.id
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

    // 4b. Save tags if any were selected
    if (savedTransactionId && savedTagIds.length > 0) {
        await $fetch('/api/tags/transaction', {
            method: 'POST',
            body: {
              transactionId: savedTransactionId,
              tagIds: savedTagIds,
            }
        })
    } else if (savedTransactionId && savedTagIds.length === 0 && props.transactionId) {
        // Clear tags if editing and all tags were removed
        await $fetch('/api/tags/transaction', {
            method: 'POST',
            body: {
              transactionId: savedTransactionId,
              tagIds: [],
            }
        })
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

// Tag helpers
function toggleTag(tagId: string) {
  const idx = selectedTagIds.value.indexOf(tagId)
  if (idx === -1) {
    selectedTagIds.value.push(tagId)
  } else {
    selectedTagIds.value.splice(idx, 1)
  }
}

function isTagSelected(tagId: string) {
  return selectedTagIds.value.includes(tagId)
}

async function createTag() {
  const name = newTagName.value.trim()
  if (!name) return
  isCreatingTag.value = true
  try {
    const tag = await $fetch<TagItem>('/api/tags', {
      method: 'POST',
      body: { name },
    })
    await refreshTags()
    selectedTagIds.value.push(tag.id)
    newTagName.value = ''
  } catch {
    toast.error('Erro ao criar tag')
  } finally {
    isCreatingTag.value = false
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
    } catch {
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
          <!-- Card Selector (always visible) -->
          <div v-if="cards && cards.length > 1" class="space-y-1">
            <Label class="text-xs text-muted-foreground">Cartão</Label>
            <Select v-model="selectedCardId">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cartão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="card in cards" :key="card.id" :value="card.id">
                  {{ card.name }}
                  <span v-if="card.isDefault" class="text-muted-foreground text-[10px] ml-1">(padrão)</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Toggle Mode -->
          <div v-if="!transactionId" class="bg-muted/30 p-1 rounded-xl flex gap-1">
             <button
               class="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all"
               :class="!isAiMode ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'"
               @click="isAiMode = false; aiParsedResult = null"
             >
               <PlusCircle class="w-3 h-3" />
               Manual
             </button>
             <button
               class="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all"
               :class="isAiMode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/50'"
               @click="isAiMode = true"
             >
               <Sparkles class="w-3 h-3" />
               Mágica (IA)
             </button>
          </div>

          <!-- AI Input -->
          <div v-if="isAiMode" class="space-y-4 animate-in fade-in zoom-in-95 duration-200">
             <div class="space-y-2">
                <Textarea
                  v-model="aiText"
                  placeholder="Ex: Uber de 25 reais ontem..."
                  class="min-h-[100px] text-base resize-none"
                  @keydown.enter.prevent="analyzeText"
                />
                <p class="text-[10px] text-muted-foreground text-center">Pressione Enter para processar</p>
             </div>

             <!-- AI Parse Error -->
             <p v-if="aiParseError" class="text-xs text-destructive text-center">
               {{ aiParseError }}
             </p>

             <!-- AI Parsed Results (inline summary) -->
             <div v-if="aiParsedResult" class="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
               <div class="rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-2">
                 <div class="flex items-center justify-between">
                   <span class="text-xs text-muted-foreground">Descrição</span>
                   <span class="text-sm font-medium">{{ aiParsedResult.description }}</span>
                 </div>
                 <div class="flex items-center justify-between">
                   <span class="text-xs text-muted-foreground">Valor</span>
                   <span class="text-sm font-bold text-primary">R$ {{ aiParsedResult.amount.toFixed(2) }}</span>
                 </div>
                 <div v-if="aiParsedResult.cardName" class="flex items-center justify-between">
                   <span class="text-xs text-muted-foreground">Cartão</span>
                   <span class="text-sm">{{ aiParsedResult.cardName }}</span>
                 </div>
                 <div v-if="aiParsedResult.categoryName" class="flex items-center justify-between">
                   <span class="text-xs text-muted-foreground">Categoria</span>
                   <span class="text-sm">{{ aiParsedResult.categoryName }}</span>
                 </div>
                 <div v-if="aiParsedResult.installments > 1" class="flex items-center justify-between">
                   <span class="text-xs text-muted-foreground">Parcelas</span>
                   <span class="text-sm">{{ aiParsedResult.installments }}x</span>
                 </div>
               </div>

               <Button class="w-full" @click="submitAiParsed">
                 Adicionar
               </Button>
               <button
                 class="w-full text-center text-xs text-primary hover:underline"
                 @click="switchToManualFromAi"
               >
                 Editar manualmente
               </button>
             </div>

             <!-- Process Button (only when no results yet) -->
             <Button
               v-if="!aiParsedResult"
               class="w-full"
               :disabled="!aiText || isAnalyzing"
               @click="analyzeText"
             >
               <Loader2 v-if="isAnalyzing" class="w-4 h-4 animate-spin mr-2" />
               <Sparkles v-else class="w-4 h-4 mr-2" />
               {{ isAnalyzing ? 'Processando...' : 'Processar' }}
             </Button>
          </div>

          <!-- Manual Form (Shown if NOT AI Mode OR if Editing) -->
          <div v-else class="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <!-- Amount -->
            <div class="text-center">
             <Label for="drawer-amount" class="sr-only">Valor</Label>
             <CurrencyInput id="drawer-amount" v-model="amount" class="text-center text-4xl h-16 border-none focus-visible:ring-0 shadow-none font-bold" placeholder="R$ 0,00" />
          </div>

          <!-- Description -->
          <div>
            <Label for="drawer-description" class="sr-only">Descrição</Label>
            <Input id="drawer-description" v-model="description" name="transaction-description" autocomplete="off" placeholder="Descrição (ex: Almoço)…" />
          </div>

          <!-- Date -->
          <div>
            <Label for="drawer-date" class="text-sm text-muted-foreground">Data da Compra</Label>
            <Input
              id="drawer-date"
              v-model="purchaseDate"
              name="transaction-date"
              type="date"
              :max="new Date().toISOString().split('T')[0]"
              class="mt-1"
            />
          </div>

          <!-- Category -->
          <div>
            <CategoryAutocomplete
                v-model="selectedCategoryId"
                :categories="categories || []"
                @refresh="refreshCategories"
            />
          </div>

          <!-- Tags -->
          <div class="space-y-2">
            <button
              type="button"
              class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              @click="showTagPicker = !showTagPicker"
            >
              <Tag class="w-3 h-3" />
              Tags
              <span v-if="selectedTagIds.length" class="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                {{ selectedTagIds.length }}
              </span>
            </button>

            <!-- Selected Tags Display -->
            <div v-if="selectedTagIds.length && !showTagPicker" class="flex flex-wrap gap-1.5">
              <Badge
                v-for="tagId in selectedTagIds"
                :key="tagId"
                variant="secondary"
                class="gap-1 pr-1 cursor-pointer"
                @click="toggleTag(tagId)"
              >
                <template v-if="tags?.find(t => t.id === tagId)">
                  <span v-if="tags.find(t => t.id === tagId)?.emoji" class="text-xs">{{ tags.find(t => t.id === tagId)?.emoji }}</span>
                  {{ tags.find(t => t.id === tagId)?.name }}
                </template>
                <X class="w-3 h-3 opacity-60" />
              </Badge>
            </div>

            <!-- Tag Picker -->
            <div v-if="showTagPicker" class="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3 animate-in fade-in slide-in-from-top-1 duration-150">
              <!-- Existing Tags -->
              <div v-if="tags && tags.length" class="flex flex-wrap gap-1.5">
                <button
                  v-for="tag in tags"
                  :key="tag.id"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
                  :class="isTagSelected(tag.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted text-foreground'"
                  @click="toggleTag(tag.id)"
                >
                  <span v-if="tag.emoji" class="text-xs">{{ tag.emoji }}</span>
                  {{ tag.name }}
                </button>
              </div>
              <p v-else class="text-xs text-muted-foreground">Sem tags ainda.</p>

              <!-- Create New Tag -->
              <div class="flex items-center gap-2 pt-1">
                <Input
                  v-model="newTagName"
                  placeholder="Nova tag..."
                  class="h-7 text-xs flex-1"
                  @keydown.enter.prevent="createTag"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="h-7 text-xs px-2"
                  :disabled="!newTagName.trim() || isCreatingTag"
                  @click="createTag"
                >
                  <Loader2 v-if="isCreatingTag" class="w-3 h-3 animate-spin" />
                  <PlusCircle v-else class="w-3 h-3" />
                </Button>
              </div>
            </div>
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
                <button type="button" aria-label="Definir 1 parcela" @click="setInstallments(1)">1x</button>
                <button type="button" aria-label="Definir 3 parcelas" @click="setInstallments(3)">3x</button>
                <button type="button" aria-label="Definir 6 parcelas" @click="setInstallments(6)">6x</button>
                <button type="button" aria-label="Definir 10 parcelas" @click="setInstallments(10)">10x</button>
                <button type="button" aria-label="Definir 12 parcelas" @click="setInstallments(12)">12x</button>
            </div>
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
