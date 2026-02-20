<script setup lang="ts">
import { PinInputInput, PinInputRoot } from 'reka-ui'
import { ArrowLeft } from 'lucide-vue-next'

defineProps<{
  email: string
  error: string
  loading: boolean
  resendCountdown: number
}>()

const emit = defineEmits<{
  verify: [code: string]
  resend: []
  back: []
}>()

function handleComplete(values: string[]) {
  const code = values.join('')
  if (code.length === 6) {
    emit('verify', code)
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <!-- Back button -->
    <button
      type="button"
      class="self-start flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      @click="emit('back')"
    >
      <ArrowLeft class="size-4" />
      Voltar
    </button>

    <!-- Heading -->
    <div class="text-center space-y-1.5">
      <h2 class="text-xl font-bold tracking-tight">Verifique seu e-mail</h2>
      <p class="text-sm text-muted-foreground">
        Enviamos um codigo de 6 digitos para
        <span class="font-semibold text-foreground">{{ email }}</span>
      </p>
    </div>

    <!-- Pin Input -->
    <PinInputRoot
      :model-value="[]"
      :length="6"
      otp
      placeholder="○"
      class="flex items-center gap-2"
      :disabled="loading"
      @complete="handleComplete"
    >
      <PinInputInput
        v-for="(id, index) in 6"
        :key="id"
        :index="index"
        class="size-12 rounded-xl border border-border/70 bg-background/80 text-center text-lg font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/55 disabled:opacity-50 placeholder:text-muted-foreground/40"
      />
    </PinInputRoot>

    <!-- Error -->
    <p v-if="error" class="text-sm text-destructive text-center">
      {{ error }}
    </p>

    <!-- Loading indicator -->
    <p v-if="loading" class="text-sm text-muted-foreground animate-pulse">
      Verificando...
    </p>

    <!-- Resend -->
    <p class="text-sm text-muted-foreground">
      Nao recebeu o codigo?
      <button
        v-if="resendCountdown <= 0"
        type="button"
        class="font-semibold text-foreground hover:underline underline-offset-4 transition-colors"
        @click="emit('resend')"
      >
        Reenviar
      </button>
      <span v-else class="font-medium">
        Reenviar em {{ resendCountdown }}s
      </span>
    </p>
  </div>
</template>
