<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { toast } from 'vue-sonner'
import { Sparkles, CreditCard, ArrowRight, Upload, PlusCircle, Check, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

definePageMeta({
  layout: false,
  middleware: []
})

const router = useRouter()

// Step management
const currentStep = ref(1)
const totalSteps = 3
const isLoading = ref(false)

// Form state for card
const cardForm = reactive({
  name: '',
  limit: 0,
  closingDay: 25,
  dueDay: 1
})

// Choice tracking
const dataChoice = ref<'sample' | 'fresh' | null>(null)
const entryChoice = ref<'import' | 'manual' | 'later' | null>(null)

// Validation
const isCardFormValid = computed(() => {
  return cardForm.name.trim().length > 0 && cardForm.limit > 0
})

// Step 1: Welcome - Choose data mode
async function handleDataChoice(choice: 'sample' | 'fresh') {
  dataChoice.value = choice

  if (choice === 'sample') {
    isLoading.value = true
    try {
      await $fetch('/api/onboarding/seed-sample', { method: 'POST' })
      toast.success('Dados de exemplo criados!')
      completeOnboarding()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao criar dados de exemplo.')
      isLoading.value = false
    }
  } else {
    currentStep.value = 2
  }
}

// Step 2: Add first card
async function handleAddCard() {
  if (!isCardFormValid.value) {
    toast.error('Preencha os campos obrigatorios.')
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
        isDefault: true
      }
    })
    toast.success('Cartao adicionado!')
    currentStep.value = 3
  } catch (e) {
    console.error(e)
    toast.error('Erro ao adicionar cartao.')
  } finally {
    isLoading.value = false
  }
}

function skipCard() {
  currentStep.value = 3
}

// Step 3: First data entry choice
function handleEntryChoice(choice: 'import' | 'manual' | 'later') {
  entryChoice.value = choice

  if (choice === 'import') {
    completeOnboarding('/import')
  } else if (choice === 'manual') {
    completeOnboarding('/add-expense')
  } else {
    completeOnboarding()
  }
}

// Complete onboarding
function completeOnboarding(redirectTo = '/dashboard') {
  const cookie = useCookie('onboarding_complete', { maxAge: 60 * 60 * 24 * 365, path: '/' })
  cookie.value = 'true'
  router.push(redirectTo)
}
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center p-6">
    <!-- Progress indicator -->
    <div class="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
      <div
        v-for="step in totalSteps"
        :key="step"
        class="w-2 h-2 rounded-full transition-all"
        :class="step <= currentStep ? 'bg-primary w-6' : 'bg-muted'"
      />
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
        <!-- Step 1: Welcome -->
        <div v-if="currentStep === 1" key="step-1" class="space-y-6 text-center">
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
                <h3 class="font-bold mb-1 group-hover:text-primary transition-colors">Me mostra como funciona</h3>
                <p class="text-xs text-muted-foreground whitespace-normal">Vou te mostrar com dados de exemplo, sem compromisso.</p>
              </div>
              <Loader2 v-if="isLoading && dataChoice === 'sample'" class="w-5 h-5 animate-spin ml-auto shrink-0" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              :disabled="isLoading"
              class="w-full h-auto p-5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left flex items-start gap-4 group justify-start"
              @click="handleDataChoice('fresh')"
            >
              <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard class="w-6 h-6 text-primary" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold mb-1 group-hover:text-primary transition-colors">Bora começar do zero!</h3>
                <p class="text-xs text-muted-foreground whitespace-normal">Me conta seus cartões e eu cuido do resto.</p>
              </div>
            </Button>
          </div>
        </div>

        <!-- Step 2: Add Card -->
        <div v-else-if="currentStep === 2" key="step-2" class="space-y-6">
          <div class="text-center">
            <h1 class="text-2xl font-black tracking-tight mb-2">Me conta do seu cartão 💳</h1>
            <p class="text-muted-foreground">Preciso de algumas infos pra te ajudar melhor.</p>
          </div>

          <form class="space-y-4" @submit.prevent="handleAddCard">
            <div class="space-y-2">
              <label class="text-sm font-medium" for="card-name">Nome do cartao</label>
              <input
                id="card-name"
                v-model="cardForm.name"
                type="text"
                placeholder="Ex: Nubank, Inter, C6..."
                class="flex h-12 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm shadow-elevation-1 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                required
              >
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium" for="card-limit">Limite (R$)</label>
              <input
                id="card-limit"
                v-model.number="cardForm.limit"
                type="number"
                inputmode="numeric"
                placeholder="10000"
                class="flex h-12 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm shadow-elevation-1 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                required
              >
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium" for="closing-day">Dia do fechamento</label>
                <input
                  id="closing-day"
                  v-model.number="cardForm.closingDay"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  max="31"
                  class="flex h-12 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm shadow-elevation-1 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                  required
                >
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium" for="due-day">Dia do vencimento</label>
                <input
                  id="due-day"
                  v-model.number="cardForm.dueDay"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  max="31"
                  class="flex h-12 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm shadow-elevation-1 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                  required
                >
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                class="flex-1"
                @click="skipCard"
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

        <!-- Step 3: First Data Entry -->
        <div v-else-if="currentStep === 3" key="step-3" class="space-y-6 text-center">
          <div>
            <div class="w-16 h-16 mx-auto rounded-2xl bg-success-muted border border-success/20 flex items-center justify-center mb-4">
              <Check class="w-8 h-8 text-success" />
            </div>
            <h1 class="text-2xl font-black tracking-tight mb-2">Show, cartão salvo! 🎉</h1>
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
                <Upload class="w-5 h-5 text-primary" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold group-hover:text-primary transition-colors">Importar do banco</h3>
                <p class="text-xs text-muted-foreground">Me manda o CSV que eu organizo tudo!</p>
              </div>
              <ArrowRight class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              class="w-full h-auto p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left flex items-center gap-4 group justify-start"
              @click="handleEntryChoice('manual')"
            >
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <PlusCircle class="w-5 h-5 text-primary" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold group-hover:text-primary transition-colors">Digitar na mão</h3>
                <p class="text-xs text-muted-foreground">Sem pressa, você adiciona um por um.</p>
              </div>
              <ArrowRight class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              class="w-full text-muted-foreground hover:text-foreground transition-colors h-10"
              @click="handleEntryChoice('later')"
            >
              Deixa pra depois, quero explorar!
            </Button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
