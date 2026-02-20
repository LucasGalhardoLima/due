<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { toast } from 'vue-sonner'
import {
  Sparkles,
  CreditCard,
  ArrowRight,
  Upload,
  PlusCircle,
  Check,
  Loader2,
  LayoutDashboard,
  PieChart,
  Target,
  Activity,
  Rocket,
  Compass,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: false,
  middleware: [],
})

const router = useRouter()

// Two-phase state
const phase = ref<'wizard' | 'tour'>('wizard')
const wizardStep = ref(1)
const tourSlide = ref(1)
const isLoading = ref(false)

const totalWizardSteps = 5
const totalTourSlides = 5

// Transition key
const transitionKey = computed(() => `${phase.value}-${phase.value === 'wizard' ? wizardStep.value : tourSlide.value}`)

// Form state for card
const cardForm = reactive({
  name: '',
  limit: 0,
  closingDay: 25,
  dueDay: 1,
})

// Income form
const incomeForm = reactive({
  description: 'Salário',
  amount: 0,
})

// Seeded categories for display
const seededCategories = ref<Array<{ name: string; emoji: string; color: string }>>([])

// Validation
const isCardFormValid = computed(() => {
  return cardForm.name.trim().length > 0 && cardForm.limit > 0
})

const isIncomeFormValid = computed(() => {
  return incomeForm.description.trim().length > 0 && incomeForm.amount > 0
})

// Tour slides data
const tourSlides = [
  {
    icon: LayoutDashboard,
    title: 'Seu painel financeiro',
    description: 'Acompanhe gastos, veja quanto pode gastar\ne receba insights do Du.',
  },
  {
    icon: PieChart,
    title: 'Controle total do orçamento',
    description: 'Limites por categoria, renda mensal\ne ritmo de gastos na palma da mão.',
  },
  {
    icon: Target,
    title: 'Suas metas de economia',
    description: 'Crie metas de poupança e acompanhe\no progresso até conquistar.',
  },
  {
    icon: Activity,
    title: 'Recorrências e fluxo de caixa',
    description: 'Detecção automática de assinaturas\ne gráficos de fluxo mensal.',
  },
  {
    icon: Rocket,
    title: 'Tudo pronto!',
    description: 'Você já pode começar a usar o Du.\nBora organizar suas finanças!',
  },
]

// Touch swipe support for tour
let touchStartX = 0

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0].clientX
}

function handleTouchEnd(e: TouchEvent) {
  const diff = touchStartX - e.changedTouches[0].clientX
  if (Math.abs(diff) > 50) {
    if (diff > 0 && tourSlide.value < totalTourSlides) {
      tourSlide.value++
    } else if (diff < 0 && tourSlide.value > 1) {
      tourSlide.value--
    }
  }
}

// Step 1: Welcome - Choose data mode
async function handleDataChoice(choice: 'sample' | 'fresh') {
  if (choice === 'sample') {
    isLoading.value = true
    try {
      await $fetch('/api/onboarding/seed-sample', { method: 'POST' })
      toast.success('Dados de exemplo criados!')
      setOnboardingCookie()
      phase.value = 'tour'
    } catch (e) {
      console.error(e)
      toast.error('Erro ao criar dados de exemplo.')
    } finally {
      isLoading.value = false
    }
  } else {
    wizardStep.value = 2
  }
}

// Step 2: Add first card
async function handleAddCard() {
  if (!isCardFormValid.value) {
    toast.error('Preencha os campos obrigatórios.')
    return
  }

  isLoading.value = true
  try {
    await $fetch('/api/cards', {
      method: 'POST',
      body: {
        name: cardForm.name,
        limit: cardForm.limit,
        closingDay: cardForm.closingDay,
        dueDay: cardForm.dueDay,
        isDefault: true,
      },
    })
    toast.success('Cartão adicionado!')
    wizardStep.value = 3
  } catch (e) {
    console.error(e)
    toast.error('Erro ao adicionar cartão.')
  } finally {
    isLoading.value = false
  }
}

// Step 3: Seed categories (auto)
async function seedCategories() {
  isLoading.value = true
  try {
    const res = await $fetch<{ categories: Array<{ name: string; emoji: string; color: string }> }>(
      '/api/onboarding/seed-categories',
      { method: 'POST' }
    )
    seededCategories.value = res.categories
  } catch (e) {
    console.error(e)
    toast.error('Erro ao criar categorias.')
  } finally {
    isLoading.value = false
  }
}

// Auto-seed when reaching step 3
watch(wizardStep, (step) => {
  if (step === 3 && seededCategories.value.length === 0) {
    seedCategories()
  }
})

// Step 4: Add income
async function handleAddIncome() {
  if (!isIncomeFormValid.value) {
    toast.error('Preencha os campos obrigatórios.')
    return
  }

  const now = new Date()
  isLoading.value = true
  try {
    await $fetch('/api/income', {
      method: 'POST',
      body: {
        description: incomeForm.description,
        amount: incomeForm.amount,
        isRecurring: true,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    })
    toast.success('Renda registrada!')
    wizardStep.value = 5
  } catch (e) {
    console.error(e)
    toast.error('Erro ao registrar renda.')
  } finally {
    isLoading.value = false
  }
}

// Step 5: Data entry choice
function handleEntryChoice(choice: 'import' | 'manual' | 'explore') {
  setOnboardingCookie()

  if (choice === 'import') {
    phase.value = 'tour'
  } else if (choice === 'manual') {
    phase.value = 'tour'
  } else {
    phase.value = 'tour'
  }
}

// Tour navigation
function nextTourSlide() {
  if (tourSlide.value < totalTourSlides) {
    tourSlide.value++
  }
}

function finishTour() {
  router.push('/dashboard')
}

function skipTour() {
  router.push('/dashboard')
}

// Cookie
function setOnboardingCookie() {
  const cookie = useCookie('onboarding_complete', { maxAge: 60 * 60 * 24 * 365, path: '/' })
  cookie.value = 'true'
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center p-6">
    <!-- Progress indicator -->
    <div class="fixed top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
      <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        {{ phase === 'wizard' ? 'Configuração' : 'Conheça o Due' }}
      </span>
      <div class="flex items-center gap-2">
        <div
          v-for="dot in (phase === 'wizard' ? totalWizardSteps : totalTourSlides)"
          :key="`${phase}-${dot}`"
          class="h-2 rounded-full transition-all duration-300"
          :class="dot <= (phase === 'wizard' ? wizardStep : tourSlide) ? 'bg-primary w-6' : 'bg-muted w-2'"
        />
      </div>
    </div>

    <div class="w-full max-w-md space-y-8">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-2">
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black text-sm shadow-elevation-2">
          Du
        </div>
        <span class="text-2xl font-black tracking-tight">Du</span>
      </div>

      <!-- Single Transition with dynamic key -->
      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <!-- ============ WIZARD PHASE ============ -->

        <!-- Step 1: Welcome -->
        <div v-if="phase === 'wizard' && wizardStep === 1" :key="transitionKey" class="space-y-6 text-center">
          <div>
            <h1 class="text-3xl font-black tracking-tight mb-2">E aí! Eu sou o Du 👋</h1>
            <p class="text-muted-foreground">Como você quer começar nossa jornada?</p>
          </div>

          <div class="space-y-3">
            <Button
              variant="outline"
              size="lg"
              :disabled="isLoading"
              class="w-full h-auto p-5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left flex items-start gap-4 group justify-start"
              @click="handleDataChoice('sample')"
            >
              <div class="w-12 h-12 rounded-lg bg-ai-accent/10 flex items-center justify-center shrink-0">
                <Sparkles class="w-6 h-6 text-ai-accent" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold mb-1 group-hover:text-primary-accent transition-colors">Me mostra como funciona</h3>
                <p class="text-xs text-muted-foreground whitespace-normal">Vou te mostrar com dados de exemplo, sem compromisso.</p>
              </div>
              <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin ml-auto shrink-0" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              :disabled="isLoading"
              class="w-full h-auto p-5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left flex items-start gap-4 group justify-start"
              @click="handleDataChoice('fresh')"
            >
              <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard class="w-6 h-6 text-primary-accent" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold mb-1 group-hover:text-primary-accent transition-colors">Bora começar do zero!</h3>
                <p class="text-xs text-muted-foreground whitespace-normal">Me conta seus cartões e eu cuido do resto.</p>
              </div>
            </Button>
          </div>
        </div>

        <!-- Step 2: Add Card -->
        <div v-else-if="phase === 'wizard' && wizardStep === 2" :key="transitionKey" class="space-y-6">
          <div class="text-center">
            <h1 class="text-2xl font-black tracking-tight mb-2">Me conta do seu cartão 💳</h1>
            <p class="text-muted-foreground">Preciso de algumas infos pra te ajudar melhor.</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleAddCard">
            <div class="space-y-2">
              <Label for="card-name">Nome do cartão</Label>
              <Input
                id="card-name"
                v-model="cardForm.name"
                type="text"
                placeholder="Ex: Nubank, Inter, C6..."
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="card-limit">Limite (R$)</Label>
              <Input
                id="card-limit"
                v-model.number="cardForm.limit"
                type="number"
                inputmode="numeric"
                placeholder="10000"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="closing-day">Dia do fechamento</Label>
                <Input
                  id="closing-day"
                  v-model.number="cardForm.closingDay"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  max="31"
                  required
                />
              </div>
              <div class="space-y-2">
                <Label for="due-day">Dia do vencimento</Label>
                <Input
                  id="due-day"
                  v-model.number="cardForm.dueDay"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  max="31"
                  required
                />
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                class="flex-1"
                @click="wizardStep = 3"
              >
                Pular
              </Button>
              <Button
                type="submit"
                class="flex-1"
                :disabled="!isCardFormValid || isLoading"
              >
                <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                Adicionar
                <ArrowRight v-if="!isLoading" class="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>

        <!-- Step 3: Categories (auto-created) -->
        <div v-else-if="phase === 'wizard' && wizardStep === 3" :key="transitionKey" class="space-y-6 text-center">
          <div>
            <h1 class="text-2xl font-black tracking-tight mb-2">Categorias prontas! 🏷️</h1>
            <p class="text-muted-foreground">Criamos categorias padrão pra você começar. Pode editá-las depois.</p>
          </div>

          <div v-if="isLoading" class="flex justify-center py-8">
            <Loader2 class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else class="grid grid-cols-2 gap-3">
            <div
              v-for="cat in seededCategories"
              :key="cat.name"
              class="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
            >
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                :style="{ backgroundColor: cat.color + '20' }"
              >
                {{ cat.emoji }}
              </div>
              <span class="text-sm font-semibold truncate">{{ cat.name }}</span>
            </div>
          </div>

          <Button class="w-full" :disabled="isLoading" @click="wizardStep = 4">
            Continuar
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </div>

        <!-- Step 4: Monthly Income -->
        <div v-else-if="phase === 'wizard' && wizardStep === 4" :key="transitionKey" class="space-y-6">
          <div class="text-center">
            <h1 class="text-2xl font-black tracking-tight mb-2">Qual sua renda mensal? 💰</h1>
            <p class="text-muted-foreground">Isso ajuda a calcular quanto você pode gastar por dia.</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleAddIncome">
            <div class="space-y-2">
              <Label for="income-desc">Descrição</Label>
              <Input
                id="income-desc"
                v-model="incomeForm.description"
                type="text"
                placeholder="Ex: Salário, Freelance..."
              />
            </div>

            <div class="space-y-2">
              <Label for="income-amount">Valor (R$)</Label>
              <Input
                id="income-amount"
                v-model.number="incomeForm.amount"
                type="number"
                inputmode="decimal"
                placeholder="5000"
                required
              />
            </div>

            <div class="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                class="flex-1"
                @click="wizardStep = 5"
              >
                Pular
              </Button>
              <Button
                type="submit"
                class="flex-1"
                :disabled="!isIncomeFormValid || isLoading"
              >
                <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                Salvar
                <ArrowRight v-if="!isLoading" class="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>

        <!-- Step 5: Data Entry Choice -->
        <div v-else-if="phase === 'wizard' && wizardStep === 5" :key="transitionKey" class="space-y-6 text-center">
          <div>
            <div class="w-16 h-16 mx-auto rounded-2xl bg-success-muted border border-success/20 flex items-center justify-center mb-4">
              <Check class="w-8 h-8 text-success" />
            </div>
            <h1 class="text-2xl font-black tracking-tight mb-2">Configuração concluída! 🎉</h1>
            <p class="text-muted-foreground">Agora, como você quer adicionar seus gastos?</p>
          </div>

          <div class="space-y-3">
            <Button
              variant="outline"
              size="lg"
              class="w-full h-auto p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left flex items-center gap-4 group justify-start"
              @click="handleEntryChoice('import')"
            >
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Upload class="w-5 h-5 text-primary-accent" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold group-hover:text-primary-accent transition-colors">Importar do banco</h3>
                <p class="text-xs text-muted-foreground">Me manda o CSV que eu organizo tudo!</p>
              </div>
              <ArrowRight class="w-4 h-4 text-muted-foreground group-hover:text-primary-accent transition-colors" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              class="w-full h-auto p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left flex items-center gap-4 group justify-start"
              @click="handleEntryChoice('manual')"
            >
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <PlusCircle class="w-5 h-5 text-primary-accent" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold group-hover:text-primary-accent transition-colors">Digitar na mão</h3>
                <p class="text-xs text-muted-foreground">Sem pressa, você adiciona um por um.</p>
              </div>
              <ArrowRight class="w-4 h-4 text-muted-foreground group-hover:text-primary-accent transition-colors" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              class="w-full text-muted-foreground hover:text-foreground transition-colors h-10"
              @click="handleEntryChoice('explore')"
            >
              <Compass class="w-4 h-4 mr-2" />
              Deixa pra depois, quero explorar!
            </Button>
          </div>
        </div>

        <!-- ============ TOUR PHASE ============ -->

        <div
          v-else-if="phase === 'tour'"
          :key="transitionKey"
          class="space-y-8 text-center"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
        >
          <div class="flex flex-col items-center gap-6">
            <div class="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <component :is="tourSlides[tourSlide - 1].icon" class="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 class="text-2xl font-black tracking-tight mb-3">{{ tourSlides[tourSlide - 1].title }}</h1>
              <p class="text-muted-foreground whitespace-pre-line leading-relaxed">{{ tourSlides[tourSlide - 1].description }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <Button
              v-if="tourSlide < totalTourSlides"
              class="w-full"
              @click="nextTourSlide"
            >
              Próximo
              <ArrowRight class="w-4 h-4 ml-2" />
            </Button>
            <Button
              v-else
              class="w-full"
              @click="finishTour"
            >
              <Rocket class="w-4 h-4 mr-2" />
              Ir para o Dashboard
            </Button>
            <Button
              v-if="tourSlide < totalTourSlides"
              variant="ghost"
              size="sm"
              class="w-full text-muted-foreground hover:text-foreground"
              @click="skipTour"
            >
              Pular tour
            </Button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
