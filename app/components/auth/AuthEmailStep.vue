<script setup lang="ts">
import type { OAuthStrategy } from '@clerk/types'
import { Mail } from 'lucide-vue-next'

const props = defineProps<{
  intent: 'sign-in' | 'sign-up'
  error: string
  loading: boolean
}>()

const emit = defineEmits<{
  submit: [email: string]
  oauth: [strategy: OAuthStrategy]
  'switch-intent': []
}>()

const emailInput = ref('')

const heading = computed(() =>
  props.intent === 'sign-in' ? 'Bem-vindo de volta' : 'Crie sua conta',
)

const subtitle = computed(() =>
  props.intent === 'sign-in'
    ? 'Entre para continuar gerenciando suas financas'
    : 'Comece a organizar suas financas hoje',
)

const switchText = computed(() =>
  props.intent === 'sign-in' ? 'Nao tem conta?' : 'Ja tem conta?',
)

const switchAction = computed(() =>
  props.intent === 'sign-in' ? 'Criar conta' : 'Entrar',
)

function handleSubmit() {
  if (!emailInput.value.trim()) return
  emit('submit', emailInput.value.trim())
}
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <!-- Logo -->
    <div class="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-secondary-foreground font-black text-lg shadow-elevation-2">
      Du
    </div>

    <!-- Heading -->
    <div class="text-center space-y-1.5">
      <h2 class="text-xl font-bold tracking-tight">{{ heading }}</h2>
      <p class="text-sm text-muted-foreground">{{ subtitle }}</p>
    </div>

    <!-- OAuth Buttons -->
    <AuthOAuthButtons
      :loading="loading"
      class="w-full"
      @oauth="emit('oauth', $event)"
    />

    <!-- Divider -->
    <div class="relative w-full">
      <div class="absolute inset-0 flex items-center">
        <span class="w-full border-t border-border/70" />
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="bg-background px-3 text-muted-foreground">ou</span>
      </div>
    </div>

    <!-- Email Form -->
    <form class="w-full space-y-3" @submit.prevent="handleSubmit">
      <Input
        v-model="emailInput"
        type="email"
        placeholder="seu@email.com"
        autocomplete="email"
        inputmode="email"
        :disabled="loading"
      />

      <Button
        type="submit"
        variant="secondary"
        size="lg"
        class="w-full justify-center gap-2 font-semibold"
        :disabled="loading || !emailInput.trim()"
      >
        <Mail class="size-4" />
        Continuar com e-mail
      </Button>
    </form>

    <!-- Error -->
    <p v-if="error" class="text-sm text-destructive text-center">
      {{ error }}
    </p>

    <!-- Switch intent -->
    <p class="text-sm text-muted-foreground">
      {{ switchText }}
      <button
        type="button"
        class="font-semibold text-foreground hover:underline underline-offset-4 transition-colors"
        @click="emit('switch-intent')"
      >
        {{ switchAction }}
      </button>
    </p>
  </div>
</template>
